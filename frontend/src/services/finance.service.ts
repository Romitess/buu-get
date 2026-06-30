import { api } from 'src/boot/axios';
import type { FundSource } from 'src/types/finance.type';

export interface CreateFundSourcePayload {
  FS_FACULTY: string;
  FS_ACCOUNT_CODE: string;
  FS_NAME: string;
  FS_OPEN_STATUS?: boolean;
}

export const fetchFundSources = async (): Promise<FundSource[]> => {
  const response = await api.get<FundSource[]>('/fund-sources');
  return response.data;
};

export const createFundSource = async (payload: CreateFundSourcePayload): Promise<FundSource> => {
  const response = await api.post<FundSource>('/fund-sources', payload);
  return response.data;
};

export const updateFundSource = async (
  id: number | string,
  payload: CreateFundSourcePayload,
): Promise<FundSource> => {
  const response = await api.patch<FundSource>(`/fund-sources/${id}`, payload);
  return response.data;
};

export const deleteFundSource = async (id: number | string): Promise<void> => {
  await api.delete(`/fund-sources/${id}`);
};
