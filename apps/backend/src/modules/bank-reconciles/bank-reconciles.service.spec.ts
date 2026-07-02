import type { DataSource, Repository } from 'typeorm';
import { createHash } from 'crypto';

jest.mock('../transactions/entities/transaction.entity', () => ({
  Transaction: class Transaction {},
  TransactionMatchStatus: {
    MATCH: 1,
    MISSING: 2,
  },
  TransactionPaymentStatus: {
    APPROVED: 2,
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
    PAID: 'PAID',
  },
}));

jest.mock('../receipts/entities/receipt.entity', () => ({
  ReceiptStatus: {
    ISSUED: 'ISSUED',
  },
}));

jest.mock('./entities/bank-reconcile.entity', () => ({
  BankReconcile: class BankReconcile {},
}));

jest.mock('./entities/bank-reconcile-edit-log.entity', () => ({
  BankReconcileEditLog: class BankReconcileEditLog {},
}));

import { BankReconcilesService } from './bank-reconciles.service';
import type { BankReconcile } from './entities/bank-reconcile.entity';
import type {
  BankReconcileChangeReason,
  BankReconcileEditSnapshot,
} from './entities/bank-reconcile-edit-log.entity';

interface ExistingBankReconcileHashRow {
  BR_IMPORT_KEY_HASH: string | null;
}

interface MockQueryBuilder {
  select: jest.Mock<MockQueryBuilder, [string[]]>;
  from: jest.Mock<MockQueryBuilder, [string, string]>;
  where: jest.Mock<MockQueryBuilder, [string]>;
  andWhere: jest.Mock<MockQueryBuilder, [string, Record<string, string[]>]>;
  getRawMany: jest.Mock<Promise<ExistingBankReconcileHashRow[]>, []>;
}

interface MockBankReconcileRepository {
  create: jest.Mock<BankReconcile[], [Array<Partial<BankReconcile>>]>;
  save: jest.Mock<Promise<BankReconcile[]>, [BankReconcile[]]>;
  find: jest.Mock<Promise<BankReconcile[]>, [unknown?]>;
}

interface ChangeReasonProbe {
  getChangeReason(
    oldSnapshot: BankReconcileEditSnapshot,
    newSnapshot: BankReconcileEditSnapshot,
  ): BankReconcileChangeReason | null;
}

const createCsvFile = (content: string): Express.Multer.File =>
  ({
    originalname: 'payments.csv',
    buffer: Buffer.from(content),
  }) as Express.Multer.File;

const createQueryBuilder = (
  existingRows: ExistingBankReconcileHashRow[] = [],
): MockQueryBuilder => {
  const queryBuilder = {
    select: jest.fn<MockQueryBuilder, [string[]]>(),
    from: jest.fn<MockQueryBuilder, [string, string]>(),
    where: jest.fn<MockQueryBuilder, [string]>(),
    andWhere: jest.fn<MockQueryBuilder, [string, Record<string, string[]>]>(),
    getRawMany: jest
      .fn<Promise<ExistingBankReconcileHashRow[]>, []>()
      .mockResolvedValue(existingRows),
  };

  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.from.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);

  return queryBuilder;
};

const createImportHash = (importKey: string): string =>
  createHash('sha256').update(importKey).digest('hex');

describe('BankReconcilesService', () => {
  let repository: MockBankReconcileRepository;
  let dataSource: DataSource;
  let service: BankReconcilesService;

  beforeEach(() => {
    repository = {
      create: jest.fn((rows: Array<Partial<BankReconcile>>) =>
        rows.map(
          (row, index) => ({ BR_ID: index + 1, ...row }) as BankReconcile,
        ),
      ),
      save: jest.fn((rows: BankReconcile[]) => Promise.resolve(rows)),
      find: jest.fn(() => Promise.resolve([] as BankReconcile[])),
    };

    const queryBuilder = createQueryBuilder();
    dataSource = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    } as unknown as DataSource;

    service = new BankReconcilesService(
      repository as unknown as Repository<BankReconcile>,
      dataSource,
    );
  });

  it('blocks the whole import when the uploaded file has duplicate payment rows', async () => {
    const file = createCsvFile(
      [
        'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
        '64000001,REF001,Alice,100.00,2026-06-22,10:00',
        '64000001,REF001,Alice,100.00,2026-06-22,10:00',
      ].join('\n'),
    );

    const result = await service.importFile(file, 1);

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

  it('stores an immutable import key hash on imported payment rows', async () => {
    const file = createCsvFile(
      [
        'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
        '64000001,REF001,Alice,100.00,2026-06-22,10:00',
      ].join('\n'),
    );
    const expectedHash = createImportHash(
      '64000001|ref001|2026-06-22|10:00|10000|alice',
    );

    const result = await service.importFile(file, 1);

    expect(repository.create).toHaveBeenCalledWith([
      expect.objectContaining({
        BR_IMPORT_KEY_HASH: expectedHash,
      }),
    ]);
    expect(result.imported).toBe(1);
  });

  it('blocks import when the immutable import key hash already exists', async () => {
    const expectedHash = createImportHash(
      '64000001|ref001|2026-06-22|10:00|10000|alice',
    );
    const queryBuilder = createQueryBuilder([
      { BR_IMPORT_KEY_HASH: expectedHash },
    ]);
    (
      dataSource as unknown as {
        createQueryBuilder: jest.Mock<MockQueryBuilder, []>;
      }
    ).createQueryBuilder.mockReturnValue(queryBuilder);

    const file = createCsvFile(
      [
        'applicantId,referenceNo,payerName,amount,paymentDate,paymentTime',
        '64000001,REF001,Alice,100.00,2026-06-22,10:00',
      ].join('\n'),
    );

    const result = await service.importFile(file, 1);

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

  it('derives edit log change reason from changed refs', () => {
    const probe = service as unknown as ChangeReasonProbe;
    const oldSnapshot: BankReconcileEditSnapshot = {
      BR_REF1: 'REF1-A',
      BR_REF2: 'REF2-A',
      TRANX_ID: 1,
      TRANX_MATCH_STATUS: 1,
    };

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
