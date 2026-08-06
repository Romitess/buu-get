import { BadRequestException, NotFoundException } from '@nestjs/common';
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
  let enrollmentFindOne: jest.Mock;
  let enrollmentSave: jest.Mock;
  let voucherFind: jest.Mock;
  let voucherFindOne: jest.Mock;
  let voucherCreate: jest.Mock;
  let voucherSave: jest.Mock;
  let sessionFind: jest.Mock;
  let sessionSave: jest.Mock;
  let examVoucherRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    merge: jest.Mock;
    softRemove: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let platformGatewayService: { sendEmail: jest.Mock };

  const baseBulkDto = {
    examName: 'BUU-GET Exam',
    historyUrl: 'https://example.com/history',
  };

  const createService = (): ExamVouchersService =>
    new ExamVouchersService(
      examVoucherRepository as never,
      {} as never,
      platformGatewayService as never,
      dataSource as never,
    );

  beforeEach(() => {
    enrollmentFind = jest.fn();
    enrollmentFindOne = jest.fn();
    enrollmentSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));
    voucherFind = jest.fn().mockResolvedValue([]);
    voucherFindOne = jest.fn().mockResolvedValue(null);
    voucherCreate = jest.fn().mockImplementation((payload: unknown) => payload);
    voucherSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));
    sessionFind = jest.fn().mockResolvedValue([]);
    sessionSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));

    examVoucherRepository = {
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity) =>
          Promise.resolve({ VC_ID: 1, ...entity }),
        ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      merge: jest
        .fn()
        .mockImplementation((entity, dto) => ({ ...entity, ...dto })),
      softRemove: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(
        (callback: (manager: { getRepository: jest.Mock }) => unknown) => {
          const manager = {
            getRepository: jest.fn((entity: RepositoryEntity) => {
              if (entity === ExamEnrollment) {
                return {
                  find: enrollmentFind,
                  findOne: enrollmentFindOne,
                  save: enrollmentSave,
                };
              }
              if (entity === ExamVoucher) {
                return {
                  find: voucherFind,
                  findOne: voucherFindOne,
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
    it('should return early with success 0 and skip TX when ermIds is empty (VOUCH-U-001)', async () => {
      // Arrange
      const dto = { ermIds: [], ...baseBulkDto };

      // Act
      const result = await service.bulkIssueVouchers(dto);

      // Assert
      expect(result).toEqual({
        success: true,
        updatedEnrollmentCount: 0,
        updatedSessionIds: [],
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should update SEAT_ASSIGNED to SEAT_PUBLISHED, create vouchers, and set session VOUCHER_SENT (VOUCH-U-002)', async () => {
      // Arrange
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

      // Act
      const result = await service.bulkIssueVouchers({
        ermIds: [10, 11],
        ...baseBulkDto,
        sessionIds: [5],
      });

      // Assert
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

    it('should be idempotent and not duplicate voucher save when vouchers already exist (VOUCH-U-003)', async () => {
      // Arrange
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

      // Act
      const result = await service.bulkIssueVouchers({
        ermIds: [10],
        ...baseBulkDto,
        sessionIds: [5],
      });

      // Assert
      expect(voucherSave).not.toHaveBeenCalled();
      expect(sessionSave).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException when test taker ID is missing (VOUCH-U-004)', async () => {
      // Arrange
      enrollmentFind.mockResolvedValue([
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: null,
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
        },
      ]);

      // Act & Assert
      await expect(
        service.bulkIssueVouchers({
          ermIds: [10],
          ...baseBulkDto,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return success 0 when ermIds match no enrollments (VOUCH-U-005)', async () => {
      // Arrange
      enrollmentFind.mockResolvedValue([]);

      // Act
      const result = await service.bulkIssueVouchers({
        ermIds: [999, 1000],
        ...baseBulkDto,
      });

      // Assert
      expect(result).toEqual({
        success: true,
        updatedEnrollmentCount: 0,
        updatedSessionIds: [],
      });
      expect(enrollmentSave).not.toHaveBeenCalled();
      expect(voucherSave).not.toHaveBeenCalled();
      expect(sessionSave).not.toHaveBeenCalled();
      expect(platformGatewayService.sendEmail).not.toHaveBeenCalled();
    });

    it('should only update enrollments with SEAT_ASSIGNED status (VOUCH-U-006)', async () => {
      // Arrange
      enrollmentFind.mockResolvedValue([
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-001',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
          USER: { USER_EMAIL: 'a@example.com', PROFILE: {} },
        },
        {
          ERM_ID: 11,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-002',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
          USER: { USER_EMAIL: 'b@example.com', PROFILE: {} },
        },
        {
          ERM_ID: 12,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-003',
          ERM_STATUS: ExamEnrollmentStatus.PAID,
          USER: { USER_EMAIL: 'c@example.com', PROFILE: {} },
        },
      ]);
      sessionFind.mockResolvedValue([
        { SS_ID: 5, SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED },
      ]);

      // Act
      const result = await service.bulkIssueVouchers({
        ermIds: [10, 11, 12],
        ...baseBulkDto,
        sessionIds: [5],
      });

      // Assert
      expect(result.updatedEnrollmentCount).toBe(1);
      expect(enrollmentSave).toHaveBeenCalledWith([
        expect.objectContaining({
          ERM_ID: 10,
          ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
        }),
      ]);
      expect(voucherSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ ERM_ID: 10 }),
          expect.objectContaining({ ERM_ID: 11 }),
          expect.objectContaining({ ERM_ID: 12 }),
        ]),
      );
    });

    it('should derive distinct sessionIds from enrollments when sessionIds omitted (VOUCH-U-007)', async () => {
      // Arrange
      enrollmentFind.mockResolvedValue([
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-001',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
          USER: { USER_EMAIL: 'a@example.com', PROFILE: {} },
        },
        {
          ERM_ID: 11,
          SESSION_ID: 7,
          ERM_TEST_TAKER: 'TT-002',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
          USER: { USER_EMAIL: 'b@example.com', PROFILE: {} },
        },
        {
          ERM_ID: 12,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-003',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
          USER: { USER_EMAIL: 'c@example.com', PROFILE: {} },
        },
      ]);
      sessionFind.mockResolvedValue([
        { SS_ID: 5, SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED },
        { SS_ID: 7, SS_SESSION_STATUS: ExamSessionStatus.OPEN },
      ]);

      // Act
      const result = await service.bulkIssueVouchers({
        ermIds: [10, 11, 12],
        ...baseBulkDto,
      });

      // Assert
      expect(sessionFind).toHaveBeenCalled();
      expect(result.updatedSessionIds).toEqual(expect.arrayContaining([5, 7]));
      expect(result.updatedSessionIds).toHaveLength(2);
      expect(sessionSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            SS_ID: 5,
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          }),
          expect.objectContaining({
            SS_ID: 7,
            SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT,
          }),
        ]),
      );
    });

    it('should not downgrade session status when already at or above VOUCHER_SENT (VOUCH-U-008)', async () => {
      // Arrange
      enrollmentFind.mockResolvedValue([
        {
          ERM_ID: 10,
          SESSION_ID: 5,
          ERM_TEST_TAKER: 'TT-001',
          ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
          USER: { USER_EMAIL: 'a@example.com', PROFILE: {} },
        },
      ]);
      voucherFind.mockResolvedValue([{ ERM_ID: 10, VC_CODE: 'VC-EXISTING' }]);
      sessionFind.mockResolvedValue([
        { SS_ID: 5, SS_SESSION_STATUS: ExamSessionStatus.COMPLETED },
      ]);

      // Act
      const result = await service.bulkIssueVouchers({
        ermIds: [10],
        ...baseBulkDto,
        sessionIds: [5],
      });

      // Assert
      expect(sessionSave).not.toHaveBeenCalled();
      expect(result.updatedSessionIds).toEqual([]);
      expect(result.success).toBe(true);
    });

    it('should return success immediately while emails are fire-and-forget (VOUCH-U-009)', async () => {
      // Arrange
      let resolveEmail!: () => void;
      const emailGate = new Promise<void>((resolve) => {
        resolveEmail = resolve;
      });
      platformGatewayService.sendEmail.mockImplementation(() => emailGate);

      enrollmentFind.mockResolvedValue([
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
          USER: { USER_EMAIL: null, PROFILE: {} },
        },
      ]);
      sessionFind.mockResolvedValue([
        { SS_ID: 5, SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED },
      ]);

      // Act
      const resultPromise = service.bulkIssueVouchers({
        ermIds: [10, 11],
        ...baseBulkDto,
        sessionIds: [5],
      });

      // Assert — resolves without waiting for email
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.updatedEnrollmentCount).toBe(2);

      await Promise.resolve();
      expect(platformGatewayService.sendEmail).toHaveBeenCalledTimes(1);
      expect(platformGatewayService.sendEmail).toHaveBeenCalledWith(
        'BUU-GET',
        'a@example.com',
        expect.any(String),
        expect.any(String),
      );

      resolveEmail();
      await emailGate;
    });
  });

  describe('createFromEnrollment', () => {
    it('should throw NotFoundException when enrollment is missing (VOUCH-U-010)', async () => {
      // Arrange
      enrollmentFindOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createFromEnrollment(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(enrollmentSave).not.toHaveBeenCalled();
      expect(voucherSave).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when test taker ID is missing (VOUCH-U-011)', async () => {
      // Arrange
      enrollmentFindOne.mockResolvedValue({
        ERM_ID: 10,
        ERM_TEST_TAKER: null,
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      });

      // Act & Assert
      await expect(service.createFromEnrollment(10)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(enrollmentSave).not.toHaveBeenCalled();
    });

    it('should promote SEAT_ASSIGNED to SEAT_PUBLISHED and create voucher without updating session (VOUCH-U-012)', async () => {
      // Arrange
      const enrollment = {
        ERM_ID: 10,
        ERM_TEST_TAKER: 'TT-001',
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
        SESSION_ID: 5,
      };
      enrollmentFindOne.mockResolvedValue(enrollment);
      voucherFindOne.mockResolvedValue(null);
      voucherSave.mockImplementation((entity) =>
        Promise.resolve({ VC_ID: 50, ...entity }),
      );

      // Act
      const result = await service.createFromEnrollment(10);

      // Assert
      expect(enrollmentSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ERM_ID: 10,
          ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
        }),
      );
      expect(voucherCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ERM_ID: 10,
          VC_CODE: expect.stringMatching(/^VC-\d{4}-10-\d{4}$/),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          ERM_ID: 10,
          VC_CODE: expect.stringMatching(/^VC-\d{4}-10-\d{4}$/),
        }),
      );
      expect(sessionSave).not.toHaveBeenCalled();
      expect(sessionFind).not.toHaveBeenCalled();
    });

    it('should return existing voucher without creating a duplicate (VOUCH-U-013)', async () => {
      // Arrange
      const existing = {
        VC_ID: 77,
        ERM_ID: 10,
        VC_CODE: 'VC-2026-10-1234',
      };
      enrollmentFindOne.mockResolvedValue({
        ERM_ID: 10,
        ERM_TEST_TAKER: 'TT-001',
        ERM_STATUS: ExamEnrollmentStatus.SEAT_PUBLISHED,
      });
      voucherFindOne.mockResolvedValue(existing);

      // Act
      const result = await service.createFromEnrollment(10);

      // Assert
      expect(result).toBe(existing);
      expect(voucherCreate).not.toHaveBeenCalled();
      expect(voucherSave).not.toHaveBeenCalled();
    });
  });

  describe('generateVoucherCode (via createFromEnrollment)', () => {
    it('should generate VC-YYYY-ermId-#### format (VOUCH-U-014)', async () => {
      // Arrange
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-05T12:00:00+07:00'));
      jest.spyOn(Math, 'random').mockReturnValue(0.1234);

      enrollmentFindOne.mockResolvedValue({
        ERM_ID: 42,
        ERM_TEST_TAKER: 'TT-042',
        ERM_STATUS: ExamEnrollmentStatus.PAID,
      });
      voucherFindOne.mockResolvedValue(null);
      voucherSave.mockImplementation((entity) => Promise.resolve(entity));

      // Act
      const result = await service.createFromEnrollment(42);

      // Assert
      // 1000 + floor(0.1234 * 9000) = 1000 + 1110 = 2110
      expect(result.VC_CODE).toBe('VC-2026-42-2110');
      expect(result.VC_CODE).toMatch(/^VC-2026-42-\d{4}$/);

      jest.spyOn(Math, 'random').mockRestore();
      jest.useRealTimers();
    });
  });

  describe('sendVoucherEmail', () => {
    it('should return { success: true } immediately without awaiting gateway (VOUCH-U-015)', async () => {
      // Arrange
      let resolveEmail!: () => void;
      const emailGate = new Promise<void>((resolve) => {
        resolveEmail = resolve;
      });
      platformGatewayService.sendEmail.mockImplementation(() => emailGate);

      // Act
      const result = await service.sendVoucherEmail({
        email: 'student@example.com',
        fullName: 'นาย ทดสอบ',
        examName: 'BUU-GET Exam',
        historyUrl: 'https://example.com/history',
      });

      // Assert
      expect(result).toEqual({ success: true });
      expect(platformGatewayService.sendEmail).toHaveBeenCalledWith(
        'BUU-GET',
        'student@example.com',
        expect.stringContaining('BUU-GET Exam'),
        expect.stringContaining('นาย ทดสอบ'),
      );

      resolveEmail();
      await emailGate;
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when voucher is missing (VOUCH-U-016)', async () => {
      // Arrange
      examVoucherRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should merge DTO onto existing voucher and save (VOUCH-U-017)', async () => {
      // Arrange
      const existing = {
        VC_ID: 1,
        ERM_ID: 10,
        VC_CODE: 'VC-OLD',
      };
      examVoucherRepository.findOne.mockResolvedValue(existing);
      examVoucherRepository.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      // Act
      const result = await service.update(1, { VC_CODE: 'VC-NEW' });

      // Assert
      expect(examVoucherRepository.merge).toHaveBeenCalledWith(existing, {
        VC_CODE: 'VC-NEW',
      });
      expect(examVoucherRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          VC_ID: 1,
          ERM_ID: 10,
          VC_CODE: 'VC-NEW',
        }),
      );
      expect(result.VC_CODE).toBe('VC-NEW');
    });
  });

  describe('remove', () => {
    it('should softRemove the voucher after findOne (VOUCH-U-018)', async () => {
      // Arrange
      const existing = {
        VC_ID: 1,
        ERM_ID: 10,
        VC_CODE: 'VC-2026-10-1111',
      };
      examVoucherRepository.findOne.mockResolvedValue(existing);

      // Act
      await service.remove(1);

      // Assert
      expect(examVoucherRepository.softRemove).toHaveBeenCalledWith(existing);
    });
  });

  describe('create', () => {
    it('should persist CreateExamVoucherDto as-is without enrollment rules (VOUCH-U-019)', async () => {
      // Arrange
      const dto = { ERM_ID: 99, VC_CODE: 'MANUAL-CODE-001' };

      // Act
      const result = await service.create(dto);

      // Assert
      expect(examVoucherRepository.create).toHaveBeenCalledWith(dto);
      expect(examVoucherRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(
        expect.objectContaining({
          ERM_ID: 99,
          VC_CODE: 'MANUAL-CODE-001',
        }),
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(enrollmentFind).not.toHaveBeenCalled();
      expect(enrollmentFindOne).not.toHaveBeenCalled();
    });
  });
});
