import { api } from 'src/boot/axios';
import { BACKEND_API } from 'src/constants/api';
import { unwrapPaginated, type PaginatedResponse } from 'src/types/pagination';
import type { DailyPaymentSummaryPayload, FinanceNotification } from 'src/types/notification';

type BackendNotification = {
  NTF_ID: number;
  NTF_TYPE: string;
  NTF_TITLE: string;
  NTF_BODY: string;
  NTF_PAYLOAD: DailyPaymentSummaryPayload;
  NTF_LINK: string | null;
  NTF_READ_AT: string | null;
  CREATED_AT: string;
};

const mapNotification = (row: BackendNotification): FinanceNotification => ({
  id: row.NTF_ID,
  type: row.NTF_TYPE,
  title: row.NTF_TITLE,
  body: row.NTF_BODY,
  payload: row.NTF_PAYLOAD,
  link: row.NTF_LINK,
  readAt: row.NTF_READ_AT,
  createdAt: row.CREATED_AT,
});

export const fetchNotifications = async (
  page = 1,
  limit = 20,
): Promise<{ data: FinanceNotification[]; total: number }> => {
  const response = await api.get<PaginatedResponse<BackendNotification>>(BACKEND_API.NOTIFICATIONS, {
    params: { page, limit },
  });
  const unwrapped = unwrapPaginated<BackendNotification>(response.data);
  return {
    data: unwrapped.data.map(mapNotification),
    total: unwrapped.total,
  };
};

export const fetchUnreadNotificationCount = async (): Promise<number> => {
  const response = await api.get<{ count: number }>(`${BACKEND_API.NOTIFICATIONS}/unread-count`);
  return response.data.count;
};

export const markNotificationRead = async (id: number): Promise<FinanceNotification> => {
  const response = await api.patch<BackendNotification>(
    `${BACKEND_API.NOTIFICATIONS}/${id}/read`,
  );
  return mapNotification(response.data);
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const response = await api.patch<{ updated: number }>(`${BACKEND_API.NOTIFICATIONS}/read-all`);
  return response.data.updated;
};
