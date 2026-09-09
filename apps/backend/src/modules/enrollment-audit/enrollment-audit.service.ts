import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionStatusHistory } from '../transaction-status-history/entities/transaction-status-history.entity';
import { ProfileEditHistory } from '../profile-edit-history/entities/profile-edit-history.entity';
import { ExamPasscodeLog } from '../exam/entities/exam-passcode-log.entity';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import {
  ExamEnrollmentAuditLog,
  EnrollmentAuditCategory,
} from './entities/exam-enrollment-audit-log.entity';
import { RecordEnrollmentAuditInput } from './dto/record-enrollment-audit.dto';
import {
  EnrollmentAuditEventsQueryDto,
  EnrollmentAuditListQueryDto,
  EnrollmentAuditApplicantsQueryDto,
} from './dto/enrollment-audit-query.dto';

export interface EnrollmentAuditListItem {
  ermId: number;
  userId: number;
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  sessionId: number;
  sessionStart: string | null;
  sessionEnd: string | null;
  nationalId: string | null;
  testTakerCode: string | null;
  fullnameTh: string | null;
  fullnameEn: string | null;
  ermStatus: number;
  verifyStatus: number;
  createdAt: Date;
}

export interface EnrollmentAuditApplicantListItem {
  userId: number;
  fullnameTh: string | null;
  fullnameEn: string | null;
  nationalId: string | null;
  enrollmentCount: number;
  latestEnrollmentAt: Date | string;
}

export interface EnrollmentAuditApplicantEnrollmentDto {
  ermId: number;
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  examDate: string | null;
  sessionId: number;
  sessionStart: string | null;
  sessionEnd: string | null;
  ermStatus: number;
  testTakerCode: string | null;
  createdAt: Date;
}

export interface EnrollmentAuditActorDto {
  type: string;
  userId: number | null;
  name: string | null;
}

export interface EnrollmentAuditContextDto {
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  examDate: string | null;
  examFee: number | null;
  sessionId: number | null;
  sessionStart: string | null;
  sessionEnd: string | null;
  seatLabel: string | null;
  testTakerCode: string | null;
}

export interface EnrollmentAuditPaymentDto {
  tranxId: number;
  amount: number | null;
  qrCode: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  channel: number | null;
  receiptNo: string | null;
  receiptStatus: number | null;
}

export interface EnrollmentAuditEventDto {
  id: string;
  source: 'audit' | 'transaction' | 'profile' | 'passcode';
  eventType: string;
  category: string;
  occurredAt: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: EnrollmentAuditActorDto;
  message: string | null;
  payload: Record<string, unknown> | null;
  ref: { type: string; id: number } | null;
  context?: EnrollmentAuditContextDto;
  payment?: EnrollmentAuditPaymentDto | null;
}

export interface EnrollmentAuditSummaryDto {
  ermId: number;
  userId: number;
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  examDate: string | null;
  examFee: number | null;
  sessionId: number;
  sessionStart: string | null;
  sessionEnd: string | null;
  nationalId: string | null;
  testTakerCode: string | null;
  fullnameTh: string | null;
  fullnameEn: string | null;
  ermStatus: number;
  verifyStatus: number;
  seatLabel: string | null;
  paidAmount: number | null;
  latestTranxAmount: number | null;
  createdAt: Date;
}

@Injectable()
export class EnrollmentAuditService {
  constructor(
    @InjectRepository(ExamEnrollmentAuditLog)
    private readonly auditRepository: Repository<ExamEnrollmentAuditLog>,
    @InjectRepository(ExamEnrollment)
    private readonly enrollmentRepository: Repository<ExamEnrollment>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionStatusHistory)
    private readonly tshRepository: Repository<TransactionStatusHistory>,
    @InjectRepository(ProfileEditHistory)
    private readonly profileHistoryRepository: Repository<ProfileEditHistory>,
    @InjectRepository(ExamPasscodeLog)
    private readonly passcodeLogRepository: Repository<ExamPasscodeLog>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async record(
    input: RecordEnrollmentAuditInput,
    manager?: EntityManager,
  ): Promise<ExamEnrollmentAuditLog> {
    const repo = manager
      ? manager.getRepository(ExamEnrollmentAuditLog)
      : this.auditRepository;

    const row = repo.create({
      ERM_ID: input.ermId,
      USER_ID: input.userId,
      EXAM_ID: input.examId ?? null,
      SESSION_ID: input.sessionId ?? null,
      EAL_EVENT_TYPE: input.eventType,
      EAL_CATEGORY: input.category,
      EAL_FROM_STATUS: input.fromStatus ?? null,
      EAL_TO_STATUS: input.toStatus ?? null,
      EAL_ACTOR_TYPE: input.actorType,
      EAL_ACTOR_USER_ID: input.actorUserId ?? null,
      EAL_ACTOR_NAME: input.actorName ?? null,
      EAL_MESSAGE: input.message ?? null,
      EAL_PAYLOAD: input.payload ? JSON.stringify(input.payload) : null,
      EAL_REF_TYPE: input.refType ?? null,
      EAL_REF_ID: input.refId ?? null,
    });

    return repo.save(row);
  }

