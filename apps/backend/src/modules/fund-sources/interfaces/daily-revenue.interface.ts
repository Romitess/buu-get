export interface DailyRevenueRow {
  index: number;
  examName: string;
  amount: number;
}

export interface DailyRevenueSummary {
  rows: DailyRevenueRow[];
  totalAmount: number;
}
