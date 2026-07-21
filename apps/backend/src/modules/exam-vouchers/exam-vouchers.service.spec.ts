import { BadRequestException } from '@nestjs/common';
import { ExamVouchersService } from './exam-vouchers.service';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { ExamEnrollmentStatus } from '../exam-enrollments/entities/exam-enrollment.entity';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';
import { ExamVoucher } from './entities/exam-voucher.entity';

type RepositoryEntity =
  | typeof ExamEnrollment
  | typeof ExamVoucher
  | typeof ExamSession;

jest.mock('./entities/exam-voucher.entity', () => ({
  ExamVoucher: class ExamVoucher {},
}));

jest.mock('../exam-enrollments/entities/exam-enrollment.entity', () => ({
  ExamEnrollment: class ExamEnrollment {},
  ExamEnrollmentStatus: {
    UNPAID: 0,
    PAID: 1,
    SEAT_ASSIGNED: 2,
    SEAT_PUBLISHED: 3,
    ATTENDED: 4,
    CANCELLED: 5,
  },
}));

jest.mock('../exam-sessions/entities/exam-session.entity', () => ({
  ExamSession: class ExamSession {},
  ExamSessionStatus: {
    DRAFT: 0,
    OPEN: 1,
    SEAT_ALLOCATED: 2,
    VOUCHER_SENT: 3,
    COMPLETED: 4,
    CANCELLED: 5,
  },
}));

describe('ExamVouchersService', () => {
  let service: ExamVouchersService;
  let enrollmentFind: jest.Mock;
  let enrollmentSave: jest.Mock;
  let voucherFind: jest.Mock;
  let voucherCreate: jest.Mock;
  let voucherSave: jest.Mock;
  let sessionFind: jest.Mock;
  let sessionSave: jest.Mock;
  let dataSource: { transaction: jest.Mock };
  let platformGatewayService: { sendEmail: jest.Mock };

  const createService = (): ExamVouchersService =>
    new ExamVouchersService(
      {} as never,
      {} as never,
      platformGatewayService as never,
      dataSource as never,
    );

  beforeEach(() => {
    enrollmentFind = jest.fn();
    enrollmentSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));
    voucherFind = jest.fn().mockResolvedValue([]);
    voucherCreate = jest.fn().mockImplementation((payload: unknown) => payload);
    voucherSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));
    sessionFind = jest.fn().mockResolvedValue([]);
    sessionSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));

    dataSource = {
      transaction: jest.fn(
        (callback: (manager: { getRepository: jest.Mock }) => unknown) => {
          const manager = {
            getRepository: jest.fn((entity: RepositoryEntity) => {
              if (entity === ExamEnrollment) {
                return { find: enrollmentFind, save: enrollmentSave };
              }
              if (entity === ExamVoucher) {
                return {
                  find: voucherFind,
                  create: voucherCreate,
                  save: voucherSave,
                };
              }
              if (entity === ExamSession) {
                return { find: sessionFind, save: sessionSave };
              }
              throw new Error(`Unexpected repository for ${entity.name}`);
            }),
          };

          return callback(manager);
        },
      ),
    };

    platformGatewayService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = createService();
  });

  describe('bulkIssueVouchers', () => {
    it('returns early when ermIds is empty', async () => {
      const result = await service.bulkIssueVouchers({
        ermIds: [],
        examName: 'BUU-GET Exam',
        historyUrl: 'https://example.com/history',
      });

      expect(result).toEqual({
        success: true,
        updatedEnrollmentCount: 0,
        updatedSessionIds: [],
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('updates enrollment status, creates vouchers, and updates session status', async () => {
      const enrollments = [
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-001',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
          USER: {
            USER_EMAIL: 'a@example.com',
            PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'A' },
          },
        },
        {
          ERM_ID: 11,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-002',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
          USER: {
            USER_EMAIL: 'b@example.com',
            PROFILE: { userTitleTh: 'นาง', userFullnameTh: 'B' },
          },
        },
      ];

      enrollmentFind.mockResolvedValue(enrollments);
      sessionFind.mockResolvedValue([
        { SS_ID: 5, SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED },
      ]);

      const result = await service.bulkIssueVouchers({
        ermIds: [10, 11],
        examName: 'BUU-GET Exam',
        historyUrl: 'https://example.com/history',
        sessionIds: [5],
      });

      expect(enrollmentSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
          }),
        ]),
      );
      expect(voucherSave).toHaveBeenCalled();
      expect(sessionSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          }),
        ]),
      );
      expect(result).toEqual({
        success: true,
        updatedEnrollmentCount: 2,
        updatedSessionIds: [5],
      });
    });

    it('is idempotent when vouchers already exist', async () => {
      const enrollments = [
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-001',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
          USER: { USER_EMAIL: 'a@example.com', PROFILE: {} },
        },
      ];

      enrollmentFind.mockResolvedValue(enrollments);
      voucherFind.mockResolvedValue([{ ERM_ID: 10, VC_CODE: 'VC-EXISTING' }]);
      sessionFind.mockResolvedValue([
        { SS_ID: 5, SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT },
      ]);

      const result = await service.bulkIssueVouchers({
        ermIds: [10],
        examName: 'BUU-GET Exam',
        historyUrl: 'https://example.com/history',
        sessionIds: [5],
      });

      expect(voucherSave).not.toHaveBeenCalled();
      expect(sessionSave).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('throws when test taker ID is missing', async () => {
      enrollmentFind.mockResolvedValue([
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: null,
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
        },
      ]);

      await expect(
        service.bulkIssueVouchers({
          ermIds: [10],
          examName: 'BUU-GET Exam',
          historyUrl: 'https://example.com/history',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
