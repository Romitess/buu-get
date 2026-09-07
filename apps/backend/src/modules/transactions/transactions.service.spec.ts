import type { DataSource, QueryRunner, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';
import { TransactionsService } from './transactions.service';
import {
  Transaction,
  TransactionChannel,
  TransactionMatchStatus,
  TransactionPaymentMethod,
  TransactionPaymentStatus,
} from './entities/transaction.entity';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { PaymentConfig } from '../payment-configs/entities/payment-config.entity';
import {
  TransactionStatusHistory,
  TransactionApiType,
} from '../transaction-status-history/entities/transaction-status-history.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { TransactionProfile } from '../transaction-profiles/entities/transaction-profile.entity';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'fixed-uuid-qr'),
}));

jest.mock('./entities/transaction.entity', () => ({
  Transaction: class Transaction {},
  TransactionChannel: {
    ATM: 0,
    COUNTER: 1,
    MOBILE_BANKING: 2,
    QR: 3,
  },
  TransactionMatchStatus: {
    UNMATCH: 0,
    MATCH: 1,
    MISSING: 2,
  },
  TransactionPaymentMethod: {
    QR: 0,
  },
  TransactionPaymentStatus: {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2,
    PAID: 3,
    PAYMENT_FAILED: 4,
    EXPIRED: 5,
    REVERSED: 6,
    REFUND: 7,
    RECEIPT_VOIDED: 8,
  },
}));

jest.mock('../receipts/entities/receipt.entity', () => ({
  Receipt: class Receipt {},
  ReceiptStatus: {
    UNISSUED: 0,
    ISSUED: 1,
    VOIDED: 2,
  },
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
    MISSING: 6,
  },
  ExamVerifyStatus: {},
}));

jest.mock('../payment-configs/entities/payment-config.entity', () => ({
  PaymentConfig: class PaymentConfig {},
}));

jest.mock(
  '../transaction-status-history/entities/transaction-status-history.entity',
  () => ({
    TransactionStatusHistory: class TransactionStatusHistory {},
    TransactionApiType: {
      APPROVE: 1,
      PAYMENT: 2,
      INQUIRY: 3,
      REVERSAL: 4,
    },
  }),
);

jest.mock('../transaction-refs/entities/transaction-ref.entity', () => ({
  TransactionRef: class TransactionRef {},
}));

jest.mock(
  '../transaction-profiles/entities/transaction-profile.entity',
  () => ({
    TransactionProfile: class TransactionProfile {},
  }),
);

