import { api } from 'src/boot/axios';

export interface BackendTransaction {
  TRANX_ID: number;
  ERM_ID: number;
  TRANX_MATCH_STATUS: number;
  TRANX_PAYMENT_METHOD?: number;
}

export const updateTransactionByErmId = async (
  ermId: number,
  data: Partial<BackendTransaction>,
): Promise<BackendTransaction> => {
  const response = await api.patch<BackendTransaction>(`/transactions/by-erm/${ermId}`, data);
  return response.data;
};
