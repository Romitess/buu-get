export interface EnrollmentAuditListItem {
  ermId: number;
  userId: number;
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  sessionId: number;
  sessionStart: string | null;
  sessionEnd: string | null;
  nationalId: string | null;
  testTakerCode: string | null;
  fullnameTh: string | null;
  fullnameEn: string | null;
  ermStatus: number;
  verifyStatus: number;
  createdAt: string;
}

export interface EnrollmentAuditSummary {
  ermId: number;
  userId: number;
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  examDate: string | null;
  examFee: number | null;
  sessionId: number;
  sessionStart: string | null;
  sessionEnd: string | null;
  nationalId: string | null;
  testTakerCode: string | null;
  fullnameTh: string | null;
  fullnameEn: string | null;
  ermStatus: number;
  verifyStatus: number;
  seatLabel: string | null;
  paidAmount: number | null;
  latestTranxAmount: number | null;
  createdAt: string;
}

export interface EnrollmentAuditActor {
  type: string;
  userId: number | null;
  name: string | null;
}

export interface EnrollmentAuditContext {
  examId: number | null;
  examName: string | null;
  examRound: string | null;
  examFiscalYear: string | null;
  examDate: string | null;
  examFee: number | null;
  sessionId: number | null;
  sessionStart: string | null;
  sessionEnd: string | null;
  seatLabel: string | null;
  testTakerCode: string | null;
}

export interface EnrollmentAuditPayment {
  tranxId: number;
  amount: number | null;
  qrCode: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  channel: number | null;
  receiptNo: string | null;
  receiptStatus: number | null;
}

export interface EnrollmentAuditEvent {
  id: string;
  source: 'audit' | 'transaction' | 'profile' | 'passcode';
  eventType: string;
  category: string;
  occurredAt: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: EnrollmentAuditActor;
  message: string | null;
  payload: Record<string, unknown> | null;
  ref: { type: string; id: number } | null;
  context?: EnrollmentAuditContext;
  payment?: EnrollmentAuditPayment | null;
}

export interface EnrollmentAuditListParams {
  page?: number;
  limit?: number;
  search?: string;
  examId?: number;
  sessionId?: number;
  status?: number;
  category?: string;
}

export interface EnrollmentAuditListResponse {
  data: EnrollmentAuditListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
