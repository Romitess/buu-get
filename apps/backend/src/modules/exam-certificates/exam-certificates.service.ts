import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { isFutureBangkokDate } from 'src/common/utils/calendar-date.util';
import { generateCertificateCode } from 'src/common/utils/verification-code.util';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { ExamCertificate } from './entities/exam-certificate.entity';
import { CreateExamCertificateDto } from './dto/create-exam-certificate.dto';
import { UpdateExamCertificateDto } from './dto/update-exam-certificate.dto';
import { BulkIssueCertificatesDto } from './dto/bulk-issue-certificates.dto';
import {
  getCertificateIssuedEmailSubject,
  getCertificateIssuedEmailTemplate,
} from './templates/certificate-issued-email.template';
import { ExamScore } from '../exam-scores/entities/exam-score.entity';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';

export interface BulkIssueCertificatesResult {
  success: boolean;
  createdCount: number;
  skippedCount: number;
}

interface CertificateEmailRecipient {
  email: string;
  fullName: string;
}

@Injectable()
export class ExamCertificatesService {
  private readonly logger = new Logger(ExamCertificatesService.name);
  private static readonly EMAIL_SEND_CONCURRENCY = 10;

  constructor(
    @InjectRepository(ExamCertificate)
    private readonly examCertificateRepository: Repository<ExamCertificate>,
    @InjectRepository(ExamScore)
    private readonly examScoreRepository: Repository<ExamScore>,
    @InjectRepository(ExamSession)
    private readonly examSessionRepository: Repository<ExamSession>,
    private readonly platformGatewayService: PlatformGatewayService,
    private readonly dataSource: DataSource,
  ) {}

  private assertCertificateIssueDateNotFuture(certIssuedAt?: string): void {
    if (certIssuedAt && isFutureBangkokDate(certIssuedAt)) {
      throw new BadRequestException(
        'วันที่ออกใบรับรอง (Report Issue Date) ต้องไม่เป็นวันในอนาคต',
      );
    }
  }

