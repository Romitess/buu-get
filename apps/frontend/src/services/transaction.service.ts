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

export interface CreateTransactionFlowPayload {
  ermId: number;
  pcId: number;
  amount: number;
}

export type PaymentMode = 'csv' | 'mock' | 'realtime_bank';

export interface CreateTransactionFlowResponse {
  TRANX_ID: number;
  TRANX_QR_CODE: string | null;
  REF1: string | null;
  REF2: string | null;
  TRANX_AMOUNT: number;
  TRANX_EXPIRES_AT: string | null;
  paymentMode: PaymentMode;
}

export interface StartPaymentSessionResponse {
  TRANX_ID: number;
  TRANX_EXPIRES_AT: string;
}

export interface ConfirmPaymentFlowPayload {
  userCode: string;
  receiptTaxId?: string | undefined;
  receiptName?: string | undefined;
  receiptPhone?: string | undefined;
  receiptAddress?: string | undefined;
}

export interface PaymentStatusResponse {
  tranxId: number;
  paymentStatus: number;
  paid: boolean;
  ref1: string | null;
  ref2: string | null;
  amount: number;
  qrCode: string | null;
  expiresAt: string | null;
  paymentMode: PaymentMode;
  message: string | null;
}

export interface MockPayResponse {
  approval: { respCode: string; respMsg: string; tranxId: number | string | null };
  payment: { respCode: string; respMsg: string; tranxId: number | string | null };
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
  // Finance-only admin/seed shortcut on backend — not used by candidate payment flow
  const response = await api.post<PendingPaymentResponse>('/transactions/pending-payment', {
    ...data,
    TRANX_AMOUNT: Number(data.TRANX_AMOUNT),
  });
  return response.data;
};

/** FLOW 1: สร้างธุรกรรม PENDING และ log ประวัติ */
export const createTransaction = async (
  data: CreateTransactionFlowPayload,
): Promise<CreateTransactionFlowResponse> => {
  const response = await api.post<CreateTransactionFlowResponse>('/transactions', {
    ermId: Number(data.ermId),
    pcId: Number(data.pcId),
    amount: Number(data.amount),
  });
  return response.data;
};

/** เริ่ม QR payment session — ตั้ง TRANX_EXPIRES_AT (~30 นาที) */
export const startPaymentSession = async (
  tranxId: number,
): Promise<StartPaymentSessionResponse> => {
  const response = await api.post<StartPaymentSessionResponse>(
    `/transactions/${tranxId}/start-session`,
  );
  return response.data;
};

/** FLOW 2: ยืนยันการชำระเงิน → PAID (เจ้าของ enrollment หรือการเงิน) */
export const confirmPaymentFlow = async (
  tranxId: number,
  data: ConfirmPaymentFlowPayload,
): Promise<void> => {
  await api.patch(`/transactions/${tranxId}/confirm`, data);
};

/** FLOW 3: ทำให้ธุรกรรมหมดอายุและยกเลิกการลงทะเบียน */
export const expireTransaction = async (tranxId: number): Promise<void> => {
  await api.patch(`/transactions/${tranxId}/expire`);
};

/** Poll สถานะหลัง approval/payment (mock / realtime) */
export const getPaymentStatus = async (tranxId: number): Promise<PaymentStatusResponse> => {
  const response = await api.get<PaymentStatusResponse>(
    `/transactions/${tranxId}/payment-status`,
  );
  return response.data;
};

/** จำลองธนาคารยิง approval → payment (PAYMENT_MODE=mock) */
export const mockPayTransaction = async (tranxId: number): Promise<MockPayResponse> => {
  const response = await api.post<MockPayResponse>(`/transactions/${tranxId}/mock-pay`);
  return response.data;
};

/** คืนเงินเมื่อยังไม่มีใบเสร็จ ISSUED */
export const refundTransaction = async (tranxId: number): Promise<BackendTransaction> => {
  const response = await api.post<BackendTransaction>(`/transactions/${tranxId}/refund`);
  return response.data;
};
