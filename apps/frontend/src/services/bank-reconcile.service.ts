import { api } from 'src/boot/axios';

export interface BackendBankReconcile {
  BR_ID: number;
  TRANX_ID: number | null;
  CREATED_BY: number | null;
  CREATED_BY_PSN_ID?: string | null;
  BR_REF1: string;
  BR_REF2: string | null;
  BR_REF3: string | null;
  BR_REF4: string | null;
  BR_AMOUNT: number | string;
  BR_PAID_BY: string;
  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT: string | null;
  USER?: {
    USER_ID: number;
    USER_CODE: string | null;
    USER_EMAIL: string;
    PROFILE?: {
      userFullnameTh: string | null;
      userFullnameEn: string | null;
    } | null;
  } | null;
  CREATED_BY_PERSON?: {
    PSN_ID: string;
    PRF_NAMETH?: string | null;
    PSN_FNAMETH?: string | null;
    PSN_FNAMEEN?: string | null;
    PSN_LNAMETH?: string | null;
    PSN_LNAMEEN?: string | null;
  } | null;
}

export interface BankReconcileImportResponse {
  total: number;
  imported: number;
  skipped: number;
  invalidSkipped: number;
  duplicateSkipped: number;
  data: BackendBankReconcile[];
}

export interface BankReconcileMatchResult {
  TSR_ID: number;
  TRANX_ID: number;
  BR_ID: number | null;
  TSC_REF1: string;
  TSC_REF2: string | null;
  TSC_REF3: string | null;
  TSC_REF4: string | null;
  TSC_BANK_REF: string;
  TSC_PARTNER_REF: string;
  APPLICANT_NAME: string | null;
  TRANX_AMOUNT: number | string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
}

export interface UpdateBankReconcileRefsPayload {
  BR_REF1: string;
  BR_REF2?: string | null;
}

export const importBankReconcileFile = async (file: File): Promise<BankReconcileImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  console.log('[DEBUG] Uploading file:', file.name, file.size, file.type);
  console.log('[DEBUG] FormData:', formData);

  try {
    console.log('[DEBUG] Sending POST request to /bank-reconciles/import');
    const response = await api.post<BankReconcileImportResponse>(
      '/bank-reconciles/import',
      formData,
    );
    console.log('[DEBUG] Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[ERROR] Upload failed:', error);
    throw error;
  }
};

export const fetchBankReconciles = async (): Promise<BackendBankReconcile[]> => {
  const response = await api.get<BackendBankReconcile[]>('/bank-reconciles');
  return response.data;
};

export const verifyBankReconciles = async (brIds?: number[]): Promise<BackendBankReconcile[]> => {
  const response = await api.post<BackendBankReconcile[]>(
    '/bank-reconciles/verify',
    brIds && brIds.length > 0 ? { brIds } : undefined,
  );
  return response.data;
};

export const updateBankReconcileRefs = async (
  brId: number,
  data: UpdateBankReconcileRefsPayload,
): Promise<BackendBankReconcile> => {
  const response = await api.patch<BackendBankReconcile>(`/bank-reconciles/${brId}/refs`, data);
  return response.data;
};

export const clearBankReconciles = async (): Promise<void> => {
  await api.delete('/bank-reconciles');
};

export const matchBankReconciles = async (
  refs: Array<{ ref1: string; ref2: string }>,
): Promise<BankReconcileMatchResult[]> => {
  const response = await api.post<BankReconcileMatchResult[]>('/bank-reconciles/match', { refs });
  return response.data;
};

export const confirmBankReconcilePayments = async (
  tranxIds: number[],
): Promise<{ success: boolean; updated: number }> => {
  const response = await api.post<{ success: boolean; updated: number }>(
    '/bank-reconciles/confirm-payment',
    { tranxIds },
  );
  return response.data;
};

export const checkBankReconcileEsignReady = async (): Promise<{
  ready: true;
  fullName: string;
  psnId: string;
}> => {
  const response = await api.get<{
    ready: true;
    fullName: string;
    psnId: string;
  }>('/bank-reconciles/esign-ready');
  return response.data;
};

export interface TestExportExamOption {
  EXAM_ID: number;
  EXAM_NAME: string;
  EXAM_ROUND: string | null;
  EXAM_FISCAL_YEAR: string | null;
  EXAM_DATE: string | null;
  EXAM_FEE: number;
  exportableCount: number;
}

export interface TestExportRow {
  applicantId: string;
  referenceNo: string | null;
  payerName: string;
  amount: string;
  paymentDate: string;
  paymentTime: string;
}

export const fetchTestExportExams = async (): Promise<TestExportExamOption[]> => {
  const response = await api.get<TestExportExamOption[]>('/bank-reconciles/test-export/exams');
  return response.data;
};

export const fetchTestExportRows = async (examId: number): Promise<TestExportRow[]> => {
  const response = await api.get<TestExportRow[]>('/bank-reconciles/test-export', {
    params: { examId },
  });
  return response.data;
};
