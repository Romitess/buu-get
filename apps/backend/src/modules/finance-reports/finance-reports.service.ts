import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import { DailyRevenueReportQueryDto } from './dto/daily-revenue-report-query.dto';
import { ApplicationFeeReportQueryDto } from './dto/application-fee-report-query.dto';
import { ReceiptUsageReportQueryDto } from './dto/receipt-usage-report-query.dto';
import {
  ApplicationFeeReport,
  ApplicationFeeReportRow,
  DailyRevenueReport,
  DailyRevenueReportRow,
  ReceiptReportStatus,
  ReceiptUsageReport,
  ReceiptUsageReportGroup,
  ReceiptUsageReportRow,
} from './interfaces/finance-reports.interface';

interface ReceiptReportFilters {
  statuses: ReceiptStatus[];
  startDate?: string;
  endDate?: string;
  paidDate?: string;
  examName?: string;
  matchExamRound?: boolean;
  fundSourceId?: number;
  fiscalYear?: string;
  payerName?: string;
  collectorName?: string;
  receiptNo?: string;
}

interface ReceiptReportRawRow {
  receiptId: number | string;
  receiptNo: string | null;
  receiptStatus: number | string;
  issuedAt: Date | string | null;
  collectorName: string | null;
  payerName: string | null;
  amount: number | string | null;
  paidAt: Date | string | null;
  tranxId: number | string;
  applicantTitleTh: string | null;
  applicantNameTh: string | null;
  applicantTitleEn: string | null;
  applicantNameEn: string | null;
  applicantEmail: string | null;
  examId: number | string;
  examName: string | null;
  examRound: string | null;
  fiscalYear: string | null;
  fundSourceId: number | string | null;
  fundSourceCode: string | null;
  fundSourceName: string | null;
  voidReason: string | null;
  voidedAt: Date | string | null;
  voidedByTitleTh: string | null;
  voidedByNameTh: string | null;
  voidedByTitleEn: string | null;
  voidedByNameEn: string | null;
  voidedByEmail: string | null;
}

const ISSUED_AND_VOIDED = [ReceiptStatus.ISSUED, ReceiptStatus.VOIDED];

@Injectable()
export class FinanceReportsService {
  constructor(private readonly dataSource: DataSource) {}

  async getDailyRevenue(
    query: DailyRevenueReportQueryDto,
  ): Promise<DailyRevenueReport> {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }
    if (query.startDate > query.endDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }

    const rows = await this.loadReceiptRows({
      statuses: [ReceiptStatus.ISSUED],
      startDate: query.startDate,
      endDate: query.endDate,
      examName: query.examName,
      matchExamRound: true,
      fundSourceId: query.fundSourceId,
    });

    const groups = new Map<string, DailyRevenueReportRow>();
    const effectiveDates = new Set<string>();

    for (const row of rows) {
      const paidDate = toBangkokDate(row.paidAt);
      if (paidDate) effectiveDates.add(paidDate);

      const examId = toNumber(row.examId);
      const fundSourceId = toNullableNumber(row.fundSourceId);
      const key = `${examId}|${fundSourceId ?? 'none'}`;
      const amount = toMoney(row.amount);
      const existing = groups.get(key);
      if (existing) {
        existing.amount = addMoney(existing.amount, amount);
        continue;
      }

      groups.set(key, {
        index: 0,
        examId,
        examName: row.examName ?? '',
        examRound: row.examRound,
        fiscalYear: row.fiscalYear,
        fundSourceId,
        fundSourceCode: row.fundSourceCode ?? '',
        fundSourceName: row.fundSourceName ?? '',
        amount,
      });
    }

    const reportRows = [...groups.values()]
      .sort((left, right) => {
        const byExam = left.examName.localeCompare(right.examName, 'th');
        if (byExam !== 0) return byExam;
        return left.fundSourceCode.localeCompare(right.fundSourceCode, 'th');
      })
      .map((row, index) => ({ ...row, index: index + 1 }));

