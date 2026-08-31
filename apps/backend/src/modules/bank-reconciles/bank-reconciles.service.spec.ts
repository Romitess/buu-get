import type { DataSource, Repository } from 'typeorm';
import { createHash } from 'crypto';

jest.mock('../transactions/entities/transaction.entity', () => ({
  Transaction: class Transaction {},
  TransactionMatchStatus: {
    UNMATCH: 0,
    MATCH: 1,
    MISSING: 2,
  },
  TransactionPaymentStatus: {
    PENDING: 0,
    APPROVED: 1,
    REFUND: 7,
    RECEIPT_VOIDED: 8,
  },
}));

jest.mock('../transaction-refs/entities/transaction-ref.entity', () => ({
  TransactionRef: class TransactionRef {},
}));

jest.mock(
  '../transaction-status-history/entities/transaction-status-history.entity',
  () => ({
    TransactionApiType: {
      APPROVE: 'APPROVE',
    },
  }),
);

jest.mock('../exam-enrollments/entities/exam-enrollment.entity', () => ({
  ExamEnrollmentStatus: {
    PAID: 1,
    CANCELLED: 5,
  },
}));

jest.mock('../receipts/entities/receipt.entity', () => ({
  ReceiptStatus: {
    ISSUED: 1,
  },
}));

jest.mock('./entities/bank-reconcile.entity', () => ({
  BankReconcile: class BankReconcile {},
}));

