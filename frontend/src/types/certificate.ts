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

export interface CertificateScoreReportData {
  fullName: string;
  testTakerId: string;
  nationalId: string;
  testSession: string;
  testDate: string;
  vocabScore: number;
  readingScore: number;
  totalScore: number;
  band: number;
  reportIssueDate: string;
  scoreValidUntil: string;
  certificateCode: string;
  profileImage?: string;
  bandRules: CertificateBandRule[];
}
