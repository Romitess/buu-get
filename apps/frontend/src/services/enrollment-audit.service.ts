import { api } from 'src/boot/axios';
import type {
  EnrollmentAuditApplicantEnrollment,
  EnrollmentAuditApplicantsParams,
  EnrollmentAuditApplicantsResponse,
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

export const fetchEnrollmentAuditApplicants = async (
  params: EnrollmentAuditApplicantsParams = {},
): Promise<EnrollmentAuditApplicantsResponse> => {
  const response = await api.get<EnrollmentAuditApplicantsResponse>(
    '/enrollment-audit/applicants',
    { params },
  );
  return response.data;
};

export const fetchApplicantEnrollments = async (
  userId: number,
): Promise<EnrollmentAuditApplicantEnrollment[]> => {
  const response = await api.get<EnrollmentAuditApplicantEnrollment[]>(
    `/enrollment-audit/applicants/${userId}/enrollments`,
  );
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
