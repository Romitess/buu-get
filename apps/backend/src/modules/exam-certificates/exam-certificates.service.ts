import { Readable } from 'stream';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { EXAM_ADMIN_ROLES } from 'src/common/constants/role-groups';
import {
  assertSelfOrRoles,
  AuthenticatedUser,
} from 'src/common/utils/authz.util';
import {
  buildCertificatePdf,
  buildCertificateVerifyUrl,
  CertificateScoreLinePdf,
} from 'src/common/utils/build-certificate-pdf.util';
import { isFutureBangkokDate } from 'src/common/utils/calendar-date.util';
import { generateCertificateCode } from 'src/common/utils/verification-code.util';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { ScoreCriteriaService } from '../score-criteria/score-criteria.service';
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

interface PreparedCertificate {
  scoreId: number;
  userId: number;
  code: string;
  filePath: string;
  sessionId?: number;
  recipient?: CertificateEmailRecipient;
}

const CERTIFICATE_FOLDER = '/certificates';
const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

async function readableToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    if (chunk instanceof Uint8Array) {
      chunks.push(chunk);
      continue;
    }
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks);
}

function formatEnglishDate(value?: string | Date | null): string {
  if (!value) {
    return '-';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const day = parts.find((part) => part.type === 'day')?.value;
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const year = parts.find((part) => part.type === 'year')?.value;
  if (!day || !year || !Number.isInteger(month) || month < 1 || month > 12) {
    return '-';
  }
  return `${day} ${ENGLISH_MONTHS[month - 1]} ${year}`;
}

function formatScore(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return Number.isInteger(value) ? String(value) : String(value);
}

function formatExamInstanceLabel(
  examRound?: string | null,
  fiscalYear?: string | null,
): string {
  const round = examRound?.trim() ?? '';
  const year = fiscalYear?.trim() ?? '';
  if (round && year) {
    return `${round}/${year}`;
  }
  return round || year || '-';
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
    private readonly scoreCriteriaService: ScoreCriteriaService,
    private readonly configService: ConfigService,
  ) {}

  /** เปิดด้วย BUU_ESIGN_PUBLIC_CERT_ENABLED=true — ค่าอื่นถือว่าปิด */
  private isPublicCertSignEnabled(): boolean {
    return (
      this.configService.get<string>('BUU_ESIGN_PUBLIC_CERT_ENABLED') === 'true'
    );
  }

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

    const scores = await this.examScoreRepository.find({
      where: { SCORES_ID: In(scoreIds) },
      relations: [
        'LINES',
        'ENROLLMENT',
        'ENROLLMENT.USER',
        'ENROLLMENT.USER.PROFILE',
        'ENROLLMENT.USER.IMAGE',
        'ENROLLMENT.SESSION',
        'ENROLLMENT.SESSION.EXAM',
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

    let skippedCount = 0;
    const scoresToIssue: ExamScore[] = [];
    for (const score of scores) {
      const candidate = candidateByScoreId.get(score.SCORES_ID);
      if (!candidate) {
        continue;
      }

      const enrollmentUserId = score.ENROLLMENT?.USER_ID;
      if (enrollmentUserId != null && enrollmentUserId !== candidate.USER_ID) {
        throw new BadRequestException(
          `USER_ID ไม่ตรงกับคะแนน SCORES_ID ${score.SCORES_ID}`,
        );
      }

      if (score.CERTIFICATES && score.CERTIFICATES.length > 0) {
        skippedCount += 1;
        continue;
      }

      scoresToIssue.push(score);
    }

    if (scoresToIssue.length === 0) {
      return { success: true, createdCount: 0, skippedCount };
    }

    const { bandRules } = await this.scoreCriteriaService.getBandRules();
    const uploadedPaths: string[] = [];
    const prepared: PreparedCertificate[] = [];
    const publicCertSignEnabled = this.isPublicCertSignEnabled();
    if (!publicCertSignEnabled) {
      this.logger.warn(
        'Public certificate signing is disabled; certificates will be stored unsigned',
      );
    }

    try {
      for (const score of scoresToIssue) {
        const candidate = candidateByScoreId.get(score.SCORES_ID);
        if (!candidate) {
          continue;
        }
        const code = generateCertificateCode();
        const issuedAt = new Date(certIssuedAt);
        const expiresAt = new Date(certExpiresAt);
        const pdf = await this.buildSignedCertificatePdf(
          score,
          code,
          issuedAt,
          expiresAt,
          bandRules,
        );
        const fileName = `${code}.pdf`;
        const uploadResult = (await this.platformGatewayService.uploadBuffer(
          pdf,
          fileName,
          {
            path: CERTIFICATE_FOLDER,
            fileName,
            forceFileName: true,
            bucket: 'buu-get.storage',
          },
        )) as {
          result?: unknown;
          filename?: unknown;
          path?: unknown;
        };
        const filePath = this.normalizeUploadedPath(uploadResult);
        uploadedPaths.push(filePath);
        if (publicCertSignEnabled) {
          await this.platformGatewayService.signElectronicSignaturePublicCert(
            filePath,
          );
        }

        const user = score.ENROLLMENT?.USER;
        const email = user?.USER_EMAIL?.trim();
        let recipient: CertificateEmailRecipient | undefined;
        if (email) {
          const prefix = user?.PROFILE?.userTitleTh || '';
          const fullname = user?.PROFILE?.userFullnameTh || '';
          recipient = {
            email,
            fullName: `${prefix} ${fullname}`.trim() || 'ผู้เข้าสอบ',
          };
        } else {
          this.logger.warn(
            `[CertificateMail] No email for USER_ID ${candidate.USER_ID}, certificate will still be created`,
          );
        }

        prepared.push({
          scoreId: score.SCORES_ID,
          userId: candidate.USER_ID,
          code,
          filePath,
          sessionId: score.ENROLLMENT?.SESSION_ID,
          recipient,
        });
      }
    } catch (error: unknown) {
      await this.deleteUploadedCertificates(uploadedPaths);
      this.rethrowIssueFailure(error);
    }

    let emailRecipients: CertificateEmailRecipient[] = [];
    try {
      emailRecipients = await this.dataSource.transaction(async (manager) => {
        const certificateRepository = manager.getRepository(ExamCertificate);
        const sessionRepository = manager.getRepository(ExamSession);
        const certificatesToCreate = prepared.map((item) =>
          certificateRepository.create({
            SCORES_ID: item.scoreId,
            USER_ID: item.userId,
            CERT_ISSUED_AT: new Date(certIssuedAt),
            CERT_EXPIRES_AT: new Date(certExpiresAt),
            CERT_CODE: item.code,
            CERT_FILE_PATH: item.filePath,
          }),
        );

        try {
          await certificateRepository.save(certificatesToCreate);
        } catch (error: unknown) {
          this.rethrowDuplicateCertCode(error);
        }

        const sessionIdsToUpdate = new Set(
          prepared
            .map((item) => item.sessionId)
            .filter((id): id is number => id != null),
        );
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

        return prepared
          .map((item) => item.recipient)
          .filter((recipient): recipient is CertificateEmailRecipient =>
            Boolean(recipient),
          );
      });
    } catch (error: unknown) {
      await this.deleteUploadedCertificates(uploadedPaths);
      this.rethrowDuplicateCertCode(error);
    }

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
      createdCount: prepared.length,
      skippedCount,
    };
  }

  async downloadCertificate(
    id: number,
    user: AuthenticatedUser,
  ): Promise<Uint8Array> {
    const certificate = await this.examCertificateRepository.findOne({
      where: { CERT_ID: id },
    });
    if (!certificate) {
      throw new NotFoundException(`ExamCertificate with ID ${id} not found`);
    }

    assertSelfOrRoles(
      user,
      certificate.USER_ID,
      EXAM_ADMIN_ROLES,
      'Access denied: certificate does not belong to you',
    );

    if (!certificate.CERT_FILE_PATH?.startsWith('/')) {
      throw new NotFoundException('ใบประกาศนี้ยังไม่มีไฟล์ลงนาม');
    }

    const { stream } = await this.platformGatewayService.getPublicFileStream(
      certificate.CERT_FILE_PATH,
    );
    const buffer = await readableToBuffer(stream);
    return new Uint8Array(buffer);
  }

  private async buildSignedCertificatePdf(
    score: ExamScore,
    code: string,
    issuedAt: Date,
    expiresAt: Date,
    bandRules: Awaited<
      ReturnType<ScoreCriteriaService['getBandRules']>
    >['bandRules'],
  ): Promise<Buffer> {
    const enrollment = score.ENROLLMENT;
    const user = enrollment?.USER;
    const profile = user?.PROFILE;
    const exam = enrollment?.SESSION?.EXAM;
    const fullNameRaw =
      profile?.userFullnameEn ||
      profile?.userFullnameTh ||
      user?.USER_EMAIL ||
      '-';
    const title = profile?.userTitleEn || profile?.userTitleTh || '';
    const scoreLines = this.buildScoreLines(score);
    const totalMax = scoreLines.reduce((sum, line) => sum + line.maxScore, 0);
    const total = Number(
      score.SC_TOTAL_SCORE ??
        scoreLines.reduce((sum, line) => sum + line.score, 0),
    );
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:9000';

    return buildCertificatePdf({
      fullName: `${title} ${fullNameRaw}`.trim(),
      testTakerId: enrollment?.ERM_TEST_TAKER || user?.USER_CODE || '-',
      nationalId: user?.USER_NATIONAL_ID || user?.USER_PASSPORT_NO || '-',
      testSession: formatExamInstanceLabel(
        exam?.EXAM_ROUND,
        exam?.EXAM_FISCAL_YEAR,
      ),
      testDate: formatEnglishDate(exam?.EXAM_DATE),
      scoreLines,
      totalScore: `${formatScore(total)}/${formatScore(totalMax)}`,
      bandLevel:
        score.SC_BAND_LEVEL === null || score.SC_BAND_LEVEL === undefined
          ? '-'
          : String(score.SC_BAND_LEVEL),
      reportIssueDate: formatEnglishDate(issuedAt),
      scoreValidUntil: formatEnglishDate(expiresAt),
      certificateCode: code,
      verifyUrl: buildCertificateVerifyUrl(frontendUrl, code),
      photoBytes: await this.loadProfilePhoto(user?.IMAGE?.USER_IMAGE_URL),
      bandRules: bandRules.map((rule) => ({
        band: rule.band,
        minScore: rule.minScore,
        maxScore: rule.maxScore,
        cefr: rule.cefr,
        descriptor: rule.descriptor,
      })),
    });
  }

  private buildScoreLines(score: ExamScore): CertificateScoreLinePdf[] {
    if (score.LINES?.length) {
      return [...score.LINES]
        .sort((a, b) => a.SCL_SORT_ORDER - b.SCL_SORT_ORDER)
        .map((line) => ({
          nameEn: line.SCL_NAME_EN,
          score: Number(line.SCL_SCORE ?? 0),
          maxScore: Number(line.SCL_MAX_SCORE),
        }));
    }

    return [
      {
        nameEn: 'Vocabulary & Grammar',
        score: Number(score.SC_LANG_USE_SCORE ?? 0),
        maxScore: 50,
      },
      {
        nameEn: 'Reading',
        score: Number(score.SC_READING_SCORE ?? 0),
        maxScore: 50,
      },
    ];
  }

  private async loadProfilePhoto(
    path?: string | null,
  ): Promise<Uint8Array | null> {
    if (!path) {
      return null;
    }
    try {
      const { stream } =
        await this.platformGatewayService.getPublicFileStream(path);
      return new Uint8Array(await readableToBuffer(stream));
    } catch (error: unknown) {
      this.logger.warn(
        `Certificate photo unavailable at ${path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private normalizeUploadedPath(uploadResult: unknown): string {
    const body = uploadResult as
      | { result?: unknown; filename?: unknown; path?: unknown }
      | undefined;
    const filePath = body?.result || body?.filename || body?.path;
    if (typeof filePath !== 'string' || !filePath.trim()) {
      throw new ServiceUnavailableException('อัปโหลดไฟล์ใบประกาศไม่สำเร็จ');
    }
    return filePath.startsWith('/')
      ? filePath
      : `/${filePath.replace(/^\/+/, '')}`;
  }

  private async deleteUploadedCertificates(paths: string[]): Promise<void> {
    for (const filePath of paths) {
      try {
        await this.platformGatewayService.deleteFile(filePath);
      } catch (error: unknown) {
        this.logger.error(
          `Failed to delete certificate file ${filePath}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private rethrowIssueFailure(error: unknown): never {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: unknown }).message;
      const text = Array.isArray(message) ? message.join(', ') : message;
      if (typeof text === 'string' && !text.startsWith('Upstream API')) {
        throw error;
      }
    }
    throw new ServiceUnavailableException(
      'ลงนามใบประกาศด้วย Public Certificate ไม่สำเร็จ',
    );
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
