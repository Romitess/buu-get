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

export interface VerifyCertificateScoresDto {
  vocabGrammar: number;
  reading: number;
  total: number;
  bandLevel: number;
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
