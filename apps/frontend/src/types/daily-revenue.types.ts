export interface DailyRevenueRow {
  index: number;
  examName: string;
  amount: number;
}

export interface DailyRevenueFilter {
  startDate: string;
  endDate: string;
  examName: string;
  receiptNo?: string;
  payerName?: string;
  payeeName?: string;
}

export interface DailyRevenueSummary {
  rows: DailyRevenueRow[];
  totalAmount: number;
  paidCount?: number;
}