jest.mock('./entities/bank-reconcile-edit-log.entity', () => ({
  BankReconcileEditLog: class BankReconcileEditLog {},
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Transaction,
  TransactionMatchStatus,
  TransactionPaymentStatus,
} from '../transactions/entities/transaction.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { TransactionApiType } from '../transaction-status-history/entities/transaction-status-history.entity';
import { ExamEnrollmentStatus } from '../exam-enrollments/entities/exam-enrollment.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { BankReconcilesService } from './bank-reconciles.service';
import { ReceiptNumberService } from '../receipts/receipt-number.service';
import { BankReconcile } from './entities/bank-reconcile.entity';
import {
  BankReconcileEditLog,
  type BankReconcileChangeReason,
  type BankReconcileEditSnapshot,
} from './entities/bank-reconcile-edit-log.entity';

interface ExistingBankReconcileHashRow {
  BR_IMPORT_KEY_HASH: string | null;
}

interface MockQueryBuilder {
  select: jest.Mock<MockQueryBuilder, [unknown?]>;
  from: jest.Mock<MockQueryBuilder, [unknown?, unknown?]>;
  innerJoin: jest.Mock<MockQueryBuilder, unknown[]>;
  leftJoin: jest.Mock<MockQueryBuilder, unknown[]>;
  where: jest.Mock<MockQueryBuilder, unknown[]>;
  andWhere: jest.Mock<MockQueryBuilder, unknown[]>;
  groupBy: jest.Mock<MockQueryBuilder, [string]>;
  addGroupBy: jest.Mock<MockQueryBuilder, [string]>;
  orderBy: jest.Mock<MockQueryBuilder, unknown[]>;
  addOrderBy: jest.Mock<MockQueryBuilder, unknown[]>;
  update: jest.Mock<MockQueryBuilder, unknown[]>;
  set: jest.Mock<MockQueryBuilder, unknown[]>;
  insert: jest.Mock<MockQueryBuilder, []>;
  into: jest.Mock<MockQueryBuilder, unknown[]>;
  values: jest.Mock<MockQueryBuilder, unknown[]>;
  limit: jest.Mock<MockQueryBuilder, [number]>;
  getRawMany: jest.Mock<Promise<unknown[]>, []>;
  getRawOne: jest.Mock<Promise<Record<string, unknown> | null>, []>;
  execute: jest.Mock<Promise<{ affected?: number }>, []>;
}

interface MockBankReconcileRepository {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
}

interface MockEntityRepository {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  find: jest.Mock;
  update: jest.Mock;
}

interface ChangeReasonProbe {
  getChangeReason(
    oldSnapshot: BankReconcileEditSnapshot,
    newSnapshot: BankReconcileEditSnapshot,
  ): BankReconcileChangeReason | null;
}

interface VerifyMatchesProbe {
  buildVerifyMatches(
    rawRows: Array<{
      BR_ID: number | string;
      BR_AMOUNT: number | string;
      TSR_ID: number | string | null;
      TRANX_ID: number | string | null;
      TRANX_AMOUNT: number | string | null;
    }>,
  ): Array<{
    brId: number;
    tsrId: number;
    tranxId: number;
    matchStatus: TransactionMatchStatus;
  }>;
}

const createCsvFile = (
  content: string,
  originalname = 'payments.csv',
): Express.Multer.File =>
  ({
    originalname,
    buffer: Buffer.from(content),
  }) as Express.Multer.File;

const createQueryBuilder = (
  existingRows: ExistingBankReconcileHashRow[] = [],
  options: {
    getRawOne?: jest.Mock<Promise<Record<string, unknown> | null>, []>;
    getRawMany?: jest.Mock<Promise<unknown[]>, []>;
    execute?: jest.Mock<Promise<{ affected?: number }>, []>;
  } = {},
): MockQueryBuilder => {
  const queryBuilder = {
    select: jest.fn(),
    from: jest.fn(),
    innerJoin: jest.fn(),
    leftJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    update: jest.fn(),
    set: jest.fn(),
    insert: jest.fn(),
    into: jest.fn(),
    values: jest.fn(),
    limit: jest.fn(),
    getRawMany:
      options.getRawMany ??
      jest.fn<Promise<unknown[]>, []>().mockResolvedValue(existingRows),
    getRawOne:
      options.getRawOne ??
      jest
        .fn<Promise<Record<string, unknown> | null>, []>()
        .mockResolvedValue(null),
    execute:
      options.execute ??
      jest
        .fn<Promise<{ affected?: number }>, []>()
        .mockResolvedValue({ affected: 1 }),
  };

  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.from.mockReturnValue(queryBuilder);
  queryBuilder.innerJoin.mockReturnValue(queryBuilder);
  queryBuilder.leftJoin.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  queryBuilder.groupBy.mockReturnValue(queryBuilder);
  queryBuilder.addGroupBy.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
  queryBuilder.update.mockReturnValue(queryBuilder);
  queryBuilder.set.mockReturnValue(queryBuilder);
  queryBuilder.insert.mockReturnValue(queryBuilder);
  queryBuilder.into.mockReturnValue(queryBuilder);
  queryBuilder.values.mockReturnValue(queryBuilder);
  queryBuilder.limit.mockReturnValue(queryBuilder);

  return queryBuilder;
};

const createImportHash = (importKey: string): string =>
  createHash('sha256').update(importKey).digest('hex');

const createMockEntityRepo = (): MockEntityRepository => ({
  create: jest.fn((entity: unknown) => entity),
  save: jest.fn(async (entity: unknown) => entity),
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('BankReconcilesService', () => {
  let repository: MockBankReconcileRepository;
  let dataSource: {
    createQueryBuilder: jest.Mock;
    createQueryRunner: jest.Mock;
    transaction: jest.Mock;
  };
  let service: BankReconcilesService;
  let queryRunner: {
    connect: jest.Mock;
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    rollbackTransaction: jest.Mock;
    release: jest.Mock;
    manager: {
      createQueryBuilder: jest.Mock;
      getRepository: jest.Mock;
    };
  };
  let managerRepos: {
    bankReconcile: MockEntityRepository;
    editLog: MockEntityRepository;
    transactionRef: MockEntityRepository;
    transaction: MockEntityRepository;
    receipt: MockEntityRepository;
  };
  let receiptNumberService: { assignOnIssue: jest.Mock };

  const getManagerRepository = (entity: unknown): MockEntityRepository => {
    if (entity === BankReconcile) return managerRepos.bankReconcile;
    if (entity === BankReconcileEditLog) return managerRepos.editLog;
    if (entity === TransactionRef) return managerRepos.transactionRef;
    if (entity === Transaction) return managerRepos.transaction;
    if (entity === Receipt) return managerRepos.receipt;
    throw new Error(`Unexpected repository entity: ${String(entity)}`);
  };

  beforeEach(() => {
    repository = {
      create: jest.fn((rows: Array<Partial<BankReconcile>>) =>
        rows.map(
          (row, index) => ({ BR_ID: index + 1, ...row }) as BankReconcile,
        ),
      ),
      save: jest.fn((rows: BankReconcile[]) => Promise.resolve(rows)),
      find: jest.fn(() => Promise.resolve([] as BankReconcile[])),
      findOne: jest.fn(),
    };

    managerRepos = {
      bankReconcile: createMockEntityRepo(),
      editLog: createMockEntityRepo(),
      transactionRef: createMockEntityRepo(),
      transaction: createMockEntityRepo(),
      receipt: createMockEntityRepo(),
    };

    const defaultQb = createQueryBuilder();
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        createQueryBuilder: jest.fn(() => createQueryBuilder()),
        getRepository: jest.fn((entity: unknown) =>
          getManagerRepository(entity),
        ),
      },
    };

    dataSource = {
      createQueryBuilder: jest.fn(() => defaultQb),
      createQueryRunner: jest.fn(() => queryRunner),
      transaction: jest.fn(
        async (
          callback: (manager: {
            getRepository: typeof getManagerRepository;
          }) => unknown,
        ) => callback({ getRepository: getManagerRepository }),
      ),
    };

    receiptNumberService = {
      assignOnIssue: jest.fn().mockResolvedValue(undefined),
    };

    service = new BankReconcilesService(
      repository as unknown as Repository<BankReconcile>,
      receiptNumberService as unknown as ReceiptNumberService,
      dataSource as unknown as DataSource,
    );
  });

  describe('importFile', () => {
    it('BR-U-001: should throw BadRequestException when file is missing', async () => {
      // Arrange
      const file = undefined as unknown as Express.Multer.File;

      // Act / Assert
      await expect(service.importFile(file, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('BR-U-002: should throw BadRequestException for non csv/xlsx/xls files', async () => {
      // Arrange
      const file = createCsvFile('not a spreadsheet', 'statement.pdf');

      // Act / Assert
      await expect(service.importFile(file, 1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('BR-U-003: should skip invalid rows and import valid ones', async () => {
      // Arrange
      const file = createCsvFile(
        [
          'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
          '64000001,REF001,Alice,100.00,2026-06-22,10:00',
          ',REF002,Bob,100.00,2026-06-22,10:01',
          '64000003,REF003,,100.00,2026-06-22,10:02',
        ].join('\n'),
      );

      // Act
      const result = await service.importFile(file, 1);

      // Assert
      expect(result.invalidSkipped).toBeGreaterThanOrEqual(1);
      expect(result.imported).toBe(1);
      expect(result.total).toBe(3);
      expect(repository.save).toHaveBeenCalled();
    });

    it('BR-U-004: should truncate import fields to 20 characters', async () => {
      // Arrange
      const longApplicant = 'A'.repeat(25);
      const longRef = 'B'.repeat(25);
      const longPayer = 'C'.repeat(25);
      const longDate = 'D'.repeat(25);
      const longTime = 'E'.repeat(25);
      const file = createCsvFile(
        [
          'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
          `${longApplicant},${longRef},${longPayer},100.00,${longDate},${longTime}`,
        ].join('\n'),
      );

      // Act
      await service.importFile(file, 1);

      // Assert
      expect(repository.create).toHaveBeenCalledWith([
        expect.objectContaining({
          BR_REF1: 'A'.repeat(20),
          BR_REF2: 'B'.repeat(20),
          BR_PAID_BY: 'C'.repeat(20),
          BR_REF3: 'D'.repeat(20),
          BR_REF4: 'E'.repeat(20),
        }),
      ]);
    });

    it('BR-U-005: should abort entire import when uploaded file has duplicate payment rows', async () => {
      // Arrange
      const file = createCsvFile(
        [
          'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
          '64000001,REF001,Alice,100.00,2026-06-22,10:00',
          '64000001,REF001,Alice,100.00,2026-06-22,10:00',
        ].join('\n'),
      );

      // Act
      const result = await service.importFile(file, 1);

      // Assert
      expect(result).toEqual({
        total: 2,
        imported: 0,
        skipped: 2,
        invalidSkipped: 0,
        duplicateSkipped: 1,
        data: [],
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(repository.find).not.toHaveBeenCalled();
    });

    it('BR-U-006: should abort import when immutable import key hash already exists', async () => {
      // Arrange
      const expectedHash = createImportHash(
        '64000001|ref001|2026-06-22|10:00|10000|alice',
      );
      const queryBuilder = createQueryBuilder([
        { BR_IMPORT_KEY_HASH: expectedHash },
      ]);
      dataSource.createQueryBuilder.mockReturnValue(queryBuilder);

      const file = createCsvFile(
        [
          'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
          '64000001,REF001,Alice,100.00,2026-06-22,10:00',
        ].join('\n'),
      );

      // Act
      const result = await service.importFile(file, 1);

      // Assert
      expect(result).toEqual({
        total: 1,
        imported: 0,
        skipped: 1,
        invalidSkipped: 0,
        duplicateSkipped: 1,
        data: [],
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('BR-U-007: should store SHA-256 import key hash on successful import', async () => {
      // Arrange
      const file = createCsvFile(
        [
          'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
          '64000001,REF001,Alice,100.00,2026-06-22,10:00',
        ].join('\n'),
      );
      const expectedHash = createImportHash(
        '64000001|ref001|2026-06-22|10:00|10000|alice',
      );

      // Act
      const result = await service.importFile(file, 1);

      // Assert
      expect(repository.create).toHaveBeenCalledWith([
        expect.objectContaining({
          BR_IMPORT_KEY_HASH: expectedHash,
        }),
      ]);
      expect(result.imported).toBe(1);
    });

    it('BR-U-008: should accept comma-formatted amounts and skip NaN amounts', async () => {
      // Arrange
      const file = createCsvFile(
        [
          'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
          '64000001,REF001,Alice,"1,500.50",2026-06-22,10:00',
          '64000002,REF002,Bob,abc,2026-06-22,10:01',
        ].join('\n'),
      );

      // Act
      const result = await service.importFile(file, 1);

      // Assert
      expect(result.imported).toBe(1);
      expect(result.invalidSkipped).toBeGreaterThanOrEqual(1);
      expect(repository.create).toHaveBeenCalledWith([
        expect.objectContaining({
          BR_AMOUNT: 1500.5,
        }),
      ]);
    });
  });

  describe('buildVerifyMatches', () => {
    it('BR-U-009: should mark MATCH when amounts are equal in cents', () => {
      // Arrange
      const probe = service as unknown as VerifyMatchesProbe;
      const rawRows = [
        {
          BR_ID: 1,
          BR_AMOUNT: '100.00',
          TSR_ID: 10,
          TRANX_ID: 20,
          TRANX_AMOUNT: 100,
        },
      ];

      // Act
      const matches = probe.buildVerifyMatches(rawRows);

      // Assert
      expect(matches).toEqual([
        {
          brId: 1,
          tsrId: 10,
          tranxId: 20,
          matchStatus: TransactionMatchStatus.MATCH,
        },
      ]);
    });

    it('BR-U-010: should mark MISSING when amounts differ but still link the row', () => {
      // Arrange
      const probe = service as unknown as VerifyMatchesProbe;
      const rawRows = [
        {
          BR_ID: 2,
          BR_AMOUNT: '100.00',
          TSR_ID: 11,
          TRANX_ID: 21,
          TRANX_AMOUNT: '99.00',
        },
      ];

      // Act
      const matches = probe.buildVerifyMatches(rawRows);

      // Assert
      expect(matches).toEqual([
        {
          brId: 2,
          tsrId: 11,
          tranxId: 21,
          matchStatus: TransactionMatchStatus.MISSING,
        },
      ]);
    });

    it('BR-U-011: should skip null ids/amounts and keep only the first valid match per BR', () => {
      // Arrange
      const probe = service as unknown as VerifyMatchesProbe;
      const rawRows = [
        {
          BR_ID: 3,
          BR_AMOUNT: '50.00',
          TSR_ID: null,
          TRANX_ID: 30,
          TRANX_AMOUNT: '50.00',
        },
        {
          BR_ID: 3,
          BR_AMOUNT: '50.00',
          TSR_ID: 12,
          TRANX_ID: 31,
          TRANX_AMOUNT: null,
        },
        {
          BR_ID: 3,
          BR_AMOUNT: '50.00',
          TSR_ID: 13,
          TRANX_ID: 32,
          TRANX_AMOUNT: '50.00',
        },
        {
          BR_ID: 3,
          BR_AMOUNT: '50.00',
          TSR_ID: 14,
          TRANX_ID: 33,
          TRANX_AMOUNT: '50.00',
        },
      ];

      // Act
      const matches = probe.buildVerifyMatches(rawRows);

      // Assert
      expect(matches).toEqual([
        {
          brId: 3,
          tsrId: 13,
          tranxId: 32,
          matchStatus: TransactionMatchStatus.MATCH,
        },
      ]);
    });
  });

  describe('getChangeReason', () => {
    it('BR-U-012: should derive edit log change reason from changed refs', () => {
      // Arrange
      const probe = service as unknown as ChangeReasonProbe;
      const oldSnapshot: BankReconcileEditSnapshot = {
        BR_REF1: 'REF1-A',
        BR_REF2: 'REF2-A',
        TRANX_ID: 1,
        TRANX_MATCH_STATUS: 1,
      };

      // Act / Assert
      expect(
        probe.getChangeReason(oldSnapshot, {
          ...oldSnapshot,
          BR_REF1: 'REF1-B',
        }),
      ).toBe('UPDATE_REF1');
      expect(
        probe.getChangeReason(oldSnapshot, {
          ...oldSnapshot,
          BR_REF2: 'REF2-B',
        }),
      ).toBe('UPDATE_REF2');
      expect(
        probe.getChangeReason(oldSnapshot, {
          ...oldSnapshot,
          BR_REF1: 'REF1-B',
          BR_REF2: 'REF2-B',
        }),
      ).toBe('UPDATE_BOTH');
      expect(
        probe.getChangeReason(oldSnapshot, {
          ...oldSnapshot,
          TRANX_ID: 2,
        }),
      ).toBeNull();
    });
  });

  describe('updateRefs', () => {
    const baseBankReconcile = (
      overrides: Partial<BankReconcile> = {},
    ): BankReconcile =>
      ({
        BR_ID: 5,
        TRANX_ID: 100,
        CREATED_BY: 1,
        BR_REF1: 'OLD-REF1',
        BR_REF2: 'OLD-REF2',
        BR_AMOUNT: 500,
        BR_PAID_BY: 'Alice',
        TRANSACTION: {
          TRANX_ID: 100,
          TRANX_MATCH_STATUS: TransactionMatchStatus.MATCH,
        },
        ...overrides,
      }) as BankReconcile;

    it('BR-U-013: should throw BadRequestException when BR_REF1 is blank', async () => {
      // Arrange
      managerRepos.bankReconcile.findOne.mockResolvedValue(baseBankReconcile());

      // Act / Assert
      await expect(
        service.updateRefs(5, { BR_REF1: '   ', BR_REF2: 'REF2' }, 9),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('BR-U-014: should unmatch previous transaction and rematch equal amounts as MATCH', async () => {
      // Arrange
      const existing = baseBankReconcile();
      const rematchedTransaction = {
        TRANX_ID: 200,
        TRANX_AMOUNT: 500,
        TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH,
      };
      const rematchedRef = {
        TSR_ID: 50,
        TRANX_ID: 200,
        BR_ID: null as number | null,
        TRANSACTION: rematchedTransaction,
      };
      const updated = {
        ...existing,
        BR_REF1: 'NEW-REF1',
        BR_REF2: 'NEW-REF2',
        TRANX_ID: 200,
        TRANSACTION: rematchedTransaction,
      };

      managerRepos.bankReconcile.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      managerRepos.transactionRef.findOne.mockResolvedValue(rematchedRef);

      // Act
      const result = await service.updateRefs(
        5,
        { BR_REF1: 'NEW-REF1', BR_REF2: 'NEW-REF2' },
        9,
      );

      // Assert
      expect(managerRepos.transactionRef.update).toHaveBeenCalledWith(
        { BR_ID: 5 },
        { BR_ID: null },
      );
      expect(managerRepos.transaction.update).toHaveBeenCalledWith(
        { TRANX_ID: 100 },
        { TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH },
      );
      expect(rematchedTransaction.TRANX_MATCH_STATUS).toBe(
        TransactionMatchStatus.MATCH,
      );
      expect(rematchedRef.BR_ID).toBe(5);
      expect(managerRepos.transaction.save).toHaveBeenCalledWith(
        rematchedTransaction,
      );
      expect(managerRepos.transactionRef.save).toHaveBeenCalledWith(
        rematchedRef,
      );
      expect(managerRepos.editLog.save).toHaveBeenCalled();
      expect(result.TRANX_ID).toBe(200);
      // BUG-005: stale TRANSACTION relation must not remain on entity before save
      expect(
        Object.prototype.hasOwnProperty.call(existing, 'TRANSACTION'),
      ).toBe(false);
      expect(existing.TRANX_ID).toBe(200);
    });

    it('BR-U-015: should rematch unequal amounts as MISSING while keeping the link', async () => {
      // Arrange
      const existing = baseBankReconcile({
        TRANX_ID: null,
        TRANSACTION: undefined,
      });
      const rematchedTransaction = {
        TRANX_ID: 201,
        TRANX_AMOUNT: 400,
        TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH,
      };
      const rematchedRef = {
        TSR_ID: 51,
        TRANX_ID: 201,
        BR_ID: null as number | null,
        TRANSACTION: rematchedTransaction,
      };
      const updated = {
        ...existing,
        BR_REF1: 'NEW-REF1',
        BR_REF2: 'NEW-REF2',
        TRANX_ID: 201,
        TRANSACTION: rematchedTransaction,
      };

      managerRepos.bankReconcile.findOne
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      managerRepos.transactionRef.findOne.mockResolvedValue(rematchedRef);

      // Act
      await service.updateRefs(
        5,
        { BR_REF1: 'NEW-REF1', BR_REF2: 'NEW-REF2' },
        9,
      );

      // Assert
      expect(rematchedTransaction.TRANX_MATCH_STATUS).toBe(
        TransactionMatchStatus.MISSING,
      );
      expect(rematchedRef.BR_ID).toBe(5);
      expect(managerRepos.transaction.save).toHaveBeenCalledWith(
        rematchedTransaction,
      );
    });
  });

  describe('matchRefs', () => {
    it('BR-U-016: should return empty array when refs are empty', async () => {
      // Arrange / Act
      const empty = await service.matchRefs([]);
      const blank = await service.matchRefs([
        { ref1: '  ', ref2: '' },
        { ref1: '', ref2: '  ' },
      ]);

      // Assert
      expect(empty).toEqual([]);
      expect(blank).toEqual([]);
      expect(dataSource.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('confirmPayment', () => {
    it('BR-U-017: should no-op when tranxIds is empty', async () => {
      // Arrange / Act
      const result = await service.confirmPayment([]);

      // Assert
      expect(result).toEqual({ success: true, updated: 0 });
      expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
    });

    it('BR-U-018: should block REFUND/RECEIPT_VOIDED and rollback', async () => {
      // Arrange
      const selectQb = createQueryBuilder([], {
        getRawMany: jest.fn().mockResolvedValue([
          {
            TRANX_ID: 7,
            TRANX_PAYMENT_STATUS: TransactionPaymentStatus.REFUND,
            ERM_ID: 1,
          },
          {
            TRANX_ID: 8,
            TRANX_PAYMENT_STATUS: TransactionPaymentStatus.RECEIPT_VOIDED,
            ERM_ID: 2,
          },
        ]),
      });
      queryRunner.manager.createQueryBuilder.mockReturnValue(selectQb);

      // Act / Assert
      await expect(service.confirmPayment([7, 8])).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('BR-U-019: should approve, match, issue receipts, mark ERM PAID, and write history', async () => {
      // Arrange
      const builders: MockQueryBuilder[] = [];
      queryRunner.manager.createQueryBuilder.mockImplementation(() => {
        const qb = createQueryBuilder([], {
          getRawMany: jest.fn().mockResolvedValue([
            {
              TRANX_ID: 10,
              TRANX_PAYMENT_STATUS: TransactionPaymentStatus.PENDING,
              ERM_ID: 42,
            },
          ]),
          execute: jest.fn().mockResolvedValue({ affected: 1 }),
        });
        builders.push(qb);
        return qb;
      });
      managerRepos.receipt.find.mockResolvedValue([{ RC_ID: 55 }]);

      // Act
      const result = await service.confirmPayment([10]);

      // Assert
      expect(result).toEqual({ success: true, updated: 1 });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(receiptNumberService.assignOnIssue).toHaveBeenCalledWith(
        queryRunner.manager,
        [55],
      );

      const updateSets = builders
        .filter((qb) => qb.update.mock.calls.length > 0)
        .map((qb) => qb.set.mock.calls[0]?.[0]);
      expect(updateSets).toEqual(
        expect.arrayContaining([
          {
            TRANX_PAYMENT_STATUS: TransactionPaymentStatus.APPROVED,
            TRANX_MATCH_STATUS: TransactionMatchStatus.MATCH,
          },
          { ERM_STATUS: ExamEnrollmentStatus.PAID },
        ]),
      );

      const insertValues = builders.find(
        (qb) => qb.insert.mock.calls.length > 0,
      )?.values.mock.calls[0]?.[0];
      expect(insertValues).toEqual([
        expect.objectContaining({
          TRANX_ID: 10,
          TSH_FROM: String(TransactionPaymentStatus.PENDING),
          TSH_TO: String(TransactionPaymentStatus.APPROVED),
          TSH_API_TYPE: TransactionApiType.APPROVE,
          TSH_RESP_CODE: '00',
          TSH_RESP_MESSAGE: 'SUCCESS',
        }),
      ]);
    });
  });

  describe('getTestExportRows', () => {
    it('BR-U-020: should map test export rows to import-compatible CSV fields', async () => {
      // Arrange
      const paidAt = new Date('2026-06-22T03:00:00.000Z');
      const examQueryBuilder = createQueryBuilder([], {
        getRawOne: jest
          .fn()
          .mockResolvedValue({ EXAM_ID: 10, EXAM_FEE: '500.00' }),
      });
      const rowsQueryBuilder = createQueryBuilder([], {
        getRawMany: jest.fn().mockResolvedValue([
          {
            TSC_REF1: '64000001',
            TSC_REF2: '260622000001',
            PAYER_NAME: 'นายทดสอบ ระบบการเงินยาวมากเกินไป',
            TRANX_AMOUNT: '500.00',
            TRANX_PAID_AT: paidAt,
            TRANX_CREATED_AT: paidAt,
          },
        ]),
      });

      dataSource.createQueryBuilder
        .mockReturnValueOnce(examQueryBuilder)
        .mockReturnValueOnce(rowsQueryBuilder);

      // Act
      const rows = await service.getTestExportRows(10);

      // Assert
      expect(rows).toEqual([
        {
          applicantId: '64000001',
          referenceNo: '260622000001',
          payerName: 'นายทดสอบ ระบบการเงิน',
          amount: '500.00',
          paymentDate: '2026-06-22',
          paymentTime: '10:00',
        },
      ]);
    });

    it('BR-U-021: should reject test export for exams without registration fee', async () => {
      // Arrange
      const examQueryBuilder = createQueryBuilder([], {
        getRawOne: jest
          .fn()
          .mockResolvedValue({ EXAM_ID: 11, EXAM_FEE: '0.00' }),
      });
      dataSource.createQueryBuilder.mockReturnValue(examQueryBuilder);

      // Act / Assert
      await expect(service.getTestExportRows(11)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('BR-U-021: should return not found when exporting test rows for missing exam', async () => {
      // Arrange
      const examQueryBuilder = createQueryBuilder([], {
        getRawOne: jest.fn().mockResolvedValue(null),
      });
      dataSource.createQueryBuilder.mockReturnValue(examQueryBuilder);

      // Act / Assert
      await expect(service.getTestExportRows(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
