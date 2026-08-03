import type { EnrollmentStatus } from 'src/types/enrollment.types';

export interface ExecutiveTestTakerRow {
  enrollmentId: number;
  examId: number;
  testTakerId: string | null;
  title: string | null;
  fullName: string | null;
  examRoundCount: number;
  status: EnrollmentStatus;
}

export interface ExecutiveTestTakerPage {
  data: ExecutiveTestTakerRow[];
  total: number;
}

export interface ExamHistoryRow {
  index: number;
  examRound: string;
  examDate: string;
  langUseScore: number | null;
  readingScore: number | null;
  totalScore: number | null;
  bandLevel: string | null;
  hasCertificate: boolean;
  certificateId: number | null;
  certIssuedAt?: string | null;
  certExpiresAt?: string | null;
  certCode?: string | null;
  scoreLines?: ExecutiveExamScoreLine[];
}

export interface ExecutiveExamScoreLine {
  nameTh: string;
  nameEn: string;
  score: number;
  maxScore: number;
  sortOrder: number;
}

export interface ExecutiveExamHistoryResponse {
  examHistory: ExamHistoryRow[];
}
