export interface ExamHistorySchedule {
  time: string;
  location: string;
}

export interface ExamHistoryItem {
  id: number;
  name: string;
  date: string;
  statusLabel: string;
  statusType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  fee: number;
  schedule: ExamHistorySchedule;
  showCancel: boolean;
  showPay: boolean;
  showDownload: boolean;
  deadline?: string;
}
