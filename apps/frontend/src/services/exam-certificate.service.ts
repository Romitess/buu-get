import { api } from 'src/boot/axios';

export interface BackendExamCertificate {
  CERT_ID: number;
  SCORES_ID: number;
  USER_ID: number;
  CERT_ISSUED_AT?: string | null;
  CERT_EXPIRES_AT?: string | null;
  CERT_CODE: string;
}

export interface CreateExamCertificatePayload {
  SCORES_ID: number;
  USER_ID: number;
  CERT_ISSUED_AT?: string;
  CERT_EXPIRES_AT?: string;
  CERT_CODE?: string;
}

export interface BulkIssueCertificateCandidate {
  SCORES_ID: number;
  USER_ID: number;
}

export interface BulkIssueCertificatesPayload {
  candidates: BulkIssueCertificateCandidate[];
  certIssuedAt: string;
  certExpiresAt: string;
  examName: string;
  historyUrl: string;
}

export interface BulkIssueCertificatesResult {
  success: boolean;
  createdCount: number;
  skippedCount: number;
}

const CERTIFICATE_ENDPOINT = '/exam-certificates';

export const fetchExamCertificates = async (): Promise<BackendExamCertificate[]> => {
  const response = await api.get<BackendExamCertificate[]>(CERTIFICATE_ENDPOINT);
  return response.data;
};

export const createExamCertificate = async (
  payload: CreateExamCertificatePayload,
): Promise<BackendExamCertificate> => {
  const response = await api.post<BackendExamCertificate>(CERTIFICATE_ENDPOINT, payload);
  return response.data;
};

export const bulkIssueCertificates = async (
  payload: BulkIssueCertificatesPayload,
): Promise<BulkIssueCertificatesResult> => {
  const response = await api.post<BulkIssueCertificatesResult>(
    `${CERTIFICATE_ENDPOINT}/bulk-issue`,
    payload,
  );
  return response.data;
};
