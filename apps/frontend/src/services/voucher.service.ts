import { api } from 'src/boot/axios';

export interface SendVoucherEmailPayload {
  email: string;
  fullName: string;
  examName: string;
  historyUrl: string;
}

export interface BulkIssueVouchersPayload {
  ermIds: number[];
  examName: string;
  historyUrl: string;
  sessionIds?: number[];
}

export interface BulkIssueVouchersResult {
  success: boolean;
  updatedEnrollmentCount: number;
  updatedSessionIds: number[];
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
): Promise<{ success: boolean }> => {
  const response = await api.post<{ success: boolean }>('/exam-vouchers/send-ticket', payload);
  return response.data;
};

export const bulkIssueVouchers = async (
  payload: BulkIssueVouchersPayload,
): Promise<BulkIssueVouchersResult> => {
  const response = await api.post<BulkIssueVouchersResult>('/exam-vouchers/bulk-issue', payload);
  return response.data;
};
