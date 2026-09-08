import type { ExamAttendStatus } from 'src/types/enrollment.types';

export type CheckInAssistEventType =
  | 'CHECKED_IN'
  | 'ALREADY_CHECKED_IN'
  | 'NOT_FOUND'
  | 'INVALID_CODE'
  | 'WRONG_ROOM';

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
  roomLabel?: string | null;
  floorNo?: number | null;
  sessionTime?: string | null;
  checkedInAt?: string | null;
}

export interface AssistExpectedRoom {
  slId: number;
  locationName: string;
  roomNo?: string | null;
  floorNo?: number | null;
  seatNumber: string;
  sessionStart?: string | null;
  sessionEnd?: string | null;
}

export interface AssistEvent {
  seq: number;
  type: CheckInAssistEventType;
  scannedCode: string;
  scannerUserId: number;
  at: string;
  candidate?: AssistCandidateSummary;
  expectedRoom?: AssistExpectedRoom | null;
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

export interface MyCheckInRoom {
  slId: number;
  examId: number;
  examName: string;
  sessionStart?: string | null;
  sessionEnd?: string | null;
  locationName: string;
  roomNo?: string | null;
  floorNo?: number | null;
  proctorNames: string[];
  totalCount: number;
  attendedCount: number;
  activeStationCasId?: number | null;
}

export interface RoomStation {
  casId: number;
  expiresAt: string;
  slId: number;
  examId: number;
  examName: string;
  sessionStart?: string | null;
  sessionEnd?: string | null;
  locationName: string;
  roomNo?: string | null;
  floorNo?: number | null;
  proctorNames: string[];
  totalCount: number;
  attendedCount: number;
}
