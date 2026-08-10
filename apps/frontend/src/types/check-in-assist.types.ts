import type { ExamAttendStatus } from 'src/types/enrollment.types';

export type CheckInAssistEventType =
  | 'CHECKED_IN'
  | 'ALREADY_CHECKED_IN'
  | 'NOT_FOUND'
  | 'INVALID_CODE';

export interface AssistCandidateSummary {
  ermId: number;
  nationalId?: string;
  passportNo?: string | null;
  testTakerCode?: string | null;
  titleTh: string;
  fullnameTh: string;
  titleEn?: string | null;
  fullnameEn?: string | null;
  seatNumber: string;
  profileImage?: string | null;
  voucherNo?: string | null;
  examType?: string | null;
  testSession?: string | null;
  attendanceStatus: ExamAttendStatus;
}

export interface AssistEvent {
  seq: number;
  type: CheckInAssistEventType;
  scannedCode: string;
  scannerUserId: number;
  at: string;
  candidate?: AssistCandidateSummary;
}

export interface CreateAssistSessionResponse {
  casId: number;
  joinToken: string;
  expiresAt: string;
}

export interface AssistSessionMeta {
  casId: number;
  examId: number;
  examName?: string;
  status: 'ACTIVE' | 'CLOSED';
  expiresAt: string;
}

export interface ListAssistEventsResponse {
  events: AssistEvent[];
  latestSeq: number;
}
