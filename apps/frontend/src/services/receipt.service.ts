import { api } from 'src/boot/axios';
import type { ExamEnrollment } from 'src/types/exam';

export interface IssuedReceiptBankReconcile {
  BR_ID: number;
  CREATED_BY: number;
  CREATED_AT: string;
  USER?: {
    USER_ID: number;
    USER_EMAIL: string;
    PROFILE?: {
      userTitleTh: string | null;
      userFullnameTh: string | null;
      userTitleEn: string | null;
      userFullnameEn: string | null;
    } | null;
  } | null;
}

export interface IssuedReceiptTransaction {
  TRANX_ID: number;
  ERM_ID: number;
  TRANX_AMOUNT: number | string | null;
  TRANX_PAID_AT: string | null;
  TRANX_CREATED_AT: string | null;
  TRANX_CHANNEL: number | null;
  ENROLLMENT?: ExamEnrollment | null;
  BANK_RECONCILES?: IssuedReceiptBankReconcile[];
}

export interface IssuedReceipt {
  RC_ID: number;
  TRANX_ID: number;
  RC_TAX_ID: string | number | null;
  RC_NAME: string | null;
  RC_PHONE: string | null;
  RC_ADDRESS: string | null;
  RC_STATUS: number;
  RC_ISSUED_AT: string | null;
  RC_NO: string | null;
  RC_FILE_PATH?: string | null;
  RC_COLLECTOR_NAME?: string | null;
  RC_ISSUED_BY_PSN_ID?: string | null;
  CREATED_AT: string;
  TRANSACTION?: IssuedReceiptTransaction | null;
}

export const fetchIssuedReceipts = async (): Promise<IssuedReceipt[]> => {
  const response = await api.get<{ data: IssuedReceipt[] }>('/receipts/issued', {
    params: { page: 1, limit: 100 },
  });
  return response.data.data ?? [];
};

export const downloadReceipt = async (
  tranxId: number,
  options?: { unsigned?: boolean },
): Promise<void> => {
  const response = await api.get(`/receipts/${tranxId}/download`, {
    responseType: 'blob',
    params: options?.unsigned ? { unsigned: true } : undefined,
  });

  // Create a URL for the blob and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;

  // Try to extract filename from content-disposition header if present
  const contentDisposition = response.headers['content-disposition'];
  let filename = options?.unsigned
    ? `receipt-${tranxId}-unsigned.pdf`
    : `receipt-${tranxId}.pdf`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch && filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }

  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
