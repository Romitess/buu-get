export type CertificateVerifyStatus = 'valid' | 'expired' | 'revoked';

export interface VerifyCertificateHolderDto {
  fullName: string;
  testTakerId: string;
  nationalIdMasked: string | null;
}

export interface VerifyCertificateExamDto {
  round: string | null;
  date: string | null;
}

export interface VerifyCertificateScoreLineDto {
  nameTh: string;
  nameEn: string;
  score: number;
  maxScore: number;
  sortOrder: number;
}

export interface VerifyCertificateScoresDto {
  /** @deprecated ใช้ lines แทน */
  vocabGrammar: number;
  /** @deprecated ใช้ lines แทน */
  reading: number;
  total: number;
  bandLevel: string | null;
  lines: VerifyCertificateScoreLineDto[];
}

/** Band rules for certificate back (public verify — no admin API needed) */
export interface VerifyCertificateBandRuleDto {
  id: string;
  band: string;
  minScore: number;
  maxScore: number;
  cefr: string;
  descriptor: string;
}

export interface VerifyCertificateResponseDto {
  type: 'certificate';
  status: CertificateVerifyStatus;
  verificationCode: string;
  issuedAt: string | null;
  expiresAt: string | null;
  holder: VerifyCertificateHolderDto;
  exam: VerifyCertificateExamDto;
  scores: VerifyCertificateScoresDto;
  /** Active score-criteria band rules for certificate card back */
  bandRules: VerifyCertificateBandRuleDto[];
}

export type ReceiptVerifyStatus = 'valid' | 'voided';

export interface VerifyReceiptPayeeDto {
  name: string | null;
  taxIdMasked: string | null;
  address: string | null;
}

export interface VerifyReceiptPaymentDto {
  amount: number | null;
  description: string;
  paymentMethod: string | null;
  examRound: string | null;
  examDate: string | null;
}

export interface VerifyReceiptOrganizationDto {
  nameTH: string;
  nameEN: string;
  taxId: string;
}

export interface VerifyReceiptResponseDto {
  type: 'receipt';
  status: ReceiptVerifyStatus;
  verificationCode: string;
  receiptNo: string;
  issuedOrPaidAt: string | null;
  payee: VerifyReceiptPayeeDto;
  payment: VerifyReceiptPaymentDto;
  organization: VerifyReceiptOrganizationDto;
}
