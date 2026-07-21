import { api } from 'src/boot/axios';

export interface BackendTransactionRefProfile {
  userFullnameTh: string | null;
  userFullnameEn: string | null;
}

export interface BackendTransactionRefUser {
  USER_ID: number;
  PROFILE?: BackendTransactionRefProfile | null;
}

export interface BackendTransactionRefExam {
  EXAM_ID: number;
  EXAM_NAME: string;
  EXAM_ROUND?: string | null;
  EXAM_FEE?: number | string | null;
}

export interface BackendTransactionRefSession {
  SS_ID: number;
  EXAM?: BackendTransactionRefExam | null;
}

export interface BackendTransactionRefEnrollment {
  ERM_ID: number;
  ERM_STATUS?: number;
  USER?: BackendTransactionRefUser | null;
  SESSION?: BackendTransactionRefSession | null;
}

export interface BackendTransactionRefReceipt {
  RC_ID: number;
  RC_STATUS: number;
}

export interface BackendTransactionRefTransaction {
  TRANX_ID: number;
  ERM_ID: number;
  TRANX_AMOUNT?: number | string | null;
  TRANX_PAYMENT_STATUS?: number | null;
  RECEIPTS?: BackendTransactionRefReceipt[] | null;
  ENROLLMENT?: BackendTransactionRefEnrollment | null;
}

export interface BackendTransactionRef {
  TSR_ID: number;
  TRANX_ID: number;
  BR_ID: number | null;
  TSC_REF1: string;
  TSC_REF2: string | null;
  TSC_REF3: string | null;
  TSC_REF4: string | null;
  TSC_BANK_REF: string;
  TSC_PARTNER_REF: string;
  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT?: string | null;
  TRANSACTION?: BackendTransactionRefTransaction | null;
}

export interface TransactionRefSearchParams {
  page: number;
  limit: number;
  ref1?: string;
  ref2?: string;
  name?: string;
  examName?: string;
}

export interface TransactionRefSearchResponse {
  data: BackendTransactionRef[];
  total: number;
}

export const fetchTransactionRefs = async (): Promise<BackendTransactionRef[]> => {
  const response = await api.get<BackendTransactionRef[]>('/transaction-refs');
  return response.data;
};

export const searchTransactionRefs = async (
  params: TransactionRefSearchParams,
): Promise<TransactionRefSearchResponse> => {
  const response = await api.get<TransactionRefSearchResponse>('/transaction-refs/search', {
    params,
  });
  return response.data;
};
