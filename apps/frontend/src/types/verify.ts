export type CertificateVerifyStatus = 'valid' | 'expired' | 'revoked';

export interface VerifyCertificateResponse {
  type: 'certificate';
  status: CertificateVerifyStatus;
  verificationCode: string;
  issuedAt: string | null;
  expiresAt: string | null;
  holder: {
    fullName: string;
    testTakerId: string;
    nationalIdMasked: string | null;
  };
  exam: {
    round: string | null;
    date: string | null;
  };
  scores: {
    vocabGrammar: number;
    reading: number;
    total: number;
    bandLevel: string | null;
    lines?: Array<{
      nameTh: string;
      nameEn: string;
      score: number;
      maxScore: number;
      sortOrder: number;
    }>;
  };
  /** Present on public verify — used instead of auth-gated getBandRules() */
  bandRules?: Array<{
    id: string;
    band: string;
    minScore: number;
    maxScore: number;
    cefr: string;
    descriptor: string;
  }>;
}

export type ReceiptVerifyStatus = 'valid' | 'voided';

export interface VerifyReceiptResponse {
  type: 'receipt';
  status: ReceiptVerifyStatus;
  verificationCode: string;
  receiptNo: string;
  issuedOrPaidAt: string | null;
  payee: {
    name: string | null;
    taxIdMasked: string | null;
    address: string | null;
  };
  payment: {
    amount: number | null;
    description: string;
    paymentMethod: string | null;
    examRound: string | null;
    examDate: string | null;
  };
  organization: {
    nameTH: string;
    nameEN: string;
    taxId: string;
  };
}

export type VerifyDocumentType = 'certificate' | 'receipt';

export type VerifyDocumentResponse = VerifyCertificateResponse | VerifyReceiptResponse;
