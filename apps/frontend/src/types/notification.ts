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

export interface FinanceNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  payload: DailyPaymentSummaryPayload;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
