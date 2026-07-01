export interface ExamHistoryRow {
  index: number;
  examRound: string;
  examDate: string;
  langUseScore: number | null;
  readingScore: number | null;
  totalScore: number | null;
  bandLevel: number | null;
  hasCertificate: boolean;
  certificateId: number | null;
  certIssuedAt?: string | null;
  certExpiresAt?: string | null;
  certCode?: string | null;
}

export interface ExecutiveExamHistoryResponse {
  examHistory: ExamHistoryRow[];
}
