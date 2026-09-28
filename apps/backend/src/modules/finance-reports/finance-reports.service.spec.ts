import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { ReceiptStatus } from '../receipts/entities/receipt.entity';
import { FinanceReportsController } from './finance-reports.controller';
import { FinanceReportsService } from './finance-reports.service';

type MockQueryBuilder = {
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  andWhere: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  getRawMany: jest.Mock;
};

const createQueryBuilderMock = (rawRows: unknown[] = []): MockQueryBuilder => {
  const qb: MockQueryBuilder = {
    innerJoin: jest.fn(),
    leftJoin: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue(rawRows),
  };
  qb.innerJoin.mockReturnValue(qb);
  qb.leftJoin.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.addOrderBy.mockReturnValue(qb);
  return qb;
};

const issuedRow = (overrides: Record<string, unknown> = {}) => ({
  receiptId: 1,
  receiptNo: 'RC2026-00001',
  receiptStatus: ReceiptStatus.ISSUED,
  issuedAt: '2026-03-15T02:00:00.000Z',
  collectorName: 'ผู้รับเงิน',
  payerName: 'ชื่อบนใบเสร็จ',
  amount: '100.50',
  paidAt: '2026-03-14T02:30:00.000Z',
  tranxId: 9,
  applicantTitleTh: 'นาย',
  applicantNameTh: 'สมชาย ใจดี',
  applicantTitleEn: null,
  applicantNameEn: null,
  applicantEmail: 'a@example.com',
  examId: 4,
  examName: 'BUU-GET',
  examRound: '1',
  fiscalYear: '2569',
  fundSourceId: 7,
  fundSourceCode: '1101',
  fundSourceName: 'ค่าสมัคร',
  voidReason: null,
  voidedAt: null,
  voidedByTitleTh: null,
  voidedByNameTh: null,
  voidedByTitleEn: null,
  voidedByNameEn: null,
  voidedByEmail: null,
  ...overrides,
});

