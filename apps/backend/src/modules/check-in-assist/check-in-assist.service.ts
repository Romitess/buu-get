import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  CheckInAssistEvent,
  CheckInAssistEventType,
} from './entities/check-in-assist-event.entity';
import {
  CheckInAssistSession,
  CheckInAssistSessionStatus,
} from './entities/check-in-assist-session.entity';
import { CreateCheckInAssistSessionDto } from './dto/create-check-in-assist-session.dto';
import {
  AssistCandidateSummaryDto,
  AssistEventDto,
  CheckInAssistSessionMetaDto,
  CloseAssistSessionResponseDto,
  CreateCheckInAssistSessionResponseDto,
  ListAssistEventsResponseDto,
} from './dto/check-in-assist-response.dto';
import { ExamEnrollmentsService } from '../exam-enrollments/exam-enrollments.service';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { Exam } from '../exam/entities/exam.entity';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import {
  isValidAssistScanCode,
  normalizeAssistScanCode,
} from './utils/normalize-assist-scan-code.util';

const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const EVENTS_BATCH_LIMIT = 50;

@Injectable()
export class CheckInAssistService {
  constructor(
    @InjectRepository(CheckInAssistSession)
    private readonly sessionRepository: Repository<CheckInAssistSession>,
    @InjectRepository(CheckInAssistEvent)
    private readonly eventRepository: Repository<CheckInAssistEvent>,
    @InjectRepository(ExamEnrollment)
    private readonly enrollmentRepository: Repository<ExamEnrollment>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    private readonly examEnrollmentsService: ExamEnrollmentsService,
    private readonly dataSource: DataSource,
  ) {}

