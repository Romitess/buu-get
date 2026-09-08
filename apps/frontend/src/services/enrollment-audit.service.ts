import { api } from 'src/boot/axios';
import type {
  EnrollmentAuditEvent,
  EnrollmentAuditListParams,
  EnrollmentAuditListResponse,
  EnrollmentAuditSummary,
} from 'src/types/enrollment-audit.types';

export const fetchEnrollmentAuditList = async (
  params: EnrollmentAuditListParams = {},
): Promise<EnrollmentAuditListResponse> => {
  const response = await api.get<EnrollmentAuditListResponse>('/enrollment-audit/enrollments', {
    params,
  });
  return response.data;
};

export const fetchEnrollmentAuditSummary = async (
  ermId: number,
): Promise<EnrollmentAuditSummary> => {
  const response = await api.get<EnrollmentAuditSummary>(`/enrollment-audit/enrollments/${ermId}`);
  return response.data;
};

export const fetchEnrollmentAuditEvents = async (
  ermId: number,
  category?: string,
): Promise<EnrollmentAuditEvent[]> => {
  const response = await api.get<EnrollmentAuditEvent[]>(
    `/enrollment-audit/enrollments/${ermId}/events`,
    { params: category ? { category } : undefined },
  );
  return response.data;
};
