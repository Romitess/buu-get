export interface DailyPaymentSummaryRow {
  index: number;
  examName: string;
  amount: number;
}

export interface DailyPaymentSummaryPayload {
  periodDate: string;
  totalAmount: number;
  paidCount: number;
  rows: DailyPaymentSummaryRow[];
}