  async recordMany(
    inputs: RecordEnrollmentAuditInput[],
    manager?: EntityManager,
  ): Promise<void> {
    if (inputs.length === 0) return;
    const repo = manager
      ? manager.getRepository(ExamEnrollmentAuditLog)
      : this.auditRepository;

    const rows = inputs.map((input) =>
      repo.create({
        ERM_ID: input.ermId,
        USER_ID: input.userId,
        EXAM_ID: input.examId ?? null,
        SESSION_ID: input.sessionId ?? null,
        EAL_EVENT_TYPE: input.eventType,
        EAL_CATEGORY: input.category,
        EAL_FROM_STATUS: input.fromStatus ?? null,
        EAL_TO_STATUS: input.toStatus ?? null,
        EAL_ACTOR_TYPE: input.actorType,
        EAL_ACTOR_USER_ID: input.actorUserId ?? null,
        EAL_ACTOR_NAME: input.actorName ?? null,
        EAL_MESSAGE: input.message ?? null,
        EAL_PAYLOAD: input.payload ? JSON.stringify(input.payload) : null,
        EAL_REF_TYPE: input.refType ?? null,
        EAL_REF_ID: input.refId ?? null,
      }),
    );

    await repo.save(rows);
  }

  async findEnrollments(
    query: EnrollmentAuditListQueryDto,
  ): Promise<PaginatedResponse<EnrollmentAuditListItem>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;

