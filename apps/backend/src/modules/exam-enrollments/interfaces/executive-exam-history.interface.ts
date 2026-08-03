export interface ExamHistoryRow {
  index: number;
  examRound: string;
  examDate: string;
  /** @deprecated ใช้ scoreLines */
  langUseScore: number | null;
  /** @deprecated ใช้ scoreLines */
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
