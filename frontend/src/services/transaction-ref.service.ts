import { api } from 'src/boot/axios';

export interface BackendTransactionRefTransaction {
  TRANX_ID: number;
  ERM_ID: number;
  TRANX_AMOUNT?: number | string | null;
  TRANX_PAYMENT_STATUS?: number | null;
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

export const fetchTransactionRefs = async (): Promise<BackendTransactionRef[]> => {
  const response = await api.get<BackendTransactionRef[]>('/transaction-refs');
  return response.data;
};