describe('FinanceReportsService', () => {
  let service: FinanceReportsService;
  let receiptRepo: { createQueryBuilder: jest.Mock };
  let dataSource: { getRepository: jest.Mock };
  let queryBuilder: MockQueryBuilder;

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();
    receiptRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    dataSource = {
      getRepository: jest.fn().mockReturnValue(receiptRepo),
    };
    service = new FinanceReportsService(dataSource as unknown as DataSource);
  });

  describe('getDailyRevenue', () => {
    it('rejects a report when the receipt date range is missing', async () => {
      await expect(
        service.getDailyRevenue({
          startDate: '',
          endDate: '2026-03-31',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(receiptRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('sums issued receipts by exam and fund source and lists paid dates', async () => {
      queryBuilder = createQueryBuilderMock([
        issuedRow({ amount: '100.50', paidAt: '2026-03-14T02:30:00.000Z' }),
        issuedRow({
          receiptId: 2,
          amount: '50.25',
          paidAt: '2026-03-14T10:00:00.000Z',
        }),
        issuedRow({
          receiptId: 3,
          examId: 8,
          examName: 'Another exam',
          fundSourceId: 9,
          fundSourceCode: '2202',
          fundSourceName: 'แหล่งอื่น',
          amount: 20,
          paidAt: '2026-03-16T02:00:00.000Z',
        }),
      ]);
      receiptRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getDailyRevenue({
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        examName: 'BUU',
        fundSourceId: 7,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'receipt.RC_STATUS IN (:...statuses)',
        { statuses: [ReceiptStatus.ISSUED] },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'receipt.RC_ISSUED_AT >= :startDate',
        { startDate: '2026-03-01 00:00:00' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'receipt.RC_ISSUED_AT <= :endDate',
        { endDate: '2026-03-31 23:59:59' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        `(exam.EXAM_NAME LIKE :examName OR exam.EXAM_ROUND LIKE :examName OR CONCAT(IFNULL(exam.EXAM_ROUND, ''), '/', IFNULL(exam.EXAM_FISCAL_YEAR, '')) LIKE :examName OR CONCAT(exam.EXAM_NAME, ' ', IFNULL(exam.EXAM_ROUND, ''), '/', IFNULL(exam.EXAM_FISCAL_YEAR, '')) LIKE :examName)`,
        { examName: '%BUU%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'fundSource.FS_ID = :fundSourceId',
        { fundSourceId: 7 },
      );
      expect(result.rows).toEqual([
        expect.objectContaining({
          index: 1,
          examName: 'Another exam',
          fundSourceCode: '2202',
          amount: 20,
        }),
        expect.objectContaining({
          index: 2,
          examName: 'BUU-GET',
          fundSourceCode: '1101',
          amount: 150.75,
        }),
      ]);
      expect(result.totalAmount).toBe(170.75);
      expect(result.effectiveDates).toEqual(['2026-03-14', '2026-03-16']);
      expect(result.rows).toHaveLength(2);
    });
  });

  describe('getApplicationFees', () => {
    it('returns issued and voided receipts with cancel details', async () => {
      queryBuilder = createQueryBuilderMock([
        issuedRow(),
        issuedRow({
          receiptId: 5,
          receiptNo: 'RC2026-00005',
          receiptStatus: ReceiptStatus.VOIDED,
          amount: 80,
          voidReason: 'ออกผิด',
          voidedAt: '2026-03-20T03:00:00.000Z',
          voidedByTitleTh: 'นาง',
          voidedByNameTh: 'ผู้ยกเลิก',
        }),
      ]);
      receiptRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getApplicationFees({
        receiptDate: '2026-03-15',
        paidDate: '2026-03-14',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'receipt.RC_STATUS IN (:...statuses)',
        { statuses: [ReceiptStatus.ISSUED, ReceiptStatus.VOIDED] },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.TRANX_PAID_AT >= :paidStart',
        { paidStart: '2026-03-14 00:00:00' },
      );
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(
        expect.objectContaining({
          status: 'issued',
          payerName: 'ชื่อบนใบเสร็จ',
          applicantName: 'นาย สมชาย ใจดี',
          collectorName: 'ผู้รับเงิน',
          voidReason: null,
          amount: 100.5,
        }),
      );
      expect(result.rows[1]).toEqual(
        expect.objectContaining({
          status: 'voided',
          voidReason: 'ออกผิด',
          voidedBy: 'นาง ผู้ยกเลิก',
        }),
      );
    });
  });

  describe('getReceiptUsage', () => {
    it('groups by fund source and keeps a group total', async () => {
      queryBuilder = createQueryBuilderMock([
        issuedRow({ amount: 100 }),
        issuedRow({ receiptId: 2, receiptNo: 'RC2026-00002', amount: 40 }),
        issuedRow({
          receiptId: 3,
          fundSourceId: 8,
          fundSourceCode: '3303',
          fundSourceName: 'อีกแหล่ง',
          amount: 15,
          receiptStatus: ReceiptStatus.VOIDED,
          voidReason: 'ยกเลิก',
        }),
      ]);
      receiptRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getReceiptUsage({ status: 'all' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'receipt.RC_STATUS IN (:...statuses)',
        { statuses: [ReceiptStatus.ISSUED, ReceiptStatus.VOIDED] },
      );
      expect(result.groups).toEqual([
        expect.objectContaining({
          fundSourceCode: '1101',
          totalAmount: 140,
          rows: expect.arrayContaining([
            expect.objectContaining({ index: 1, amount: 100 }),
            expect.objectContaining({ index: 2, amount: 40 }),
          ]),
        }),
        expect.objectContaining({
          fundSourceCode: '3303',
          totalAmount: 15,
          rows: [expect.objectContaining({ status: 'voided', amount: 15 })],
        }),
      ]);
    });

    it('limits voided receipts when status is voided', async () => {
      queryBuilder = createQueryBuilderMock([]);
      receiptRepo.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.getReceiptUsage({ status: 'voided' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'receipt.RC_STATUS IN (:...statuses)',
        { statuses: [ReceiptStatus.VOIDED] },
      );
    });
  });
});

describe('FinanceReportsController roles', () => {
  it('allows only admin and finance', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, FinanceReportsController) as
      | RoleEnum[]
      | undefined;

    expect(roles).toEqual([RoleEnum.ADMIN, RoleEnum.FINANCE]);
    expect(roles).not.toContain(RoleEnum.STAFF);
    expect(roles).not.toContain(RoleEnum.CANDIDATE);
  });
});
