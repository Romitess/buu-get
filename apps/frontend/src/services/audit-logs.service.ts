import { api } from 'src/boot/axios';
import type {
  AuditLogListItem,
  AuditLogsListParams,
  AuditLogsListResponse,
} from 'src/types/audit-logs.types';

export const fetchAuditLogs = async (
  params: AuditLogsListParams = {},
): Promise<AuditLogsListResponse> => {
  const response = await api.get<AuditLogsListResponse>('/audit-logs', {
    params,
  });
  return response.data;
};

export const fetchAuditLogById = async (id: number): Promise<AuditLogListItem> => {
  const response = await api.get<AuditLogListItem>(`/audit-logs/${id}`);
  return response.data;
};

export const exportAuditLogs = async (
  params: AuditLogsListParams = {},
): Promise<AuditLogListItem[]> => {
  const response = await api.get<{ data: AuditLogListItem[] }>('/audit-logs/export', {
    params,
  });
  return response.data.data;
};