    const qb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoinAndSelect('enrollment.USER', 'user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .leftJoinAndSelect('enrollment.SESSION', 'session')
      .leftJoinAndSelect('session.EXAM', 'exam')
      .orderBy('enrollment.CREATED_AT', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.examId != null) {
      qb.andWhere('session.EXAM_ID = :examId', { examId: query.examId });
    }
    if (query.sessionId != null) {
      qb.andWhere('enrollment.SESSION_ID = :sessionId', {
        sessionId: query.sessionId,
      });
    }
    if (query.status != null) {
      qb.andWhere('enrollment.ERM_STATUS = :status', { status: query.status });
    }
    if (query.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(COALESCE(profile.userFullnameTh, '')) LIKE :search
          OR LOWER(COALESCE(profile.userFullnameEn, '')) LIKE :search
          OR LOWER(COALESCE(user.USER_NATIONAL_ID, '')) LIKE :search
          OR LOWER(COALESCE(user.USER_PASSPORT_NO, '')) LIKE :search
          OR LOWER(COALESCE(enrollment.ERM_TEST_TAKER, '')) LIKE :search)`,
        { search },
      );
    }

    const [rows, total] = await qb.getManyAndCount();

    const data: EnrollmentAuditListItem[] = rows.map((enrollment) => ({
      ermId: enrollment.ERM_ID,
      userId: enrollment.USER_ID,
      examId: enrollment.SESSION?.EXAM_ID ?? null,
      examName: enrollment.SESSION?.EXAM?.EXAM_NAME ?? null,
      examRound: enrollment.SESSION?.EXAM?.EXAM_ROUND ?? null,
      examFiscalYear: enrollment.SESSION?.EXAM?.EXAM_FISCAL_YEAR ?? null,
      sessionId: enrollment.SESSION_ID,
      sessionStart: this.formatSessionTime(enrollment.SESSION?.SS_START_TIME),
      sessionEnd: this.formatSessionTime(enrollment.SESSION?.SS_END_TIME),
      nationalId:
        enrollment.USER?.USER_NATIONAL_ID?.trim() ||
        enrollment.USER?.USER_PASSPORT_NO?.trim() ||
        null,
      testTakerCode: enrollment.ERM_TEST_TAKER,
      fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh ?? null,
      fullnameEn: enrollment.USER?.PROFILE?.userFullnameEn ?? null,
      ermStatus: Number(enrollment.ERM_STATUS),
      verifyStatus: Number(enrollment.ERM_VERIFY_STATUS),
      createdAt: enrollment.CREATED_AT,
    }));

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findApplicants(
    query: EnrollmentAuditApplicantsQueryDto,
  ): Promise<PaginatedResponse<EnrollmentAuditApplicantListItem>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;

    const applySearch = (
      qb: ReturnType<Repository<ExamEnrollment>['createQueryBuilder']>,
    ): void => {
      if (!query.search?.trim()) return;
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(COALESCE(profile.userFullnameTh, '')) LIKE :search
          OR LOWER(COALESCE(profile.userFullnameEn, '')) LIKE :search
          OR LOWER(COALESCE(user.USER_NATIONAL_ID, '')) LIKE :search
          OR LOWER(COALESCE(user.USER_PASSPORT_NO, '')) LIKE :search
          OR LOWER(COALESCE(enrollment.ERM_TEST_TAKER, '')) LIKE :search)`,
        { search },
      );
    };

    const countQb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.USER', 'user')
      .leftJoin('user.PROFILE', 'profile')
      .select('COUNT(DISTINCT enrollment.USER_ID)', 'cnt');
    applySearch(countQb);
    const total = Number(
      (await countQb.getRawOne<{ cnt: string | number }>())?.cnt ?? 0,
    );

    const pageQb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.USER', 'user')
      .leftJoin('user.PROFILE', 'profile')
      .select('enrollment.USER_ID', 'userId')
      .addSelect('MAX(enrollment.CREATED_AT)', 'latestEnrollmentAt')
      .addSelect('COUNT(enrollment.ERM_ID)', 'enrollmentCount')
      .groupBy('enrollment.USER_ID')
      .orderBy('latestEnrollmentAt', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);
    applySearch(pageQb);

    const rawRows = await pageQb.getRawMany<{
      userId: number | string;
      latestEnrollmentAt: Date | string;
      enrollmentCount: number | string;
    }>();

    const userIds = rawRows.map((row) => Number(row.userId));
    if (userIds.length === 0) {
      return buildPaginatedResponse([], total, page, limit);
    }

    const samples = await this.enrollmentRepository.find({
      where: { USER_ID: In(userIds) },
      relations: ['USER', 'USER.PROFILE'],
      order: { CREATED_AT: 'DESC' },
    });
    const sampleByUser = new Map<number, ExamEnrollment>();
    for (const enrollment of samples) {
      if (!sampleByUser.has(enrollment.USER_ID)) {
        sampleByUser.set(enrollment.USER_ID, enrollment);
      }
    }

    const data: EnrollmentAuditApplicantListItem[] = rawRows.map((row) => {
      const userId = Number(row.userId);
      const sample = sampleByUser.get(userId);
      return {
        userId,
        fullnameTh: sample?.USER?.PROFILE?.userFullnameTh ?? null,
        fullnameEn: sample?.USER?.PROFILE?.userFullnameEn ?? null,
        nationalId:
          sample?.USER?.USER_NATIONAL_ID?.trim() ||
          sample?.USER?.USER_PASSPORT_NO?.trim() ||
          null,
        enrollmentCount: Number(row.enrollmentCount),
        latestEnrollmentAt: row.latestEnrollmentAt,
      };
    });

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findApplicantEnrollments(
    userId: number,
  ): Promise<EnrollmentAuditApplicantEnrollmentDto[]> {
    const rows = await this.enrollmentRepository.find({
      where: { USER_ID: userId },
      relations: ['SESSION', 'SESSION.EXAM'],
      order: { CREATED_AT: 'DESC' },
    });

    if (rows.length === 0) {
      throw new NotFoundException(`No enrollments found for user ID ${userId}`);
    }

    return rows.map((enrollment) => ({
      ermId: enrollment.ERM_ID,
      examId: enrollment.SESSION?.EXAM_ID ?? null,
      examName: enrollment.SESSION?.EXAM?.EXAM_NAME ?? null,
      examRound: enrollment.SESSION?.EXAM?.EXAM_ROUND ?? null,
      examFiscalYear: enrollment.SESSION?.EXAM?.EXAM_FISCAL_YEAR ?? null,
      examDate: enrollment.SESSION?.EXAM?.EXAM_DATE ?? null,
      sessionId: enrollment.SESSION_ID,
      sessionStart: this.formatSessionTime(enrollment.SESSION?.SS_START_TIME),
      sessionEnd: this.formatSessionTime(enrollment.SESSION?.SS_END_TIME),
      ermStatus: Number(enrollment.ERM_STATUS),
      testTakerCode: enrollment.ERM_TEST_TAKER,
      createdAt: enrollment.CREATED_AT,
    }));
  }

  async findEnrollmentSummary(
    ermId: number,
  ): Promise<EnrollmentAuditSummaryDto> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { ERM_ID: ermId },
      relations: ['USER', 'USER.PROFILE', 'SESSION', 'SESSION.EXAM'],
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${ermId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: { ERM_ID: ermId },
      order: { TRANX_CREATED_AT: 'DESC' },
    });
    const paidTxn = transactions.find(
      (t) => t.TRANX_PAID_AT != null || Number(t.TRANX_PAYMENT_STATUS) === 3,
    );
    const latestTxn = transactions[0] ?? null;

    return {
      ermId: enrollment.ERM_ID,
      userId: enrollment.USER_ID,
      examId: enrollment.SESSION?.EXAM_ID ?? null,
      examName: enrollment.SESSION?.EXAM?.EXAM_NAME ?? null,
      examRound: enrollment.SESSION?.EXAM?.EXAM_ROUND ?? null,
      examFiscalYear: enrollment.SESSION?.EXAM?.EXAM_FISCAL_YEAR ?? null,
      examDate: enrollment.SESSION?.EXAM?.EXAM_DATE ?? null,
      examFee:
        enrollment.SESSION?.EXAM?.EXAM_FEE != null
          ? Number(enrollment.SESSION.EXAM.EXAM_FEE)
          : null,
      sessionId: enrollment.SESSION_ID,
      sessionStart: this.formatSessionTime(enrollment.SESSION?.SS_START_TIME),
      sessionEnd: this.formatSessionTime(enrollment.SESSION?.SS_END_TIME),
      nationalId:
        enrollment.USER?.USER_NATIONAL_ID?.trim() ||
        enrollment.USER?.USER_PASSPORT_NO?.trim() ||
        null,
      testTakerCode: enrollment.ERM_TEST_TAKER,
      fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh ?? null,
      fullnameEn: enrollment.USER?.PROFILE?.userFullnameEn ?? null,
      ermStatus: Number(enrollment.ERM_STATUS),
      verifyStatus: Number(enrollment.ERM_VERIFY_STATUS),
      seatLabel: enrollment.ERM_SEAT_LABEL,
      paidAmount:
        paidTxn?.TRANX_AMOUNT != null ? Number(paidTxn.TRANX_AMOUNT) : null,
      latestTranxAmount:
        latestTxn?.TRANX_AMOUNT != null ? Number(latestTxn.TRANX_AMOUNT) : null,
      createdAt: enrollment.CREATED_AT,
    };
  }

  async findEvents(
    ermId: number,
    query: EnrollmentAuditEventsQueryDto = {},
  ): Promise<EnrollmentAuditEventDto[]> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { ERM_ID: ermId },
      relations: ['USER', 'USER.PROFILE', 'SESSION', 'SESSION.EXAM'],
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${ermId} not found`);
    }

    const examId = enrollment.SESSION?.EXAM_ID ?? null;
    const context = this.buildContext(enrollment);
    const events: EnrollmentAuditEventDto[] = [];

    const auditRows = await this.auditRepository.find({
      where: { ERM_ID: ermId },
      order: { CREATED_AT: 'DESC' },
    });
    for (const row of auditRows) {
      events.push(this.mapAuditRow(row));
    }

    const transactions = await this.transactionRepository.find({
      where: { ERM_ID: ermId },
    });
    const tranxIds = transactions.map((t) => t.TRANX_ID);
    const receiptByTranx = new Map<number, Receipt>();
    if (tranxIds.length > 0) {
      const receipts = await this.receiptRepository.find({
        where: { TRANX_ID: In(tranxIds) },
      });
      for (const receipt of receipts) {
        const existing = receiptByTranx.get(receipt.TRANX_ID);
        if (!existing || (receipt.RC_NO && !existing.RC_NO)) {
          receiptByTranx.set(receipt.TRANX_ID, receipt);
        }
      }

      const histories = await this.tshRepository
        .createQueryBuilder('tsh')
        .where('tsh.TRANX_ID IN (:...tranxIds)', { tranxIds })
        .orderBy('tsh.CREATED_AT', 'DESC')
        .getMany();
      for (const history of histories) {
        events.push(this.mapTransactionHistory(history));
      }
    }

    const paymentByTranxId = new Map<number, EnrollmentAuditPaymentDto>();
    for (const txn of transactions) {
      paymentByTranxId.set(
        txn.TRANX_ID,
        this.buildPayment(txn, receiptByTranx.get(txn.TRANX_ID) ?? null),
      );
    }

    const profile = await this.userProfileRepository.findOne({
      where: { userId: enrollment.USER_ID },
      select: ['userProfileId'],
    });
    if (profile) {
      const profileHistory = await this.profileHistoryRepository.find({
        where: { userProfileId: profile.userProfileId },
        order: { createdAt: 'DESC' },
      });
      for (const row of profileHistory) {
        events.push(this.mapProfileHistory(row));
      }
    }

    if (examId != null) {
      const fullName = `${enrollment.USER?.PROFILE?.userTitleTh || ''} ${
        enrollment.USER?.PROFILE?.userFullnameTh || ''
      }`.trim();
      const nationalId = enrollment.USER?.USER_NATIONAL_ID?.trim() || '';

      const passcodeQb = this.passcodeLogRepository
        .createQueryBuilder('log')
        .where('log.EXAM_ID = :examId', { examId });

      if (fullName || nationalId) {
        passcodeQb.andWhere(
          '(log.FULL_NAME = :fullName OR log.FULL_NAME = :nationalId)',
          {
            fullName: fullName || '__none__',
            nationalId: nationalId || '__none__',
          },
        );
      } else {
        passcodeQb.andWhere('1 = 0');
      }

      const passcodeLogs = await passcodeQb
        .orderBy('log.USED_AT', 'DESC')
        .getMany();
      for (const log of passcodeLogs) {
        events.push(this.mapPasscodeLog(log));
      }
    }

    for (const event of events) {
      event.context = context;
      if (event.ref?.type === 'TRANX') {
        event.payment = paymentByTranxId.get(event.ref.id) ?? null;
      }
    }

    events.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    if (query.category?.trim()) {
      const category = query.category.trim().toLowerCase();
      return events.filter(
        (event) => event.category.toLowerCase() === category,
      );
    }

    return events;
  }

  private formatSessionTime(value: unknown): string | null {
    if (value == null) return null;
    return String(value).substring(0, 5);
  }

  private toIsoOrNull(value: Date | string | null | undefined): string | null {
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toISOString();
  }

  private buildContext(enrollment: ExamEnrollment): EnrollmentAuditContextDto {
    const exam = enrollment.SESSION?.EXAM;
    return {
      examId: enrollment.SESSION?.EXAM_ID ?? null,
      examName: exam?.EXAM_NAME ?? null,
      examRound: exam?.EXAM_ROUND ?? null,
      examFiscalYear: exam?.EXAM_FISCAL_YEAR ?? null,
      examDate: exam?.EXAM_DATE ?? null,
      examFee: exam?.EXAM_FEE != null ? Number(exam.EXAM_FEE) : null,
      sessionId: enrollment.SESSION_ID ?? null,
      sessionStart: this.formatSessionTime(enrollment.SESSION?.SS_START_TIME),
      sessionEnd: this.formatSessionTime(enrollment.SESSION?.SS_END_TIME),
      seatLabel: enrollment.ERM_SEAT_LABEL,
      testTakerCode: enrollment.ERM_TEST_TAKER,
    };
  }

  private buildPayment(
    txn: Transaction,
    receipt: Receipt | null,
  ): EnrollmentAuditPaymentDto {
    return {
      tranxId: txn.TRANX_ID,
      amount: txn.TRANX_AMOUNT != null ? Number(txn.TRANX_AMOUNT) : null,
      qrCode: txn.TRANX_QR_CODE ?? null,
      expiresAt: this.toIsoOrNull(txn.TRANX_EXPIRES_AT),
      paidAt: this.toIsoOrNull(txn.TRANX_PAID_AT),
      channel: txn.TRANX_CHANNEL != null ? Number(txn.TRANX_CHANNEL) : null,
      receiptNo: receipt?.RC_NO ?? null,
      receiptStatus:
        receipt?.RC_STATUS != null ? Number(receipt.RC_STATUS) : null,
    };
  }

  private parseJsonValue(raw: string | null | undefined): unknown {
    if (raw == null || raw === '') return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }

  private mapAuditRow(row: ExamEnrollmentAuditLog): EnrollmentAuditEventDto {
    let payload: Record<string, unknown> | null = null;
    if (row.EAL_PAYLOAD) {
      try {
        payload = JSON.parse(row.EAL_PAYLOAD) as Record<string, unknown>;
      } catch {
        payload = { raw: row.EAL_PAYLOAD };
      }
    }

    return {
      id: `audit-${row.EAL_ID}`,
      source: 'audit',
      eventType: row.EAL_EVENT_TYPE,
      category: row.EAL_CATEGORY,
      occurredAt: row.CREATED_AT.toISOString(),
      fromStatus: row.EAL_FROM_STATUS,
      toStatus: row.EAL_TO_STATUS,
      actor: {
        type: row.EAL_ACTOR_TYPE,
        userId: row.EAL_ACTOR_USER_ID,
        name: row.EAL_ACTOR_NAME,
      },
      message: row.EAL_MESSAGE,
      payload,
      ref:
        row.EAL_REF_TYPE && row.EAL_REF_ID != null
          ? { type: row.EAL_REF_TYPE, id: row.EAL_REF_ID }
          : null,
    };
  }

  private mapTransactionHistory(
    history: TransactionStatusHistory,
  ): EnrollmentAuditEventDto {
    return {
      id: `tsh-${history.TSH_ID}`,
      source: 'transaction',
      eventType: 'PAYMENT_STATUS_CHANGED',
      category: EnrollmentAuditCategory.PAYMENT,
      occurredAt: history.CREATED_AT.toISOString(),
      fromStatus: history.TSH_FROM,
      toStatus: history.TSH_TO,
      actor: {
        type: 'system',
        userId: null,
        name: null,
      },
      message: history.TSH_RESP_MESSAGE,
      payload: {
        apiType: history.TSH_API_TYPE,
        respCode: history.TSH_RESP_CODE,
      },
      ref: { type: 'TRANX', id: history.TRANX_ID },
    };
  }

  private mapProfileHistory(row: ProfileEditHistory): EnrollmentAuditEventDto {
    return {
      id: `profile-${row.profileEditHistoryId}`,
      source: 'profile',
      eventType: 'PROFILE_UPDATED',
      category: 'profile',
      occurredAt: row.createdAt.toISOString(),
      fromStatus: null,
      toStatus: null,
      actor: {
        type: row.modifierRole || 'candidate',
        userId: row.modifierId,
        name: row.modifierName,
      },
      message: `แก้ไข: ${row.modifiedFields}`,
      payload: {
        modifiedFields: row.modifiedFields,
        oldValues: this.parseJsonValue(row.oldValues),
        newValues: this.parseJsonValue(row.newValues),
      },
      ref: { type: 'PROFILE_EDIT', id: row.profileEditHistoryId },
    };
  }

  private mapPasscodeLog(log: ExamPasscodeLog): EnrollmentAuditEventDto {
    return {
      id: `passcode-${log.LOG_ID}`,
      source: 'passcode',
      eventType: 'PASSCODE_USED',
      category: 'passcode',
      occurredAt: log.USED_AT.toISOString(),
      fromStatus: null,
      toStatus: null,
      actor: {
        type: 'candidate',
        userId: null,
        name: log.FULL_NAME,
      },
      message: `ใช้ passcode ${log.PASSCODE}`,
      payload: {
        passcodeId: log.PASSCODE_ID,
        examId: log.EXAM_ID,
      },
      ref: { type: 'PASSCODE_LOG', id: log.LOG_ID },
    };
  }
}
