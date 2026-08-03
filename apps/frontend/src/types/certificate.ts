export interface CertificateData {
  id: number;
  fullName: string;
  englishName: string;
  studentId: string;
  examName: string;
  examDate: string;
  examType: string;
  score: number;
  maxScore: number;
  grade: string;
  certificateNo: string;
  issuedDate: string;
  institution: string;
  faculty: string;
}

export interface CertificateBandRule {
  id: string;
  band: string;
  minScore: number;
  maxScore: number;
  cefr: string;
  descriptor: string;
}

export interface CertificateScoreLine {
  nameTh: string;
  nameEn: string;
  score: number;
  maxScore: number;
  sortOrder: number;
}

export interface CertificateCardData {
  fullName: string;
  testTakerId: string;
  nationalId: string;
  testSession: string;
  testDate: string;
  /** @deprecated ใช้ scoreLines */
  vocabScore: string;
  /** @deprecated ใช้ scoreLines */
  readingScore: string;
  totalScore: string;
  bandLevel: string;
  scoreLines?: CertificateScoreLine[];
  reportIssueDate: string;
  scoreValidUntil: string;
  certificateCode: string;
  bandRules: CertificateBandRule[];
  profileImage: string | null;
  qrDataUrl?: string;
}

export interface CertificateScoreReportData {
  fullName: string;
  testTakerId: string;
  nationalId: string;
  testSession: string;
  testDate: string;
  /** @deprecated ใช้ scoreLines */
  vocabScore: number;
  /** @deprecated ใช้ scoreLines */
  readingScore: number;
  totalScore: number;
  band: number;
  scoreLines?: CertificateScoreLine[];
  reportIssueDate: string;
  scoreValidUntil: string;
  certificateCode: string;
  profileImage?: string;
  bandRules: CertificateBandRule[];
}