type MockRepo = {
  exists: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  exists: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn((data: Record<string, unknown>) => ({ ...data })),
  save: jest.fn(async (entity: Record<string, unknown>) => {
    if (entity.TRANX_ID == null && entity.ERM_ID != null) {
      return { ...entity, TRANX_ID: 100 };
    }
    if (entity.RC_ID == null && entity.TRANX_ID != null && entity.RC_NAME) {
      return { ...entity, RC_ID: 50 };
    }
    return { ...entity };
  }),
  softRemove: jest.fn().mockResolvedValue(undefined),
});

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: MockRepo;
  let repos: {
    transaction: MockRepo;
    paymentConfig: MockRepo;
    enrollment: MockRepo;
    history: MockRepo;
    ref: MockRepo;
    receipt: MockRepo;
    profile: MockRepo;
  };
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: { getRepository: jest.Mock };
  };
  let dataSource: {
    transaction: jest.Mock;
    createQueryRunner: jest.Mock;
  };

  const ownerUser: AuthenticatedUser = {
    userId: 10,
    email: 'owner@example.com',
    role: RoleEnum.CANDIDATE,
  };

  const otherCandidate: AuthenticatedUser = {
    userId: 99,
    email: 'other@example.com',
    role: RoleEnum.CANDIDATE,
  };

  const financeUser: AuthenticatedUser = {
    userId: 99,
    email: 'finance@example.com',
    role: RoleEnum.FINANCE,
  };

  const adminUser: AuthenticatedUser = {
    userId: 99,
    email: 'admin@example.com',
    role: RoleEnum.ADMIN,
  };

  const staffUser: AuthenticatedUser = {
    userId: 99,
    email: 'staff@example.com',
    role: RoleEnum.STAFF,
  };

  const getRepository = (entity: unknown): MockRepo => {
    if (entity === Transaction) return repos.transaction;
    if (entity === PaymentConfig) return repos.paymentConfig;
    if (entity === ExamEnrollment) return repos.enrollment;
    if (entity === TransactionStatusHistory) return repos.history;
    if (entity === TransactionRef) return repos.ref;
    if (entity === Receipt) return repos.receipt;
    if (entity === TransactionProfile) return repos.profile;
    throw new Error(`Unexpected repository entity: ${String(entity)}`);
  };

  const baseEnrollment = (
    overrides: Partial<ExamEnrollment> = {},
  ): ExamEnrollment =>
    ({
      ERM_ID: 42,
      USER_ID: 10,
      ERM_STATUS: ExamEnrollmentStatus.UNPAID,
      ...overrides,
    }) as ExamEnrollment;

  const basePendingTransaction = (
    overrides: Partial<Transaction> = {},
  ): Transaction =>
    ({
      TRANX_ID: 7,
      ERM_ID: 42,
      PC_ID: 1,
      TRANX_AMOUNT: 500,
      TRANX_QR_CODE: 'existing-qr',
      TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PENDING,
      TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH,
      TRANX_PAYMENT_METHOD: TransactionPaymentMethod.QR,
      TRANX_CHANNEL: TransactionChannel.QR,
      RECEIPTS: [],
      ...overrides,
    }) as Transaction;

  const activePaymentConfig = (
    overrides: Partial<PaymentConfig> = {},
  ): PaymentConfig =>
    ({
      PC_ID: 1,
      PC_IS_ACTIVE: true,
      PC_EFFECTIVE_TO: null,
      PC_COMP_CODE: 'COMP',
      PC_PROD_CODE: 'PROD',
      ...overrides,
    }) as PaymentConfig;

  beforeEach(() => {
    repos = {
      transaction: createMockRepo(),
      paymentConfig: createMockRepo(),
      enrollment: createMockRepo(),
      history: createMockRepo(),
      ref: createMockRepo(),
      receipt: createMockRepo(),
      profile: createMockRepo(),
    };

    transactionsRepository = createMockRepo();
    transactionsRepository.findAndCount.mockResolvedValue([
      [{ TRANX_ID: 1 }],
      1,
    ]);

    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        getRepository: jest.fn((entity: unknown) => getRepository(entity)),
      },
    };

    dataSource = {
      transaction: jest.fn(
        async (
          callback: (manager: {
            getRepository: typeof getRepository;
          }) => unknown,
        ) => callback({ getRepository }),
      ),
      createQueryRunner: jest.fn(() => queryRunner as unknown as QueryRunner),
    };

    service = new TransactionsService(
      transactionsRepository as unknown as Repository<Transaction>,
      dataSource as unknown as DataSource,
    );
  });

  describe('createTransactionForFlow', () => {
    it('should create PENDING when none exists (TXN-U-001)', async () => {
      // Arrange
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(baseEnrollment());
      repos.transaction.findOne.mockResolvedValue(null);
      repos.transaction.save.mockImplementation(async (entity) => ({
        ...entity,
        TRANX_ID: 101,
      }));

      // Act
      const result = await service.createTransactionForFlow({
        ermId: 42,
        pcId: 1,
        amount: 500,
      }, ownerUser);

      // Assert
      expect(result).toEqual({ TRANX_ID: 101 });
      expect(repos.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ERM_ID: 42,
          PC_ID: 1,
          TRANX_AMOUNT: 500,
          TRANX_QR_CODE: 'fixed-uuid-qr',
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PENDING,
          TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH,
          TRANX_PAYMENT_METHOD: TransactionPaymentMethod.QR,
          TRANX_CHANNEL: TransactionChannel.QR,
          TRANX_EXPIRES_AT: null,
        }),
      );
      expect(repos.history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TRANX_ID: 101,
          TSH_FROM: null,
          TSH_TO: String(TransactionPaymentStatus.PENDING),
          TSH_API_TYPE: TransactionApiType.PAYMENT,
          TSH_RESP_MESSAGE: 'Created pending transaction',
        }),
      );
      expect(repos.history.save).toHaveBeenCalled();
    });

    it('should reuse PENDING and keep QR without new history (TXN-U-002)', async () => {
      // Arrange
      const existing = basePendingTransaction({
        TRANX_ID: 7,
        TRANX_QR_CODE: 'keep-me-qr',
        PC_ID: 1,
        TRANX_AMOUNT: 400,
      });
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(baseEnrollment());
      repos.transaction.findOne.mockResolvedValue(existing);
      repos.transaction.save.mockImplementation(async (entity) => entity);

      // Act
      const result = await service.createTransactionForFlow({
        ermId: 42,
        pcId: 9,
        amount: 550,
      }, ownerUser);

      // Assert
      expect(result).toEqual({ TRANX_ID: 7 });
      expect(existing.PC_ID).toBe(9);
      expect(existing.TRANX_AMOUNT).toBe(550);
      expect(existing.TRANX_QR_CODE).toBe('keep-me-qr');
      expect(existing.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.PENDING,
      );
      expect(repos.history.create).not.toHaveBeenCalled();
      expect(repos.history.save).not.toHaveBeenCalled();
    });

    it('should restart non-PENDING non-PAID with new QR and history (TXN-U-003)', async () => {
      // Arrange
      const existing = basePendingTransaction({
        TRANX_PAYMENT_STATUS: TransactionPaymentStatus.EXPIRED,
        TRANX_QR_CODE: 'old-qr',
        TRANX_EXPIRES_AT: new Date('2020-01-01T00:00:00Z'),
      });
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(baseEnrollment());
      repos.transaction.findOne.mockResolvedValue(existing);
      repos.transaction.save.mockImplementation(async (entity) => entity);

      // Act
      await service.createTransactionForFlow({
        ermId: 42,
        pcId: 2,
        amount: 600,
      }, ownerUser);

      // Assert
      expect(existing.TRANX_QR_CODE).toBe('fixed-uuid-qr');
      expect(existing.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.PENDING,
      );
      expect(existing.TRANX_MATCH_STATUS).toBe(TransactionMatchStatus.UNMATCH);
      expect(existing.TRANX_EXPIRES_AT).toBeNull();
      expect(repos.history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TSH_FROM: String(TransactionPaymentStatus.EXPIRED),
          TSH_TO: String(TransactionPaymentStatus.PENDING),
          TSH_RESP_MESSAGE: 'Restarted pending transaction',
        }),
      );
      expect(repos.history.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when latest transaction is PAID (TXN-U-004)', async () => {
      // Arrange
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(baseEnrollment());
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
        }),
      );

      // Act / Assert
      await expect(
        service.createTransactionForFlow({
          ermId: 42,
          pcId: 1,
          amount: 500,
        }, ownerUser),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repos.transaction.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when payment config is missing (TXN-U-005)', async () => {
      // Arrange
      repos.paymentConfig.exists.mockResolvedValue(false);

      // Act / Assert
      await expect(
        service.createTransactionForFlow({
          ermId: 42,
          pcId: 999,
          amount: 500,
        }, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when enrollment is missing (TXN-U-006)', async () => {
      // Arrange
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.createTransactionForFlow({
          ermId: 999,
          pcId: 1,
          amount: 500,
        }, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner non-FINANCE creates (TXN-U-006c)', async () => {
      // Arrange
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(
        baseEnrollment({ USER_ID: 10 }),
      );

      // Act / Assert
      await expect(
        service.createTransactionForFlow(
          { ermId: 42, pcId: 1, amount: 500 },
          otherCandidate,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should reject when enrollment is not UNPAID (TXN-U-006b)', async () => {
      // Arrange
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.enrollment.findOne.mockResolvedValue(
        baseEnrollment({ ERM_STATUS: ExamEnrollmentStatus.CANCELLED }),
      );

      // Act / Assert
      await expect(
        service.createTransactionForFlow({
          ermId: 42,
          pcId: 1,
          amount: 500,
        }, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('confirmPaymentFlow', () => {
    const confirmDto = {
      userCode: 'U00000010',
      receiptName: 'Somchai',
      receiptTaxId: '1234567890123',
      receiptPhone: '0812345678',
      receiptAddress: 'Burapha',
    };

    const setupConfirmHappyPath = (
      options: {
        transaction?: Transaction;
        enrollment?: ExamEnrollment | null;
        paymentConfig?: PaymentConfig | null;
        receipt?: Receipt | null;
        profile?: TransactionProfile | null;
      } = {},
    ): void => {
      const transaction = options.transaction ?? basePendingTransaction();
      const enrollment =
        options.enrollment === undefined
          ? baseEnrollment()
          : options.enrollment;
      const paymentConfig =
        options.paymentConfig === undefined
          ? activePaymentConfig()
          : options.paymentConfig;

      repos.transaction.findOne.mockResolvedValue(transaction);
      repos.enrollment.findOne.mockResolvedValue(enrollment);
      repos.paymentConfig.findOne.mockResolvedValue(paymentConfig);
      repos.receipt.findOne.mockResolvedValue(options.receipt ?? null);
      repos.profile.findOne.mockResolvedValue(options.profile ?? null);
    };

    it('should confirm PENDING to PAID and update ERM + ref (TXN-U-007)', async () => {
      // Arrange
      const transaction = basePendingTransaction();
      const enrollment = baseEnrollment();
      setupConfirmHappyPath({
        transaction,
        enrollment,
        paymentConfig: activePaymentConfig(),
      });
      repos.receipt.findOne.mockResolvedValue(null);

      // Act
      await service.confirmPaymentFlow(7, confirmDto, ownerUser);

      // Assert
      expect(transaction.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.PAID,
      );
      expect(transaction.TRANX_PAID_AT).toBeInstanceOf(Date);
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
      expect(repos.history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TRANX_ID: 7,
          TSH_FROM: String(TransactionPaymentStatus.PENDING),
          TSH_TO: String(TransactionPaymentStatus.PAID),
          TSH_API_TYPE: TransactionApiType.APPROVE,
          TSH_RESP_MESSAGE: 'Payment confirmed',
        }),
      );
      expect(repos.ref.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TRANX_ID: 7,
          TSC_REF1: 'U00000010',
          TSC_BANK_REF: 'COMP',
          TSC_PARTNER_REF: 'PROD',
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should reject confirm when transaction is not PENDING (TXN-U-008)', async () => {
      // Arrange
      setupConfirmHappyPath({
        transaction: basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
        }),
      });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, confirmDto, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when transaction is missing (TXN-U-009)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(999, confirmDto, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when enrollment is missing (TXN-U-010)', async () => {
      // Arrange
      setupConfirmHappyPath({ enrollment: null });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, confirmDto, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner non-FINANCE (TXN-U-011)', async () => {
      // Arrange
      setupConfirmHappyPath({
        enrollment: baseEnrollment({ USER_ID: 10 }),
      });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, confirmDto, otherCandidate),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should allow FINANCE_ROLES to confirm another user transaction (TXN-U-012)', async () => {
      // Arrange
      for (const user of [financeUser, adminUser, staffUser]) {
        jest.clearAllMocks();
        repos = {
          transaction: createMockRepo(),
          paymentConfig: createMockRepo(),
          enrollment: createMockRepo(),
          history: createMockRepo(),
          ref: createMockRepo(),
          receipt: createMockRepo(),
          profile: createMockRepo(),
        };
        queryRunner.manager.getRepository.mockImplementation(
          (entity: unknown) => getRepository(entity),
        );
        dataSource.createQueryRunner.mockReturnValue(queryRunner);
        service = new TransactionsService(
          transactionsRepository as unknown as Repository<Transaction>,
          dataSource as unknown as DataSource,
        );

        const transaction = basePendingTransaction();
        const enrollment = baseEnrollment({ USER_ID: 10 });
        setupConfirmHappyPath({
          transaction,
          enrollment,
        });
        repos.receipt.findOne.mockResolvedValue(null);

        // Act
        await service.confirmPaymentFlow(7, { userCode: 'U00000099' }, user);

        // Assert
        expect(transaction.TRANX_PAYMENT_STATUS).toBe(
          TransactionPaymentStatus.PAID,
        );
        expect(queryRunner.commitTransaction).toHaveBeenCalled();
      }
    });

    it('should throw BadRequestException when payment config is inactive (TXN-U-013)', async () => {
      // Arrange
      setupConfirmHappyPath({
        paymentConfig: activePaymentConfig({ PC_IS_ACTIVE: false }),
      });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, { userCode: 'U1' }, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when payment config is expired (TXN-U-014)', async () => {
      // Arrange
      setupConfirmHappyPath({
        paymentConfig: activePaymentConfig({
          PC_EFFECTIVE_TO: new Date('2000-01-01T00:00:00.000Z'),
        }),
      });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, { userCode: 'U1' }, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when payment config is missing (TXN-U-015)', async () => {
      // Arrange
      setupConfirmHappyPath({ paymentConfig: null });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, { userCode: 'U1' }, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should create UNISSUED receipt and sync profile when receiptName set (TXN-U-016)', async () => {
      // Arrange
      setupConfirmHappyPath();
      repos.receipt.findOne.mockResolvedValue(null);
      repos.profile.findOne.mockResolvedValue(null);

      // Act
      await service.confirmPaymentFlow(7, confirmDto, ownerUser);

      // Assert
      expect(repos.receipt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TRANX_ID: 7,
          RC_NAME: 'Somchai',
          RC_TAX_ID: '1234567890123',
          RC_STATUS: ReceiptStatus.UNISSUED,
          RC_SIGNATURE_ID: 'fixed-uuid-qr',
        }),
      );
      expect(repos.receipt.save).toHaveBeenCalled();
      expect(repos.profile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TRANX_ID: 7,
          TP_NAME: 'Somchai',
          TP_TAX_ID: 1234567890123,
        }),
      );
      expect(repos.profile.save).toHaveBeenCalled();
    });

    it('should skip receipt creation without receiptName but still mark PAID (TXN-U-017)', async () => {
      // Arrange
      const transaction = basePendingTransaction();
      setupConfirmHappyPath({ transaction });

      // Act
      await service.confirmPaymentFlow(7, { userCode: 'U00000010' }, ownerUser);

      // Assert
      expect(transaction.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.PAID,
      );
      expect(repos.receipt.create).not.toHaveBeenCalled();
      expect(repos.receipt.save).not.toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should update existing receipt to UNISSUED (TXN-U-018)', async () => {
      // Arrange
      const existingReceipt = {
        RC_ID: 3,
        TRANX_ID: 7,
        RC_NAME: 'Old',
        RC_TAX_ID: '111',
        RC_PHONE: '0800000000',
        RC_ADDRESS: 'Old addr',
        RC_STATUS: ReceiptStatus.ISSUED,
        RC_VERIFY_CODE: 'EXISTINGCODE12345',
      } as Receipt;
      setupConfirmHappyPath({ receipt: existingReceipt });

      // Act
      await service.confirmPaymentFlow(7, confirmDto, ownerUser);

      // Assert
      expect(existingReceipt.RC_NAME).toBe('Somchai');
      expect(existingReceipt.RC_STATUS).toBe(ReceiptStatus.UNISSUED);
      expect(existingReceipt.RC_VERIFY_CODE).toBe('EXISTINGCODE12345');
      expect(repos.receipt.create).not.toHaveBeenCalled();
      expect(repos.receipt.save).toHaveBeenCalledWith(existingReceipt);
    });

    it('should build yyddmm+6erm ref or BadRequest for out-of-range ERM (TXN-U-019)', async () => {
      // Arrange — valid bounds
      jest.useFakeTimers();
      const fixed = new Date(Date.UTC(2026, 7, 5, 12, 0, 0));
      jest.setSystemTime(fixed);
      const transaction = basePendingTransaction({ ERM_ID: 42 });
      setupConfirmHappyPath({
        transaction,
        enrollment: baseEnrollment({ ERM_ID: 42 }),
      });
      repos.receipt.findOne.mockResolvedValue(null);

      // Act
      await service.confirmPaymentFlow(7, { userCode: 'U1' }, ownerUser);

      // Assert — valid format
      const year = String(fixed.getFullYear()).slice(-2);
      const day = String(fixed.getDate()).padStart(2, '0');
      const month = String(fixed.getMonth() + 1).padStart(2, '0');
      expect(repos.ref.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TSC_REF2: `${year}${day}${month}000042`,
        }),
      );

      // Arrange — out of range
      jest.clearAllMocks();
      queryRunner.manager.getRepository.mockImplementation((entity: unknown) =>
        getRepository(entity),
      );
      dataSource.createQueryRunner.mockReturnValue(queryRunner);
      const outOfRangeTx = basePendingTransaction({
        ERM_ID: 1_000_000,
      });
      setupConfirmHappyPath({
        transaction: outOfRangeTx,
        enrollment: baseEnrollment({ ERM_ID: 1_000_000 }),
      });

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, { userCode: 'U1' }, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should rollback and rethrow when mid-flow save fails (TXN-U-020)', async () => {
      // Arrange
      setupConfirmHappyPath();
      const boom = new Error('db write failed');
      repos.transaction.save.mockRejectedValue(boom);

      // Act / Assert
      await expect(
        service.confirmPaymentFlow(7, { userCode: 'U1' }, ownerUser),
      ).rejects.toThrow('db write failed');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('expireTransaction', () => {
    it('should expire PENDING, cancel UNPAID enrollment, and write history (TXN-U-021)', async () => {
      // Arrange
      const transaction = basePendingTransaction();
      const enrollment = baseEnrollment({
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
      });
      repos.transaction.findOne.mockResolvedValue(transaction);
      repos.enrollment.findOne.mockResolvedValue(enrollment);

      // Act
      await service.expireTransaction(7, ownerUser);

      // Assert
      expect(transaction.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.EXPIRED,
      );
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);
      expect(repos.enrollment.save).toHaveBeenCalledWith(enrollment);
      expect(repos.history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TSH_FROM: String(TransactionPaymentStatus.PENDING),
          TSH_TO: String(TransactionPaymentStatus.EXPIRED),
          TSH_RESP_MESSAGE: 'Payment expired',
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should reject expire when not PENDING (TXN-U-022)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
        }),
      );
      repos.enrollment.findOne.mockResolvedValue(baseEnrollment());

      // Act / Assert
      await expect(
        service.expireTransaction(7, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw ForbiddenException for non-owner candidate (TXN-U-023)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(basePendingTransaction());
      repos.enrollment.findOne.mockResolvedValue(
        baseEnrollment({ USER_ID: 10 }),
      );

      // Act / Assert
      await expect(
        service.expireTransaction(7, otherCandidate),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw NotFoundException when transaction missing (TXN-U-024)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.expireTransaction(999, ownerUser),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('startPaymentSession', () => {
    const enrollmentWithPayEnd = (
      payEnd: Date | null = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ): ExamEnrollment =>
      baseEnrollment({
        SESSION: {
          EXAM: {
            EXAM_PAY_END_DATE: payEnd,
          },
        },
      } as Partial<ExamEnrollment>);

    it('should set TRANX_EXPIRES_AT when starting a new session (TXN-U-040)', async () => {
      // Arrange
      const transaction = basePendingTransaction({ TRANX_EXPIRES_AT: null });
      repos.transaction.findOne.mockResolvedValue(transaction);
      repos.enrollment.findOne.mockResolvedValue(enrollmentWithPayEnd());
      repos.transaction.save.mockImplementation(async (entity) => entity);

      // Act
      const result = await service.startPaymentSession(7, ownerUser);

      // Assert
      expect(result.TRANX_ID).toBe(7);
      expect(result.TRANX_EXPIRES_AT).toBeInstanceOf(Date);
      expect(transaction.TRANX_EXPIRES_AT).toEqual(result.TRANX_EXPIRES_AT);
      expect(repos.transaction.save).toHaveBeenCalled();
    });

    it('should return existing expiry without reset (TXN-U-041)', async () => {
      // Arrange
      const existingExpiry = new Date(Date.now() + 10 * 60 * 1000);
      const transaction = basePendingTransaction({
        TRANX_EXPIRES_AT: existingExpiry,
      });
      repos.transaction.findOne.mockResolvedValue(transaction);
      repos.enrollment.findOne.mockResolvedValue(enrollmentWithPayEnd());

      // Act
      const result = await service.startPaymentSession(7, ownerUser);

      // Assert
      expect(result.TRANX_EXPIRES_AT).toEqual(existingExpiry);
      expect(repos.transaction.save).not.toHaveBeenCalled();
    });

    it('should reject when payment period ended (TXN-U-042)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({ TRANX_EXPIRES_AT: null }),
      );
      repos.enrollment.findOne.mockResolvedValue(
        enrollmentWithPayEnd(new Date(Date.now() - 60_000)),
      );

      // Act / Assert
      await expect(
        service.startPaymentSession(7, ownerUser),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createPendingPayment', () => {
    const pendingDto = {
      ERM_ID: 42,
      TRANX_AMOUNT: 500,
      RC_TAX_ID: '1234567890123',
      RC_NAME: 'Somchai',
      RC_PHONE: '0812345678',
      RC_ADDRESS: 'Burapha',
    };

    const enrollmentWithFee = (fee: number | null = 500): ExamEnrollment =>
      ({
        ERM_ID: 42,
        USER_ID: 10,
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        SESSION: {
          EXAM: {
            EXAM_FEE: fee,
          },
        },
      }) as unknown as ExamEnrollment;

    it('should create PAID+MATCH transaction with receipt and ERM PAID (TXN-U-025)', async () => {
      // Arrange
      const enrollment = enrollmentWithFee(500);
      repos.enrollment.findOne.mockResolvedValue(enrollment);
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.transaction.findOne.mockResolvedValue(null);
      repos.profile.findOne.mockResolvedValue(null);
      repos.transaction.save.mockImplementation(async (entity) => ({
        ...entity,
        TRANX_ID: 200,
        RECEIPTS: [],
      }));

      // Act
      const result = await service.createPendingPayment(pendingDto);

      // Assert
      expect(result.transaction.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.PAID,
      );
      expect(result.transaction.TRANX_MATCH_STATUS).toBe(
        TransactionMatchStatus.MATCH,
      );
      expect(result.receipt.RC_STATUS).toBe(ReceiptStatus.UNISSUED);
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.PAID);
      expect(repos.enrollment.save).toHaveBeenCalledWith(enrollment);
      expect(repos.profile.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when amount does not match exam fee (TXN-U-026)', async () => {
      // Arrange
      repos.enrollment.findOne.mockResolvedValue(enrollmentWithFee(500));
      repos.paymentConfig.exists.mockResolvedValue(true);

      // Act / Assert
      await expect(
        service.createPendingPayment({ ...pendingDto, TRANX_AMOUNT: 400 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when exam fee is missing (TXN-U-027)', async () => {
      // Arrange
      repos.enrollment.findOne.mockResolvedValue(enrollmentWithFee(null));
      repos.paymentConfig.exists.mockResolvedValue(true);

      // Act / Assert
      await expect(
        service.createPendingPayment(pendingDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw ConflictException for non-PENDING/non-PAID prior transaction (TXN-U-028)', async () => {
      // Arrange
      repos.enrollment.findOne.mockResolvedValue(enrollmentWithFee(500));
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.EXPIRED,
        }),
      );

      // Act / Assert
      await expect(
        service.createPendingPayment(pendingDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should overwrite existing PENDING/PAID to PAID/MATCH (TXN-U-029)', async () => {
      // Arrange
      const enrollment = enrollmentWithFee(500);
      const existing = basePendingTransaction({
        TRANX_ID: 8,
        TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PENDING,
        RECEIPTS: [],
      });
      repos.enrollment.findOne.mockResolvedValue(enrollment);
      repos.paymentConfig.exists.mockResolvedValue(true);
      repos.transaction.findOne.mockResolvedValue(existing);
      repos.profile.findOne.mockResolvedValue(null);
      repos.transaction.save.mockImplementation(async (entity) => entity);

      // Act
      const result = await service.createPendingPayment(pendingDto);

      // Assert
      expect(result.transaction.TRANX_ID).toBe(8);
      expect(result.transaction.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.PAID,
      );
      expect(result.transaction.TRANX_MATCH_STATUS).toBe(
        TransactionMatchStatus.MATCH,
      );
      expect(repos.transaction.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when ERM or PC 1 is missing (TXN-U-030)', async () => {
      // Arrange / Act / Assert — missing enrollment
      repos.enrollment.findOne.mockResolvedValue(null);
      await expect(
        service.createPendingPayment(pendingDto),
      ).rejects.toBeInstanceOf(NotFoundException);

      // Arrange / Act / Assert — missing PC 1
      repos.enrollment.findOne.mockResolvedValue(enrollmentWithFee(500));
      repos.paymentConfig.exists.mockResolvedValue(false);
      await expect(
        service.createPendingPayment(pendingDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('refundTransaction', () => {
    it('should refund PAID and cancel enrollment (TXN-U-031)', async () => {
      // Arrange
      const enrollment = baseEnrollment({
        ERM_STATUS: ExamEnrollmentStatus.PAID,
      });
      const transaction = basePendingTransaction({
        TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
        RECEIPTS: [{ RC_STATUS: ReceiptStatus.UNISSUED } as Receipt],
        ENROLLMENT: enrollment,
      });
      repos.transaction.findOne.mockResolvedValue(transaction);
      repos.transaction.save.mockImplementation(async (entity) => entity);

      // Act
      const result = await service.refundTransaction(7);

      // Assert
      expect(result.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.REFUND);
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);
      expect(repos.history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TSH_FROM: String(TransactionPaymentStatus.PAID),
          TSH_TO: String(TransactionPaymentStatus.REFUND),
          TSH_API_TYPE: TransactionApiType.REVERSAL,
          TSH_RESP_MESSAGE: 'Payment refunded',
        }),
      );
      expect(repos.enrollment.save).toHaveBeenCalledWith(enrollment);
    });

    it('should refund APPROVED transactions (TXN-U-032)', async () => {
      // Arrange
      const enrollment = baseEnrollment({
        ERM_STATUS: ExamEnrollmentStatus.PAID,
      });
      const transaction = basePendingTransaction({
        TRANX_PAYMENT_STATUS: TransactionPaymentStatus.APPROVED,
        RECEIPTS: [],
        ENROLLMENT: enrollment,
      });
      repos.transaction.findOne.mockResolvedValue(transaction);
      repos.transaction.save.mockImplementation(async (entity) => entity);

      // Act
      const result = await service.refundTransaction(7);

      // Assert
      expect(result.TRANX_PAYMENT_STATUS).toBe(TransactionPaymentStatus.REFUND);
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);
    });

    it('should reject refund for non-refundable status (TXN-U-033)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PENDING,
          RECEIPTS: [],
        }),
      );

      // Act / Assert
      await expect(service.refundTransaction(7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw ConflictException when already REFUND or RECEIPT_VOIDED (TXN-U-034)', async () => {
      // Arrange / Act / Assert — REFUND
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.REFUND,
        }),
      );
      await expect(service.refundTransaction(7)).rejects.toBeInstanceOf(
        ConflictException,
      );

      // Arrange / Act / Assert — RECEIPT_VOIDED
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.RECEIPT_VOIDED,
        }),
      );
      await expect(service.refundTransaction(7)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should block refund when an ISSUED receipt exists (TXN-U-035)', async () => {
      // Arrange
      repos.transaction.findOne.mockResolvedValue(
        basePendingTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
          RECEIPTS: [{ RC_STATUS: ReceiptStatus.ISSUED } as Receipt],
        }),
      );

      // Act / Assert
      await expect(service.refundTransaction(7)).rejects.toThrow(
        /void the receipt instead/i,
      );
      await expect(service.refundTransaction(7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions with defaults (TXN-U-036)', async () => {
      // Arrange — defaults from beforeEach

      // Act
      const result = await service.findAll();

      // Assert
      expect(transactionsRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['ENROLLMENT'],
        skip: 0,
        take: PAGINATION_DEFAULT_LIMIT,
        order: { TRANX_ID: 'DESC' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.total).toBe(1);
    });

    it('should honor page and limit query params (TXN-U-036)', async () => {
      // Arrange / Act
      await service.findAll({ page: 2, limit: 25 });

      // Assert
      expect(transactionsRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 25,
          take: 25,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when transaction is missing (TXN-U-037)', async () => {
      // Arrange
      transactionsRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return transaction when found (TXN-U-037)', async () => {
      // Arrange
      const transaction = basePendingTransaction();
      transactionsRepository.findOne.mockResolvedValue(transaction);

      // Act
      const result = await service.findOne(7);

      // Assert
      expect(result).toBe(transaction);
      expect(transactionsRepository.findOne).toHaveBeenCalledWith({
        where: { TRANX_ID: 7 },
        relations: ['ENROLLMENT'],
      });
    });

    it('should allow owner to get own transaction (TXN-U-037b)', async () => {
      // Arrange
      const transaction = {
        ...basePendingTransaction(),
        ENROLLMENT: baseEnrollment({ USER_ID: 10 }),
      } as Transaction;
      transactionsRepository.findOne.mockResolvedValue(transaction);

      // Act
      const result = await service.findOne(7, ownerUser);

      // Assert
      expect(result).toBe(transaction);
    });

    it('should forbid non-owner non-FINANCE from get (TXN-U-037c)', async () => {
      // Arrange
      const transaction = {
        ...basePendingTransaction(),
        ENROLLMENT: baseEnrollment({ USER_ID: 10 }),
      } as Transaction;
      transactionsRepository.findOne.mockResolvedValue(transaction);

      // Act / Assert
      await expect(service.findOne(7, otherCandidate)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('update / updateByErmId / remove', () => {
    it('should assign+save, return null when missing erm, and softRemove (TXN-U-038)', async () => {
      // Arrange — update
      const existing = basePendingTransaction({ TRANX_AMOUNT: 500 });
      transactionsRepository.findOne.mockResolvedValue(existing);
      transactionsRepository.save.mockImplementation(async (entity) => entity);

      // Act
      const updated = await service.update(7, {
        TRANX_AMOUNT: 700,
      });

      // Assert
      expect(updated.TRANX_AMOUNT).toBe(700);
      expect(transactionsRepository.save).toHaveBeenCalledWith(existing);

      // Arrange — updateByErmId missing
      transactionsRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.updateByErmId(999, { TRANX_AMOUNT: 1 }),
      ).resolves.toBeNull();

      // Arrange — updateByErmId existing
      const byErm = basePendingTransaction({ TRANX_ID: 11, ERM_ID: 42 });
      transactionsRepository.findOne.mockResolvedValue(byErm);
      transactionsRepository.save.mockImplementation(async (entity) => entity);

      // Act
      const updatedByErm = await service.updateByErmId(42, {
        TRANX_AMOUNT: 800,
      });

      // Assert
      expect(updatedByErm?.TRANX_AMOUNT).toBe(800);

      // Arrange — soft remove
      const toRemove = basePendingTransaction();
      transactionsRepository.findOne.mockResolvedValue(toRemove);

      // Act
      await service.remove(7);

      // Assert
      expect(transactionsRepository.softRemove).toHaveBeenCalledWith(toRemove);
    });
  });
});