  private assertCertificateExpiryNotBeforeIssue(
    certIssuedAt: string,
    certExpiresAt: string,
  ): void {
    const issuedAt = new Date(certIssuedAt);
    const expiresAt = new Date(certExpiresAt);
    if (
      Number.isNaN(issuedAt.getTime()) ||
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt < issuedAt
    ) {
      throw new BadRequestException(
        'วันที่สิ้นสุดอายุผลสอบต้องไม่มาก่อนวันที่ออกใบรับรอง',
      );
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driver = error.driverError as { code?: string; errno?: number };
    return driver.code === 'ER_DUP_ENTRY' || driver.errno === 1062;
  }

  private rethrowDuplicateCertCode(error: unknown): never {
    if (this.isDuplicateKeyError(error)) {
      throw new ConflictException(
        'รหัสใบรับรอง (CERT_CODE) ซ้ำกับที่มีอยู่ในระบบ',
      );
    }
    throw error;
  }

  async create(
    createExamCertificateDto: CreateExamCertificateDto,
  ): Promise<ExamCertificate> {
    this.assertCertificateIssueDateNotFuture(
      createExamCertificateDto.CERT_ISSUED_AT,
    );

    const payload = {
      ...createExamCertificateDto,
      CERT_CODE:
        createExamCertificateDto.CERT_CODE?.trim() || generateCertificateCode(),
    };
    const newCertificate = this.examCertificateRepository.create(payload);

    let saved: ExamCertificate;
    try {
      saved = await this.examCertificateRepository.save(newCertificate);
    } catch (error: unknown) {
      this.rethrowDuplicateCertCode(error);
    }

    const score = await this.examScoreRepository.findOne({
      where: { SCORES_ID: createExamCertificateDto.SCORES_ID },
      relations: ['ENROLLMENT'],
    });

    if (score?.ENROLLMENT?.SESSION_ID) {
      await this.examSessionRepository.update(score.ENROLLMENT.SESSION_ID, {
        SS_SESSION_STATUS: ExamSessionStatus.COMPLETED,
      });
    }

    return saved;
  }

  async bulkIssueCertificates(
    dto: BulkIssueCertificatesDto,
  ): Promise<BulkIssueCertificatesResult> {
    const { candidates, certIssuedAt, certExpiresAt, examName, historyUrl } =
      dto;

    if (!candidates || candidates.length === 0) {
      return { success: true, createdCount: 0, skippedCount: 0 };
    }

    this.assertCertificateIssueDateNotFuture(certIssuedAt);
    this.assertCertificateExpiryNotBeforeIssue(certIssuedAt, certExpiresAt);

    const scoreIds = candidates.map((candidate) => candidate.SCORES_ID);
    const candidateByScoreId = new Map(
      candidates.map((candidate) => [candidate.SCORES_ID, candidate]),
    );

    let createdCount = 0;
    let skippedCount = 0;
    let emailRecipients: CertificateEmailRecipient[] = [];

    emailRecipients = await this.dataSource.transaction(async (manager) => {
      const scoreRepository = manager.getRepository(ExamScore);
      const certificateRepository = manager.getRepository(ExamCertificate);
      const sessionRepository = manager.getRepository(ExamSession);

      const scores = await scoreRepository.find({
        where: { SCORES_ID: In(scoreIds) },
        relations: [
          'ENROLLMENT',
          'ENROLLMENT.USER',
          'ENROLLMENT.USER.PROFILE',
          'ENROLLMENT.SESSION',
          'CERTIFICATES',
        ],
      });

      if (scores.length === 0) {
        throw new BadRequestException('ไม่พบข้อมูลคะแนนสำหรับออกใบรับรอง');
      }

      const foundScoreIds = new Set(scores.map((score) => score.SCORES_ID));
      const missingScoreIds = scoreIds.filter((id) => !foundScoreIds.has(id));
      if (missingScoreIds.length > 0) {
        throw new BadRequestException(
          `ไม่พบข้อมูลคะแนน SCORES_ID: ${missingScoreIds.join(', ')}`,
        );
      }

      const recipients: CertificateEmailRecipient[] = [];
      const sessionIdsToUpdate = new Set<number>();
      const certificatesToCreate: ExamCertificate[] = [];

      for (const score of scores) {
        const candidate = candidateByScoreId.get(score.SCORES_ID);
        if (!candidate) {
          continue;
        }

        const enrollmentUserId = score.ENROLLMENT?.USER_ID;
        if (
          enrollmentUserId != null &&
          enrollmentUserId !== candidate.USER_ID
        ) {
          throw new BadRequestException(
            `USER_ID ไม่ตรงกับคะแนน SCORES_ID ${score.SCORES_ID}`,
          );
        }

        if (score.CERTIFICATES && score.CERTIFICATES.length > 0) {
          skippedCount += 1;
          continue;
        }

        certificatesToCreate.push(
          certificateRepository.create({
            SCORES_ID: score.SCORES_ID,
            USER_ID: candidate.USER_ID,
            CERT_ISSUED_AT: new Date(certIssuedAt),
            CERT_EXPIRES_AT: new Date(certExpiresAt),
            CERT_CODE: generateCertificateCode(),
          }),
        );

        const user = score.ENROLLMENT?.USER;
        const email = user?.USER_EMAIL?.trim();
        if (email) {
          const prefix = user?.PROFILE?.userTitleTh || '';
          const fullname = user?.PROFILE?.userFullnameTh || '';
          const fullName = `${prefix} ${fullname}`.trim() || 'ผู้เข้าสอบ';
          recipients.push({ email, fullName });
        } else {
          this.logger.warn(
            `[CertificateMail] No email for USER_ID ${candidate.USER_ID}, certificate will still be created`,
          );
        }

        const sessionId = score.ENROLLMENT?.SESSION_ID;
        if (sessionId) {
          sessionIdsToUpdate.add(sessionId);
        }
      }

      if (certificatesToCreate.length > 0) {
        try {
          await certificateRepository.save(certificatesToCreate);
        } catch (error: unknown) {
          this.rethrowDuplicateCertCode(error);
        }
        createdCount = certificatesToCreate.length;
      }

      if (sessionIdsToUpdate.size > 0) {
        const sessions = await sessionRepository.find({
          where: { SS_ID: In([...sessionIdsToUpdate]) },
        });

        const sessionsToUpdate = sessions.filter(
          (session) =>
            session.SS_SESSION_STATUS !== ExamSessionStatus.COMPLETED,
        );

        if (sessionsToUpdate.length > 0) {
          for (const session of sessionsToUpdate) {
            session.SS_SESSION_STATUS = ExamSessionStatus.COMPLETED;
          }
          await sessionRepository.save(sessionsToUpdate);
        }
      }

      return recipients;
    });

    if (emailRecipients.length > 0) {
      this.sendCertificateEmailsInBatch(
        emailRecipients,
        examName,
        historyUrl,
      ).catch((err: unknown) => {
        this.logger.error(
          '[CertificateMail] Unhandled error during bulk email dispatch:',
          err,
        );
      });
    }

    return {
      success: true,
      createdCount,
      skippedCount,
    };
  }

  private async sendCertificateEmailsInBatch(
    recipients: CertificateEmailRecipient[],
    examName: string,
    historyUrl: string,
  ): Promise<void> {
    const limit = ExamCertificatesService.EMAIL_SEND_CONCURRENCY;
    const items = [...recipients];
    const subject = getCertificateIssuedEmailSubject(examName);

    const worker = async (): Promise<void> => {
      while (items.length > 0) {
        const recipient = items.shift();
        if (!recipient) {
          continue;
        }

        const htmlContent = getCertificateIssuedEmailTemplate({
          fullName: recipient.fullName,
          examName,
          historyUrl,
        });

        try {
          await this.platformGatewayService.sendEmail(
            'BUU-GET',
            recipient.email,
            subject,
            htmlContent,
          );
        } catch (error) {
          this.logger.error(
            `[CertificateMail] Failed to send email to ${recipient.email}:`,
            error,
          );
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(limit, recipients.length) },
      () => worker(),
    );
    await Promise.all(workers);
    this.logger.log(
      `[CertificateMail] Finished processing ${recipients.length} certificate emails.`,
    );
  }

  async findAll(): Promise<ExamCertificate[]> {
    return await this.examCertificateRepository.find({
      relations: ['SCORE', 'USER'],
    });
  }

  async findOne(id: number): Promise<ExamCertificate> {
    const certificate = await this.examCertificateRepository.findOne({
      where: { CERT_ID: id },
      relations: ['SCORE', 'USER'],
    });
    if (!certificate) {
      throw new NotFoundException(`ExamCertificate with ID ${id} not found`);
    }
    return certificate;
  }

  async update(
    id: number,
    updateExamCertificateDto: UpdateExamCertificateDto,
  ): Promise<ExamCertificate> {
    this.assertCertificateIssueDateNotFuture(
      updateExamCertificateDto.CERT_ISSUED_AT,
    );

    const certificate = await this.findOne(id);
    Object.assign(certificate, updateExamCertificateDto);
    try {
      return await this.examCertificateRepository.save(certificate);
    } catch (error: unknown) {
      this.rethrowDuplicateCertCode(error);
    }
  }

  async remove(id: number): Promise<void> {
    const certificate = await this.findOne(id);
    await this.examCertificateRepository.softRemove(certificate);
  }
}
