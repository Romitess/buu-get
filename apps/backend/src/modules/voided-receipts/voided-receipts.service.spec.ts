import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { VoidedReceiptsService } from './voided-receipts.service';
import { VoidedReceipt } from './entities/voided-receipt.entity';
import { CreateVoidedReceiptDto } from './dto/create-voided-receipt.dto';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import {
  Transaction,
  TransactionPaymentStatus,
} from '../transactions/entities/transaction.entity';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import {
  TransactionApiType,
  TransactionStatusHistory,
} from '../transaction-status-history/entities/transaction-status-history.entity';

type MockRepo = {
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

describe('VoidedReceiptsService', () => {
  let service: VoidedReceiptsService;
  let voidedReceiptRepository: MockRepo;
  let repos: {
    receipt: MockRepo;
    voided: MockRepo;
    transaction: MockRepo;
    enrollment: MockRepo;
    history: MockRepo;
  };
  let dataSource: { transaction: jest.Mock };

  const getRepository = (entity: unknown): MockRepo => {
    if (entity === Receipt) return repos.receipt;
    if (entity === VoidedReceipt) return repos.voided;
    if (entity === Transaction) return repos.transaction;
    if (entity === ExamEnrollment) return repos.enrollment;
    if (entity === TransactionStatusHistory) return repos.history;
    throw new Error(`Unexpected repository entity: ${String(entity)}`);
  };

  const createMockRepo = (): MockRepo => ({
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((payload: unknown) => payload),
    save: jest.fn(async (entity: unknown) => entity),
  });

  const baseTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
    ({
      TRANX_ID: 100,
      ERM_ID: 50,
      TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
      ...overrides,
    }) as Transaction;

  const baseReceipt = (overrides: Partial<Receipt> = {}): Receipt =>
    ({
      RC_ID: 1,
      RC_STATUS: ReceiptStatus.ISSUED,
      TRANSACTION: baseTransaction(),
      VOIDED_RECEIPT: null,
      ...overrides,
    }) as unknown as Receipt;

  const baseEnrollment = (
    overrides: Partial<ExamEnrollment> = {},
  ): ExamEnrollment =>
    ({
      ERM_ID: 50,
      ERM_STATUS: ExamEnrollmentStatus.PAID,
      ...overrides,
    }) as ExamEnrollment;

  const createDto = (
    overrides: Partial<CreateVoidedReceiptDto> = {},
  ): CreateVoidedReceiptDto => ({
    RC_ID: 1,
    VR_REASON: 'Duplicate payment',
    ...overrides,
  });

  beforeEach(() => {
    voidedReceiptRepository = createMockRepo();
    repos = {
      receipt: createMockRepo(),
      voided: createMockRepo(),
      transaction: createMockRepo(),
      enrollment: createMockRepo(),
      history: createMockRepo(),
    };

    dataSource = {
      transaction: jest.fn(
        async (
          callback: (manager: {
            getRepository: typeof getRepository;
          }) => unknown,
        ) => callback({ getRepository }),
      ),
    };

    service = new VoidedReceiptsService(
      voidedReceiptRepository as unknown as Repository<VoidedReceipt>,
      dataSource as unknown as DataSource,
    );
  });

  describe('create', () => {
    it('VOID-U-001: should void ISSUED receipt, mark txn RECEIPT_VOIDED, cancel ERM, and write REVERSAL history', async () => {
      // Arrange
      const receipt = baseReceipt();
      const enrollment = baseEnrollment();
      const savedVoided = {
        VR_ID: 9,
        RC_ID: 1,
        VR_BY: 7,
        VR_REASON: 'Duplicate payment',
      } as VoidedReceipt;

      repos.receipt.findOne.mockResolvedValue(receipt);
      repos.voided.save.mockResolvedValue(savedVoided);
      repos.enrollment.findOne.mockResolvedValue(enrollment);

      // Act
      const result = await service.create(createDto(), 7);

      // Assert
      expect(result).toEqual(savedVoided);
      expect(receipt.RC_STATUS).toBe(ReceiptStatus.VOIDED);
      expect(repos.receipt.save).toHaveBeenCalledWith(receipt);
      expect(repos.voided.create).toHaveBeenCalledWith({
        RC_ID: 1,
        VR_BY: 7,
        VR_REASON: 'Duplicate payment',
      });
      expect(receipt.TRANSACTION.TRANX_PAYMENT_STATUS).toBe(
        TransactionPaymentStatus.RECEIPT_VOIDED,
      );
      expect(repos.transaction.save).toHaveBeenCalledWith(receipt.TRANSACTION);
      expect(repos.history.create).toHaveBeenCalledWith({
        TRANX_ID: 100,
        TSH_FROM: String(TransactionPaymentStatus.PAID),
        TSH_TO: String(TransactionPaymentStatus.RECEIPT_VOIDED),
        TSH_API_TYPE: TransactionApiType.REVERSAL,
        TSH_RESP_CODE: '000',
        TSH_RESP_MESSAGE: 'Receipt voided',
      });
      expect(repos.history.save).toHaveBeenCalled();
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);
      expect(repos.enrollment.save).toHaveBeenCalledWith(enrollment);
    });

    it('VOID-U-002: should throw BadRequestException when reason is whitespace-only', async () => {
      // Arrange
      const dto = createDto({ VR_REASON: '   ' });

      // Act / Assert
      await expect(service.create(dto, 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('VOID-U-003: should trim VR_REASON before persisting', async () => {
      // Arrange
      const receipt = baseReceipt();
      repos.receipt.findOne.mockResolvedValue(receipt);
      repos.voided.save.mockImplementation(async (entity) => ({
        VR_ID: 9,
        ...(entity as object),
      }));
      repos.enrollment.findOne.mockResolvedValue(null);

      // Act
      await service.create(createDto({ VR_REASON: '  padded reason  ' }), 7);

      // Assert
      expect(repos.voided.create).toHaveBeenCalledWith(
        expect.objectContaining({ VR_REASON: 'padded reason' }),
      );
    });

    it('VOID-U-004: should throw NotFoundException when receipt is missing', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('VOID-U-005: should throw BadRequestException when receipt is UNISSUED', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(
        baseReceipt({ RC_STATUS: ReceiptStatus.UNISSUED }),
      );

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repos.voided.save).not.toHaveBeenCalled();
    });

    it('VOID-U-006: should throw BadRequestException when receipt status is already VOIDED', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(
        baseReceipt({ RC_STATUS: ReceiptStatus.VOIDED }),
      );

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repos.voided.save).not.toHaveBeenCalled();
    });

    it('VOID-U-007: should throw ConflictException when VOIDED_RECEIPT relation already exists', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(
        baseReceipt({
          VOIDED_RECEIPT: { VR_ID: 99 } as VoidedReceipt,
        }),
      );

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repos.voided.save).not.toHaveBeenCalled();
    });

    it('VOID-U-008: should throw NotFoundException when TRANSACTION is null', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(
        baseReceipt({ TRANSACTION: null as unknown as Transaction }),
      );

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('VOID-U-009: should throw ConflictException when transaction status is REFUND', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(
        baseReceipt({
          TRANSACTION: baseTransaction({
            TRANX_PAYMENT_STATUS: TransactionPaymentStatus.REFUND,
          }),
        }),
      );

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repos.voided.save).not.toHaveBeenCalled();
    });

    it('VOID-U-010: should throw ConflictException when transaction status is RECEIPT_VOIDED', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(
        baseReceipt({
          TRANSACTION: baseTransaction({
            TRANX_PAYMENT_STATUS: TransactionPaymentStatus.RECEIPT_VOIDED,
          }),
        }),
      );

      // Act / Assert
      await expect(service.create(createDto(), 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repos.voided.save).not.toHaveBeenCalled();
    });

    it('VOID-U-011: should capture previous PAID status in history TSH_FROM → RECEIPT_VOIDED (8)', async () => {
      // Arrange
      const receipt = baseReceipt({
        TRANSACTION: baseTransaction({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PAID,
        }),
      });
      repos.receipt.findOne.mockResolvedValue(receipt);
      repos.voided.save.mockResolvedValue({
        VR_ID: 9,
        RC_ID: 1,
      });
      repos.enrollment.findOne.mockResolvedValue(null);

      // Act
      await service.create(createDto(), 7);

      // Assert
      expect(repos.history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          TSH_FROM: String(TransactionPaymentStatus.PAID),
          TSH_TO: String(TransactionPaymentStatus.RECEIPT_VOIDED),
          TSH_API_TYPE: TransactionApiType.REVERSAL,
        }),
      );
      expect(TransactionPaymentStatus.RECEIPT_VOIDED).toBe(8);
    });

    it('VOID-U-012: should succeed when enrollment is missing without saving ERM', async () => {
      // Arrange
      const receipt = baseReceipt();
      repos.receipt.findOne.mockResolvedValue(receipt);
      repos.voided.save.mockResolvedValue({
        VR_ID: 9,
        RC_ID: 1,
        VR_REASON: 'Duplicate payment',
      });
      repos.enrollment.findOne.mockResolvedValue(null);

      // Act
      const result = await service.create(createDto(), 7);

      // Assert
      expect(result.VR_ID).toBe(9);
      expect(repos.enrollment.save).not.toHaveBeenCalled();
      expect(receipt.RC_STATUS).toBe(ReceiptStatus.VOIDED);
    });

    it('VOID-U-013: should cancel enrollment when ERM exists', async () => {
      // Arrange
      const enrollment = baseEnrollment({
        ERM_STATUS: ExamEnrollmentStatus.SEAT_ASSIGNED,
      });
      repos.receipt.findOne.mockResolvedValue(baseReceipt());
      repos.voided.save.mockResolvedValue({ VR_ID: 9 });
      repos.enrollment.findOne.mockResolvedValue(enrollment);

      // Act
      await service.create(createDto(), 7);

      // Assert
      expect(repos.enrollment.findOne).toHaveBeenCalledWith({
        where: { ERM_ID: 50 },
      });
      expect(enrollment.ERM_STATUS).toBe(ExamEnrollmentStatus.CANCELLED);
      expect(repos.enrollment.save).toHaveBeenCalledWith(enrollment);
    });

    it('VOID-U-021: should run create inside dataSource.transaction', async () => {
      // Arrange
      repos.receipt.findOne.mockResolvedValue(baseReceipt());
      repos.voided.save.mockResolvedValue({ VR_ID: 9 });
      repos.enrollment.findOne.mockResolvedValue(null);

      // Act
      await service.create(createDto(), 7);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(typeof dataSource.transaction.mock.calls[0][0]).toBe('function');
    });
  });

  describe('findOne', () => {
    it('VOID-U-014: should return voided receipt with RECEIPT and USER relations', async () => {
      // Arrange
      const row = {
        VR_ID: 5,
        RECEIPT: { RC_ID: 1 },
        USER: { USER_ID: 7 },
      } as VoidedReceipt;
      voidedReceiptRepository.findOne.mockResolvedValue(row);

      // Act
      const result = await service.findOne(5);

      // Assert
      expect(voidedReceiptRepository.findOne).toHaveBeenCalledWith({
        where: { VR_ID: 5 },
        relations: ['RECEIPT', 'USER'],
      });
      expect(result).toEqual(row);
      expect(result.RECEIPT).toBeDefined();
      expect(result.USER).toBeDefined();
    });

    it('VOID-U-015: should throw NotFoundException when voided receipt is missing', async () => {
      // Arrange
      voidedReceiptRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('VOID-U-016: should use default pagination page 1 limit 10', async () => {
      // Arrange
      voidedReceiptRepository.findAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await service.findAll({});

      // Assert
      expect(voidedReceiptRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['RECEIPT', 'USER'],
        skip: 0,
        take: PAGINATION_DEFAULT_LIMIT,
        order: { VR_ID: 'DESC' },
      });
      expect(result.meta.page).toBe(PAGINATION_DEFAULT_PAGE);
      expect(result.meta.limit).toBe(PAGINATION_DEFAULT_LIMIT);
    });

    it('VOID-U-017: should apply custom pagination page 2 limit 5 (skip 5)', async () => {
      // Arrange
      const rows = [{ VR_ID: 1 }] as VoidedReceipt[];
      voidedReceiptRepository.findAndCount.mockResolvedValue([rows, 12]);

      // Act
      const result = await service.findAll({ page: 2, limit: 5 });

      // Assert
      expect(voidedReceiptRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['RECEIPT', 'USER'],
        skip: 5,
        take: 5,
        order: { VR_ID: 'DESC' },
      });
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.data).toEqual(rows);
    });
  });
});
