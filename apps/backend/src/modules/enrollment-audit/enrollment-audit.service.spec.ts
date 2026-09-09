import type { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EnrollmentAuditService } from './enrollment-audit.service';
import {
  ExamEnrollmentAuditLog,
  EnrollmentAuditActorType,
  EnrollmentAuditCategory,
  EnrollmentAuditEventType,
} from './entities/exam-enrollment-audit-log.entity';
import type { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import type { Transaction } from '../transactions/entities/transaction.entity';
import type { TransactionStatusHistory } from '../transaction-status-history/entities/transaction-status-history.entity';
import type { ProfileEditHistory } from '../profile-edit-history/entities/profile-edit-history.entity';
import type { ExamPasscodeLog } from '../exam/entities/exam-passcode-log.entity';
import type { UserProfile } from '../user-profile/entities/user-profile.entity';
import type { Receipt } from '../receipts/entities/receipt.entity';

describe('EnrollmentAuditService', () => {
  let service: EnrollmentAuditService;
  let auditRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let enrollmentRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let transactionRepository: { find: jest.Mock };
  let tshRepository: { createQueryBuilder: jest.Mock };
  let profileHistoryRepository: { find: jest.Mock };
  let passcodeLogRepository: { createQueryBuilder: jest.Mock };
  let userProfileRepository: { findOne: jest.Mock };
  let receiptRepository: { find: jest.Mock };

  beforeEach(() => {
    auditRepository = {
      create: jest.fn((payload) => payload),
      save: jest.fn(async (entity) => ({
        ...entity,
        EAL_ID: 1,
        CREATED_AT: new Date('2026-09-08T10:00:00.000Z'),
      })),
      find: jest.fn(),
    };
    enrollmentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    transactionRepository = { find: jest.fn() };
    tshRepository = {
      createQueryBuilder: jest.fn(),
    };
    profileHistoryRepository = { find: jest.fn() };
    passcodeLogRepository = { createQueryBuilder: jest.fn() };
    userProfileRepository = { findOne: jest.fn() };
    receiptRepository = { find: jest.fn() };

    service = new EnrollmentAuditService(
      auditRepository as unknown as Repository<ExamEnrollmentAuditLog>,
      enrollmentRepository as unknown as Repository<ExamEnrollment>,
      transactionRepository as unknown as Repository<Transaction>,
      tshRepository as unknown as Repository<TransactionStatusHistory>,
      profileHistoryRepository as unknown as Repository<ProfileEditHistory>,
      passcodeLogRepository as unknown as Repository<ExamPasscodeLog>,
      userProfileRepository as unknown as Repository<UserProfile>,
      receiptRepository as unknown as Repository<Receipt>,
    );
  });

  describe('record', () => {
    it('persists an audit row (EAL-U-001)', async () => {
      await service.record({
        ermId: 10,
        userId: 5,
        examId: 3,
        sessionId: 7,
        eventType: EnrollmentAuditEventType.ENROLLMENT_CREATED,
        category: EnrollmentAuditCategory.ENROLLMENT,
        toStatus: '0',
        actorType: EnrollmentAuditActorType.CANDIDATE,
        actorUserId: 5,
        message: 'สมัครสอบสำเร็จ',
      });

      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ERM_ID: 10,
          USER_ID: 5,
          EAL_EVENT_TYPE: EnrollmentAuditEventType.ENROLLMENT_CREATED,
          EAL_CATEGORY: EnrollmentAuditCategory.ENROLLMENT,
        }),
      );
      expect(auditRepository.save).toHaveBeenCalled();
    });
  });

  describe('findEvents', () => {
    it('merges and sorts audit + federated sources newest first (EAL-U-002)', async () => {
      enrollmentRepository.findOne.mockResolvedValue({
        ERM_ID: 10,
        USER_ID: 5,
        SESSION_ID: 7,
        ERM_SEAT_LABEL: 'A01',
        ERM_TEST_TAKER: 'TT-001',
        SESSION: {
          EXAM_ID: 3,
          SS_START_TIME: '09:00:00',
          SS_END_TIME: '12:00:00',
          EXAM: {
            EXAM_NAME: 'BUU-GET',
            EXAM_ROUND: '1/2569',
            EXAM_FISCAL_YEAR: '2569',
            EXAM_DATE: '2026-09-15',
            EXAM_FEE: 500,
          },
        },
        USER: {
          USER_NATIONAL_ID: '1234567890123',
          PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ' },
        },
      });

      auditRepository.find.mockResolvedValue([
        {
          EAL_ID: 1,
          EAL_EVENT_TYPE: 'ENROLLMENT_CREATED',
          EAL_CATEGORY: 'enrollment',
          EAL_FROM_STATUS: null,
          EAL_TO_STATUS: '0',
          EAL_ACTOR_TYPE: 'candidate',
          EAL_ACTOR_USER_ID: 5,
          EAL_ACTOR_NAME: 'นาย ทดสอบ',
          EAL_MESSAGE: 'สมัคร',
          EAL_PAYLOAD: null,
          EAL_REF_TYPE: null,
          EAL_REF_ID: null,
          CREATED_AT: new Date('2026-09-08T08:00:00.000Z'),
        },
      ]);

      transactionRepository.find.mockResolvedValue([
        {
          TRANX_ID: 99,
          TRANX_AMOUNT: 500,
          TRANX_QR_CODE: 'QR-TEST',
          TRANX_EXPIRES_AT: new Date('2026-09-08T11:00:00.000Z'),
          TRANX_PAID_AT: new Date('2026-09-08T09:30:00.000Z'),
          TRANX_CHANNEL: 1,
        },
      ]);
      receiptRepository.find.mockResolvedValue([
        {
          TRANX_ID: 99,
          RC_NO: 'RC-001',
          RC_STATUS: 1,
        },
      ]);
      tshRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            TSH_ID: 2,
            TRANX_ID: 99,
            TSH_FROM: '2',
            TSH_TO: '4',
            TSH_API_TYPE: 1,
            TSH_RESP_CODE: '000',
            TSH_RESP_MESSAGE: 'Payment confirmed',
            CREATED_AT: new Date('2026-09-08T09:00:00.000Z'),
          },
        ]),
      });

      userProfileRepository.findOne.mockResolvedValue({ userProfileId: 55 });
      profileHistoryRepository.find.mockResolvedValue([
        {
          profileEditHistoryId: 3,
          modifierId: 5,
          modifierName: 'นาย ทดสอบ',
          modifierRole: 'candidate',
          modifiedFields: 'ที่อยู่',
          oldValues: '{"address":"old"}',
          newValues: '{"address":"new"}',
          createdAt: new Date('2026-09-08T07:00:00.000Z'),
        },
      ]);

      passcodeLogRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const events = await service.findEvents(10);

      expect(events.map((e) => e.id)).toEqual([
        'tsh-2',
        'audit-1',
        'profile-3',
      ]);
      expect(events[0]?.eventType).toBe('PAYMENT_STATUS_CHANGED');
      expect(events[0]?.context?.examName).toBe('BUU-GET');
      expect(events[0]?.payment?.amount).toBe(500);
      expect(events[0]?.payment?.receiptNo).toBe('RC-001');
      expect(events[2]?.payload?.oldValues).toEqual({ address: 'old' });
      expect(events[2]?.payload?.newValues).toEqual({ address: 'new' });
      expect(events.every((e) => e.context?.examRound === '1/2569')).toBe(true);
    });

    it('throws NotFound when enrollment missing (EAL-U-003)', async () => {
      enrollmentRepository.findOne.mockResolvedValue(null);
      await expect(service.findEvents(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findApplicants', () => {
    it('returns unique applicants with enrollment counts', async () => {
      const chain = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ cnt: 1 }),
        getRawMany: jest.fn().mockResolvedValue([
          {
            userId: 5,
            latestEnrollmentAt: new Date('2026-09-08T10:00:00.000Z'),
            enrollmentCount: 2,
          },
        ]),
      };
      enrollmentRepository.createQueryBuilder.mockReturnValue(chain);
      enrollmentRepository.find.mockResolvedValue([
        {
          USER_ID: 5,
          USER: {
            USER_NATIONAL_ID: '1234567890123',
            PROFILE: { userFullnameTh: 'นาย ทดสอบ' },
          },
        },
      ]);

      const result = await service.findApplicants({ page: 1, limit: 10 });

      expect(result.meta.total).toBe(1);
      expect(result.data).toEqual([
        expect.objectContaining({
          userId: 5,
          fullnameTh: 'นาย ทดสอบ',
          nationalId: '1234567890123',
          enrollmentCount: 2,
        }),
      ]);
    });
  });

  describe('findApplicantEnrollments', () => {
    it('returns enrollments for picker ordered by createdAt desc', async () => {
      enrollmentRepository.find.mockResolvedValue([
        {
          ERM_ID: 20,
          USER_ID: 5,
          SESSION_ID: 8,
          ERM_STATUS: 1,
          ERM_TEST_TAKER: 'TT-2',
          CREATED_AT: new Date('2026-09-08T11:00:00.000Z'),
          SESSION: {
            EXAM_ID: 4,
            SS_START_TIME: '13:00:00',
            SS_END_TIME: '16:00:00',
            EXAM: {
              EXAM_NAME: 'BUU-GET',
              EXAM_ROUND: '2/2569',
              EXAM_FISCAL_YEAR: '2569',
              EXAM_DATE: '2026-10-01',
            },
          },
        },
      ]);

      const rows = await service.findApplicantEnrollments(5);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual(
        expect.objectContaining({
          ermId: 20,
          examName: 'BUU-GET',
          examRound: '2/2569',
          sessionStart: '13:00',
        }),
      );
    });

    it('throws NotFound when user has no enrollments', async () => {
      enrollmentRepository.find.mockResolvedValue([]);
      await expect(
        service.findApplicantEnrollments(999),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
