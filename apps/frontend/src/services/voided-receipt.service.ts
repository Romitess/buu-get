import { api } from 'src/boot/axios';

export interface CreateVoidedReceiptPayload {
  RC_ID: number;
  VR_REASON: string;
}

export interface VoidedReceiptResponse {
  VR_ID: number;
  RC_ID: number;
  VR_BY: number;
  VR_REASON: string;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export const voidReceipt = async (
  payload: CreateVoidedReceiptPayload,
): Promise<VoidedReceiptResponse> => {
  const response = await api.post<VoidedReceiptResponse>('/voided-receipts', payload);
  return response.data;
};
