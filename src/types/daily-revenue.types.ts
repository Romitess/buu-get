export interface DailyRevenueRow {
  index: number;
  department: string;
  examName: string;
  amount: number;
}

export interface DailyRevenueFilter {
  startDate: string;
  endDate: string;
  department: string;
  examName: string;
}

export interface DailyRevenueSummary {
  rows: DailyRevenueRow[];
  totalAmount: number;
}

export interface DepartmentOption {
  label: string;
  value: string;
}
