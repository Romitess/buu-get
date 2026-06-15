export interface DailyRevenueRow {
  index: number;
  department: string;
  examName: string;
  amount: number;
}

export interface DailyRevenueSummary {
  rows: DailyRevenueRow[];
  totalAmount: number;
}
