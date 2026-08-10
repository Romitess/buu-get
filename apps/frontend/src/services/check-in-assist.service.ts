import { api } from 'src/boot/axios';
import type {
  AssistEvent,
  AssistSessionMeta,
  CreateAssistSessionResponse,
  ListAssistEventsResponse,
} from 'src/types/check-in-assist.types';

export interface CreateAssistSessionPayload {
  examId: number;
  sessionIds: number[];
}

export const createAssistSession = async (
  payload: CreateAssistSessionPayload,
): Promise<CreateAssistSessionResponse> => {
  const response = await api.post<CreateAssistSessionResponse>(
    '/check-in-assist/sessions',
    payload,
  );
  return response.data;
};

export const getAssistSessionByToken = async (
  joinToken: string,
): Promise<AssistSessionMeta> => {
  const response = await api.get<AssistSessionMeta>(
    `/check-in-assist/sessions/by-token/${encodeURIComponent(joinToken)}`,
  );
  return response.data;
};

export const listAssistEvents = async (
  casId: number,
  afterSeq = 0,
): Promise<ListAssistEventsResponse> => {
  const response = await api.get<ListAssistEventsResponse>(
    `/check-in-assist/sessions/${casId}/events`,
    { params: { afterSeq } },
  );
  return response.data;
};

export const submitAssistScan = async (
  casId: number,
  code: string,
): Promise<AssistEvent> => {
  const response = await api.post<AssistEvent>(
    `/check-in-assist/sessions/${casId}/scans`,
    { code },
  );
  return response.data;
};

export const closeAssistSession = async (casId: number): Promise<{ status: string }> => {
  const response = await api.post<{ status: string }>(
    `/check-in-assist/sessions/${casId}/close`,
  );
  return response.data;
};

export const buildAssistJoinUrl = (joinToken: string): string => {
  const basePath = window.location.pathname || '/';
  return `${window.location.origin}${basePath}#/admin/check-in-assist/${encodeURIComponent(joinToken)}`;
};
