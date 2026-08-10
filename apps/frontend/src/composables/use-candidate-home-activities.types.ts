export type CandidateActivityKind = 'unpaid' | 'paymentCancelled' | 'upcoming' | 'seatReady';

export interface CandidateHomeActivity {
  id: number;
  kind: CandidateActivityKind;
  title: string;
  date: string;
  time: string;
  location: string;
  fee?: number;
  /** Exam pay-by date (EXAM_PAY_END_DATE) for unpaid cards before QR session */
  payByDate?: string;
  /** QR session expiry — when set, unpaid card shows countdown */
  deadline?: string;
  seatLabel?: string;
  /** Sort key: unpaid first, then payment cancelled, then nearest exam date */
  sortKey: number;
  examDateMs: number;
  ctaRoute: string;
  ctaLabelKey: string;
  badgeLabelKey: string;
  badgeType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  imageKey: CandidateActivityKind;
}