    return {
      rows: reportRows,
      totalAmount: reportRows.reduce(
        (sum, row) => addMoney(sum, row.amount),
        0,
      ),
      effectiveDates: [...effectiveDates].sort(),
    };
  }

  async getApplicationFees(
    query: ApplicationFeeReportQueryDto,
  ): Promise<ApplicationFeeReport> {
    const rows = await this.loadReceiptRows({
      statuses: ISSUED_AND_VOIDED,
      startDate: query.receiptDate,
      endDate: query.receiptDate,
      paidDate: query.paidDate,
      examName: query.examName,
      fundSourceId: query.fundSourceId,
    });

    return {
      rows: rows.map((row, index) => this.toApplicationFeeRow(row, index + 1)),
    };
  }

  async getReceiptUsage(
    query: ReceiptUsageReportQueryDto,
  ): Promise<ReceiptUsageReport> {
    const rows = await this.loadReceiptRows({
      statuses: statusesForFilter(query.status),
      startDate: query.startDate,
      endDate: query.endDate,
      fiscalYear: query.fiscalYear,
      examName: query.examName,
      fundSourceId: query.fundSourceId,
      payerName: query.payerName,
      collectorName: query.collectorName,
      receiptNo: query.receiptNo,
    });

    const groups = new Map<string, ReceiptUsageReportGroup>();
    const effectiveDates = new Set<string>();

    for (const row of rows) {
      const paidDate = toBangkokDate(row.paidAt);
      if (paidDate) effectiveDates.add(paidDate);

      const fundSourceId = toNullableNumber(row.fundSourceId);
      const key = fundSourceId === null ? 'none' : String(fundSourceId);
      let group = groups.get(key);
      if (!group) {
        group = {
          fundSourceId,
          fundSourceCode: row.fundSourceCode ?? '',
          fundSourceName: row.fundSourceName ?? '',
          totalAmount: 0,
          rows: [],
        };
        groups.set(key, group);
      }

      const mapped = this.toUsageRow(row, group.rows.length + 1);
      group.rows.push(mapped);
      group.totalAmount = addMoney(group.totalAmount, mapped.amount);
    }

    return {
      groups: [...groups.values()],
      effectiveDates: [...effectiveDates].sort(),
    };
  }

  private async loadReceiptRows(
    filters: ReceiptReportFilters,
  ): Promise<ReceiptReportRawRow[]> {
    const qb = this.dataSource
      .getRepository(Receipt)
      .createQueryBuilder('receipt')
      .innerJoin('receipt.TRANSACTION', 'transaction')
      .innerJoin('transaction.ENROLLMENT', 'enrollment')
      .innerJoin('enrollment.USER', 'applicant')
      .leftJoin('applicant.PROFILE', 'applicantProfile')
      .innerJoin('enrollment.SESSION', 'session')
      .innerJoin('session.EXAM', 'exam')
      .leftJoin('exam.FUND_SOURCE', 'fundSource')
      .leftJoin('receipt.VOIDED_RECEIPT', 'voided')
      .leftJoin('voided.USER', 'voidUser')
      .leftJoin('voidUser.PROFILE', 'voidProfile');

    qb.andWhere('receipt.RC_STATUS IN (:...statuses)', {
      statuses: filters.statuses,
    });

    if (filters.startDate) {
      qb.andWhere('receipt.RC_ISSUED_AT >= :startDate', {
        startDate: `${filters.startDate} 00:00:00`,
      });
    }
    if (filters.endDate) {
      qb.andWhere('receipt.RC_ISSUED_AT <= :endDate', {
        endDate: `${filters.endDate} 23:59:59`,
      });
    }
    if (filters.paidDate) {
      qb.andWhere('transaction.TRANX_PAID_AT >= :paidStart', {
        paidStart: `${filters.paidDate} 00:00:00`,
      });
      qb.andWhere('transaction.TRANX_PAID_AT <= :paidEnd', {
        paidEnd: `${filters.paidDate} 23:59:59`,
      });
    }
    if (filters.examName) {
      if (filters.matchExamRound) {
        qb.andWhere(
          `(exam.EXAM_NAME LIKE :examName OR exam.EXAM_ROUND LIKE :examName OR CONCAT(IFNULL(exam.EXAM_ROUND, ''), '/', IFNULL(exam.EXAM_FISCAL_YEAR, '')) LIKE :examName OR CONCAT(exam.EXAM_NAME, ' ', IFNULL(exam.EXAM_ROUND, ''), '/', IFNULL(exam.EXAM_FISCAL_YEAR, '')) LIKE :examName)`,
          { examName: `%${filters.examName}%` },
        );
      } else {
        qb.andWhere('exam.EXAM_NAME LIKE :examName', {
          examName: `%${filters.examName}%`,
        });
      }
    }
    if (filters.fundSourceId) {
      qb.andWhere('fundSource.FS_ID = :fundSourceId', {
        fundSourceId: filters.fundSourceId,
      });
    }
    if (filters.fiscalYear) {
      qb.andWhere('exam.EXAM_FISCAL_YEAR = :fiscalYear', {
        fiscalYear: filters.fiscalYear,
      });
    }
    if (filters.receiptNo) {
      qb.andWhere('receipt.RC_NO LIKE :receiptNo', {
        receiptNo: `%${filters.receiptNo}%`,
      });
    }
    if (filters.payerName) {
      qb.andWhere(
        '(receipt.RC_NAME LIKE :payerName OR applicantProfile.userFullnameTh LIKE :payerName OR applicantProfile.userFullnameEn LIKE :payerName)',
        { payerName: `%${filters.payerName}%` },
      );
    }
    if (filters.collectorName) {
      qb.andWhere('receipt.RC_COLLECTOR_NAME LIKE :collectorName', {
        collectorName: `%${filters.collectorName}%`,
      });
    }

    qb.select('receipt.RC_ID', 'receiptId')
      .addSelect('receipt.RC_NO', 'receiptNo')
      .addSelect('receipt.RC_STATUS', 'receiptStatus')
      .addSelect('receipt.RC_ISSUED_AT', 'issuedAt')
      .addSelect('receipt.RC_COLLECTOR_NAME', 'collectorName')
      .addSelect('receipt.RC_NAME', 'payerName')
      .addSelect('transaction.TRANX_AMOUNT', 'amount')
      .addSelect('transaction.TRANX_PAID_AT', 'paidAt')
      .addSelect('transaction.TRANX_ID', 'tranxId')
      .addSelect('applicantProfile.userTitleTh', 'applicantTitleTh')
      .addSelect('applicantProfile.userFullnameTh', 'applicantNameTh')
      .addSelect('applicantProfile.userTitleEn', 'applicantTitleEn')
      .addSelect('applicantProfile.userFullnameEn', 'applicantNameEn')
      .addSelect('applicant.USER_EMAIL', 'applicantEmail')
      .addSelect('exam.EXAM_ID', 'examId')
      .addSelect('exam.EXAM_NAME', 'examName')
      .addSelect('exam.EXAM_ROUND', 'examRound')
      .addSelect('exam.EXAM_FISCAL_YEAR', 'fiscalYear')
      .addSelect('fundSource.FS_ID', 'fundSourceId')
      .addSelect('fundSource.FS_ACCOUNT_CODE', 'fundSourceCode')
      .addSelect('fundSource.FS_NAME', 'fundSourceName')
      .addSelect('voided.VR_REASON', 'voidReason')
      .addSelect('voided.CREATED_AT', 'voidedAt')
      .addSelect('voidProfile.userTitleTh', 'voidedByTitleTh')
      .addSelect('voidProfile.userFullnameTh', 'voidedByNameTh')
      .addSelect('voidProfile.userTitleEn', 'voidedByTitleEn')
      .addSelect('voidProfile.userFullnameEn', 'voidedByNameEn')
      .addSelect('voidUser.USER_EMAIL', 'voidedByEmail')
      .orderBy('fundSource.FS_ACCOUNT_CODE', 'ASC')
      .addOrderBy('receipt.RC_NO', 'ASC')
      .addOrderBy('receipt.RC_ID', 'ASC');

    return qb.getRawMany<ReceiptReportRawRow>();
  }

  private toApplicationFeeRow(
    row: ReceiptReportRawRow,
    index: number,
  ): ApplicationFeeReportRow {
    const status = toStatus(row.receiptStatus);
    return {
      index,
      receiptId: toNumber(row.receiptId),
      receiptNo: row.receiptNo ?? '',
      tranxId: toNumber(row.tranxId),
      payerName: row.payerName ?? '',
      applicantName: personName(
        row.applicantTitleTh,
        row.applicantNameTh,
        row.applicantTitleEn,
        row.applicantNameEn,
        row.applicantEmail,
      ),
      amount: toMoney(row.amount),
      paidAt: toIso(row.paidAt),
      receiptIssuedAt: toIso(row.issuedAt),
      examName: row.examName ?? '',
      examRound: row.examRound,
      fiscalYear: row.fiscalYear,
      fundSourceId: toNullableNumber(row.fundSourceId),
      fundSourceCode: row.fundSourceCode ?? '',
      fundSourceName: row.fundSourceName ?? '',
      collectorName: row.collectorName ?? '',
      status,
      voidedBy:
        status === 'voided'
          ? personName(
              row.voidedByTitleTh,
              row.voidedByNameTh,
              row.voidedByTitleEn,
              row.voidedByNameEn,
              row.voidedByEmail,
            )
          : null,
      voidedAt: status === 'voided' ? toIso(row.voidedAt) : null,
      voidReason: status === 'voided' ? row.voidReason : null,
    };
  }

  private toUsageRow(
    row: ReceiptReportRawRow,
    index: number,
  ): ReceiptUsageReportRow {
    const feeRow = this.toApplicationFeeRow(row, index);
    return {
      index: feeRow.index,
      receiptId: feeRow.receiptId,
      receiptNo: feeRow.receiptNo,
      paidAt: feeRow.paidAt,
      receiptIssuedAt: feeRow.receiptIssuedAt,
      fiscalYear: feeRow.fiscalYear,
      amount: feeRow.amount,
      examName: feeRow.examName,
      examRound: feeRow.examRound,
      applicantName: feeRow.applicantName,
      payerName: feeRow.payerName,
      collectorName: feeRow.collectorName,
      status: feeRow.status,
      voidedBy: feeRow.voidedBy,
      voidedAt: feeRow.voidedAt,
      voidReason: feeRow.voidReason,
    };
  }
}

function statusesForFilter(
  status?: 'all' | 'issued' | 'voided',
): ReceiptStatus[] {
  if (status === 'issued') return [ReceiptStatus.ISSUED];
  if (status === 'voided') return [ReceiptStatus.VOIDED];
  return ISSUED_AND_VOIDED;
}

function toStatus(value: number | string): ReceiptReportStatus {
  return Number(value) === Number(ReceiptStatus.VOIDED) ? 'voided' : 'issued';
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toMoney(value: number | string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

function addMoney(left: number, right: number): number {
  return Math.round((left + right) * 100) / 100;
}

function personName(
  titleTh: string | null,
  nameTh: string | null,
  titleEn: string | null,
  nameEn: string | null,
  email: string | null,
): string {
  const thai = [titleTh, nameTh].filter(Boolean).join(' ').trim();
  if (thai) return thai;
  const english = [titleEn, nameEn].filter(Boolean).join(' ').trim();
  return english || email || '';
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toBangkokDate(value: Date | string | null | undefined): string | null {
  const iso = toIso(value);
  if (!iso) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
  }).format(new Date(iso));
}
