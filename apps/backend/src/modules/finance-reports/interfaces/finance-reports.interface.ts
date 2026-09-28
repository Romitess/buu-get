export type ReceiptReportStatus = 'issued' | 'voided';

export interface DailyRevenueReportRow {
  index: number;
  examId: number;
  examName: string;
  examRound: string | null;
  fiscalYear: string | null;
  fundSourceId: number | null;
  fundSourceCode: string;
  fundSourceName: string;
  amount: number;
}

export interface DailyRevenueReport {
  rows: DailyRevenueReportRow[];
  totalAmount: number;
  effectiveDates: string[];
}

export interface ApplicationFeeReportRow {
  index: number;
  receiptId: number;
  receiptNo: string;
  tranxId: number;
  payerName: string;
  applicantName: string;
  amount: number;
  paidAt: string | null;
  receiptIssuedAt: string | null;
  examName: string;
  examRound: string | null;
  fiscalYear: string | null;
  fundSourceId: number | null;
  fundSourceCode: string;
  fundSourceName: string;
  collectorName: string;
  status: ReceiptReportStatus;
  voidedBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface ApplicationFeeReport {
  rows: ApplicationFeeReportRow[];
}

export interface ReceiptUsageReportRow {
  index: number;
  receiptId: number;
  receiptNo: string;
  paidAt: string | null;
  receiptIssuedAt: string | null;
  fiscalYear: string | null;
  amount: number;
  examName: string;
  examRound: string | null;
  applicantName: string;
  payerName: string;
  collectorName: string;
  status: ReceiptReportStatus;
  voidedBy: string | null;
  voidedAt: string | null;
  voidReason: string | null;
}

export interface ReceiptUsageReportGroup {
  fundSourceId: number | null;
  fundSourceCode: string;
  fundSourceName: string;
  totalAmount: number;
  rows: ReceiptUsageReportRow[];
}

export interface ReceiptUsageReport {
  groups: ReceiptUsageReportGroup[];
  effectiveDates: string[];
}