  async createSession(
    user: AuthenticatedUser,
    dto: CreateCheckInAssistSessionDto,
  ): Promise<CreateCheckInAssistSessionResponseDto> {
    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: dto.examId },
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${dto.examId} not found`);
    }

    const joinToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = this.sessionRepository.create({
      EXAM_ID: dto.examId,
      HOST_USER_ID: user.userId,
      JOIN_TOKEN: joinToken,
      STATUS: CheckInAssistSessionStatus.ACTIVE,
      EXPIRES_AT: expiresAt,
    });
    session.setSessionIds(dto.sessionIds);

    const saved = await this.sessionRepository.save(session);
    return {
      casId: saved.CAS_ID,
      joinToken: saved.JOIN_TOKEN,
      expiresAt: saved.EXPIRES_AT.toISOString(),
    };
  }

  async getSessionByToken(
    joinToken: string,
  ): Promise<CheckInAssistSessionMetaDto> {
    const session = await this.findSessionByToken(joinToken);
    this.assertSessionUsable(session);

    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: session.EXAM_ID },
    });

    return {
      casId: session.CAS_ID,
      examId: session.EXAM_ID,
      examName: exam?.EXAM_NAME,
      status: session.STATUS,
      expiresAt: session.EXPIRES_AT.toISOString(),
    };
  }

  async listEvents(
    casId: number,
    afterSeq: number,
  ): Promise<ListAssistEventsResponseDto> {
    const session = await this.findSessionById(casId);
    this.assertSessionUsable(session);

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.CAS_ID = :casId', { casId })
      .orderBy('event.SEQ', 'ASC')
      .take(EVENTS_BATCH_LIMIT);

    if (afterSeq > 0) {
      qb.andWhere('event.SEQ > :afterSeq', { afterSeq });
    }

    const filtered = await qb.getMany();

    const latestSeq =
      filtered.length > 0 ? filtered[filtered.length - 1].SEQ : afterSeq;

    return {
      events: filtered.map((event) => this.toAssistEventDto(event)),
      latestSeq,
    };
  }

  async submitScan(
    casId: number,
    user: AuthenticatedUser,
    rawCode: string,
  ): Promise<AssistEventDto> {
    const session = await this.findSessionById(casId);
    this.assertSessionUsable(session);

    const normalized = normalizeAssistScanCode(rawCode);
    if (!isValidAssistScanCode(normalized)) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.INVALID_CODE,
        scannedCode: rawCode.trim().slice(0, 64),
        scannerUserId: user.userId,
        ermId: null,
        candidate: undefined,
      });
    }

    const enrollment = await this.resolveEnrollment(
      session.EXAM_ID,
      session.getSessionIds(),
      normalized,
    );

    if (!enrollment) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.NOT_FOUND,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: null,
        candidate: undefined,
      });
    }

    const candidateSummary = this.buildCandidateSummary(enrollment);

    if (enrollment.ERM_STATUS === ExamEnrollmentStatus.ATTENDED) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.ALREADY_CHECKED_IN,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
        candidate: {
          ...candidateSummary,
          attendanceStatus: ExamEnrollmentStatus.ATTENDED,
        },
      });
    }

    if (
      enrollment.ERM_STATUS === ExamEnrollmentStatus.UNPAID ||
      enrollment.ERM_STATUS === ExamEnrollmentStatus.CANCELLED
    ) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.NOT_FOUND,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
        candidate: undefined,
      });
    }

    try {
      const checkedIn = await this.examEnrollmentsService.checkIn(
        enrollment.ERM_ID,
        {},
      );
      const refreshedSummary = this.buildCandidateSummary(checkedIn);
      return this.appendEvent(session, {
        type: CheckInAssistEventType.CHECKED_IN,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: checkedIn.ERM_ID,
        candidate: {
          ...refreshedSummary,
          attendanceStatus: ExamEnrollmentStatus.ATTENDED,
        },
      });
    } catch {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.NOT_FOUND,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
        candidate: undefined,
      });
    }
  }

  async closeSession(
    casId: number,
    user: AuthenticatedUser,
  ): Promise<CloseAssistSessionResponseDto> {
    const session = await this.findSessionById(casId);
    if (session.HOST_USER_ID !== user.userId) {
      throw new BadRequestException('เฉพาะ host เท่านั้นที่ปิด session นี้ได้');
    }

    session.STATUS = CheckInAssistSessionStatus.CLOSED;
    await this.sessionRepository.save(session);
    return { status: CheckInAssistSessionStatus.CLOSED };
  }

  private async findSessionById(casId: number): Promise<CheckInAssistSession> {
    const session = await this.sessionRepository.findOne({
      where: { CAS_ID: casId },
    });
    if (!session) {
      throw new NotFoundException(`Assist session ${casId} not found`);
    }
    return session;
  }

  private async findSessionByToken(
    joinToken: string,
  ): Promise<CheckInAssistSession> {
    const session = await this.sessionRepository.findOne({
      where: { JOIN_TOKEN: joinToken },
    });
    if (!session) {
      throw new NotFoundException('Assist session not found');
    }
    return session;
  }

  private assertSessionUsable(session: CheckInAssistSession): void {
    if (session.STATUS === CheckInAssistSessionStatus.CLOSED) {
      throw new GoneException('Assist session is closed');
    }
    if (session.EXPIRES_AT.getTime() <= Date.now()) {
      throw new GoneException('Assist session has expired');
    }
  }

  private async resolveEnrollment(
    examId: number,
    sessionIds: number[],
    code: string,
  ): Promise<ExamEnrollment | null> {
    if (sessionIds.length === 0) {
      return null;
    }

    return this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoinAndSelect('enrollment.SESSION', 'session')
      .leftJoinAndSelect('session.EXAM', 'exam')
      .leftJoinAndSelect('enrollment.USER', 'user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .leftJoinAndSelect('user.IMAGE', 'image')
      .leftJoinAndSelect('enrollment.VOUCHERS', 'vouchers')
      .leftJoinAndSelect('enrollment.SESSION_LOCATION', 'sessionLocation')
      .leftJoinAndSelect('sessionLocation.LOCATION', 'location')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.SESSION_ID IN (:...sessionIds)', { sessionIds })
      .andWhere('enrollment.ERM_STATUS != :cancelled', {
        cancelled: ExamEnrollmentStatus.CANCELLED,
      })
      .andWhere(
        new Brackets((inner) => {
          inner
            .where('user.USER_NATIONAL_ID = :code', { code })
            .orWhere('user.USER_PASSPORT_NO = :code', { code })
            .orWhere('enrollment.ERM_TEST_TAKER = :code', { code });
        }),
      )
      .getOne();
  }

  private buildCandidateSummary(
    enrollment: ExamEnrollment,
  ): AssistCandidateSummaryDto {
    const profile = enrollment.USER?.PROFILE;
    const examRound = enrollment.SESSION?.EXAM?.EXAM_ROUND ?? null;
    const fiscalYear = enrollment.SESSION?.EXAM?.EXAM_FISCAL_YEAR ?? null;
    const testSession =
      examRound && fiscalYear
        ? `${examRound}/${fiscalYear}`
        : examRound || fiscalYear || null;

    return {
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.USER?.USER_NATIONAL_ID ?? undefined,
      passportNo: enrollment.USER?.USER_PASSPORT_NO ?? null,
      testTakerCode: enrollment.ERM_TEST_TAKER ?? null,
      titleTh: profile?.userTitleTh ?? '-',
      fullnameTh: profile?.userFullnameTh ?? '-',
      titleEn: profile?.userTitleEn ?? null,
      fullnameEn: profile?.userFullnameEn ?? null,
      seatNumber: enrollment.ERM_SEAT_LABEL ?? '-',
      profileImage: enrollment.USER?.IMAGE?.USER_IMAGE_URL ?? null,
      voucherNo: enrollment.VOUCHERS?.[0]?.VC_CODE ?? null,
      examType: enrollment.SESSION?.EXAM?.EXAM_TYPE ?? null,
      testSession,
      attendanceStatus: enrollment.ERM_STATUS,
    };
  }

  private async appendEvent(
    session: CheckInAssistSession,
    input: {
      type: CheckInAssistEventType;
      scannedCode: string;
      scannerUserId: number;
      ermId: number | null;
      candidate?: AssistCandidateSummaryDto | undefined;
    },
  ): Promise<AssistEventDto> {
    return this.dataSource.transaction(async (manager) => {
      const lockedSession = await manager.findOne(CheckInAssistSession, {
        where: { CAS_ID: session.CAS_ID },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedSession) {
        throw new NotFoundException(
          `Assist session ${session.CAS_ID} not found`,
        );
      }
      this.assertSessionUsable(lockedSession);

      const maxSeqRow = await manager
        .createQueryBuilder(CheckInAssistEvent, 'event')
        .select('MAX(event.SEQ)', 'maxSeq')
        .where('event.CAS_ID = :casId', { casId: session.CAS_ID })
        .getRawOne<{ maxSeq: string | null }>();

      const nextSeq = (Number(maxSeqRow?.maxSeq ?? 0) || 0) + 1;
      const payload = input.candidate ? JSON.stringify(input.candidate) : null;

      const saved = await manager.save(
        manager.create(CheckInAssistEvent, {
          CAS_ID: session.CAS_ID,
          SEQ: nextSeq,
          EVENT_TYPE: input.type,
          SCANNED_CODE: input.scannedCode,
          ERM_ID: input.ermId,
          SCANNER_USER_ID: input.scannerUserId,
          PAYLOAD_JSON: payload,
        }),
      );

      return this.toAssistEventDto(saved);
    });
  }

  private toAssistEventDto(event: CheckInAssistEvent): AssistEventDto {
    let candidate: AssistCandidateSummaryDto | undefined;
    if (event.PAYLOAD_JSON) {
      try {
        candidate = JSON.parse(event.PAYLOAD_JSON) as AssistCandidateSummaryDto;
      } catch {
        candidate = undefined;
      }
    }

    return {
      seq: event.SEQ,
      type: event.EVENT_TYPE,
      scannedCode: event.SCANNED_CODE,
      scannerUserId: event.SCANNER_USER_ID,
      at: event.CREATED_AT.toISOString(),
      ...(candidate ? { candidate } : {}),
    };
  }
}
