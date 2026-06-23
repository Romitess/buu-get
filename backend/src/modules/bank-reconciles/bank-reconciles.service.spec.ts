import type { DataSource, Repository } from 'typeorm';

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

import { BankReconcilesService } from './bank-reconciles.service';
import type { BankReconcile } from './entities/bank-reconcile.entity';

interface ExistingBankReconcileKeyRow {
  BR_REF1: string;
  BR_REF2: string | null;
  BR_REF3: string | null;
  BR_REF4: string | null;
  BR_AMOUNT: number | string;
  BR_PAID_BY: string;
}

interface MockQueryBuilder {
  select: jest.Mock<MockQueryBuilder, [string[]]>;
  from: jest.Mock<MockQueryBuilder, [string, string]>;
  where: jest.Mock<MockQueryBuilder, [string]>;
  andWhere: jest.Mock<MockQueryBuilder, [string, Record<string, string[]>]>;
  getRawMany: jest.Mock<Promise<ExistingBankReconcileKeyRow[]>, []>;
}

interface MockBankReconcileRepository {
  create: jest.Mock<BankReconcile[], [Array<Partial<BankReconcile>>]>;
  save: jest.Mock<Promise<BankReconcile[]>, [BankReconcile[]]>;
  find: jest.Mock<Promise<BankReconcile[]>, [unknown?]>;
}

const createCsvFile = (content: string): Express.Multer.File =>
  ({
    originalname: 'payments.csv',
    buffer: Buffer.from(content),
  }) as Express.Multer.File;

const createQueryBuilder = (
  existingRows: ExistingBankReconcileKeyRow[] = [],
): MockQueryBuilder => {
  const queryBuilder = {
    select: jest.fn<MockQueryBuilder, [string[]]>(),
    from: jest.fn<MockQueryBuilder, [string, string]>(),
    where: jest.fn<MockQueryBuilder, [string]>(),
    andWhere: jest.fn<MockQueryBuilder, [string, Record<string, string[]>]>(),
    getRawMany: jest
      .fn<Promise<ExistingBankReconcileKeyRow[]>, []>()
      .mockResolvedValue(existingRows),
  };

  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.from.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);

  return queryBuilder;
};

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
});
