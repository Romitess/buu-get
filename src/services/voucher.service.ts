import { api } from 'src/boot/axios';

export interface SendVoucherEmailPayload {
  email: string;
  fullName: string;
  examName: string;
  seatNo: string;
  voucherNo: string;
  imageDataUrl: string;
}

export interface BackendVoucher {
  VC_ID: number;
  ERM_ID: number;
  VC_CODE: string;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export const createVoucherFromEnrollment = async (ermId: number): Promise<BackendVoucher> => {
  const response = await api.post<BackendVoucher>(`/exam-vouchers/enrollment/${ermId}`);
  return response.data;
};

export const sendVoucherEmail = async (
  payload: SendVoucherEmailPayload,
): Promise<{ success: boolean; previewUrl?: string }> => {
  const response = await api.post<{ success: boolean; previewUrl?: string }>(
    '/exam-vouchers/send-ticket',
    payload,
  );
  return response.data;
};
