export interface ReceiptData {
  receiptNo: string;
  transactionDate: string;
  fullName: string;
  nationalId: string;
  address?: string;
  examName: string;
  examDate: string;
  location: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}
export interface ReceiptCardProps {
  receipt: ReceiptData;
  showQr?: boolean;
}
