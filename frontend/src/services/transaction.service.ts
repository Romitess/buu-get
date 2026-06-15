import { api } from 'src/boot/axios';

export interface BackendTransaction {
  TRANX_ID: number;
  ERM_ID: number;
  TRANX_MATCH_STATUS: number;
  TRANX_PAYMENT_METHOD?: number;
  TRANX_PAYMENT_STATUS?: number;
  TRANX_QR_CODE?: string | null;
}

export interface CreatePendingPaymentPayload {
  ERM_ID: number;
  TRANX_AMOUNT: number;
  RC_TAX_ID: string;
  RC_NAME: string;
  RC_PHONE: string;
  RC_ADDRESS: string;
}

export interface PendingPaymentResponse {
  transaction: BackendTransaction;
  receipt: {
    RC_ID: number;
    TRANX_ID: number;
    RC_STATUS: number;
    RC_SIGNATURE_ID: string;
  };
}

export const updateTransactionByErmId = async (
  ermId: number,
  data: Partial<BackendTransaction>,
): Promise<BackendTransaction> => {
  const response = await api.patch<BackendTransaction>(`/transactions/by-erm/${ermId}`, data);
  return response.data;
};

export const createPendingPayment = async (
  data: CreatePendingPaymentPayload,
): Promise<PendingPaymentResponse> => {
  const response = await api.post<PendingPaymentResponse>('/transactions/pending-payment', {
    ...data,
    TRANX_AMOUNT: Number(data.TRANX_AMOUNT),
  });
  return response.data;
};
