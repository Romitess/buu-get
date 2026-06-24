import { api } from 'src/boot/axios';
import type { BackendEnrollmentDetail, EnrollmentTableRow } from 'src/types/enrollment.types';

export const fetchAllEnrollments = async (): Promise<BackendEnrollmentDetail[]> => {
  const response = await api.get<BackendEnrollmentDetail[]>('/exam-enrollments');
  return response.data;
};

export const fetchMatchedEnrollments = async (
  refs: string[],
): Promise<BackendEnrollmentDetail[]> => {
  const response = await api.post<BackendEnrollmentDetail[]>('/exam-enrollments/match-import', {
    refs,
  });
  return response.data;
};

export interface PaginatedEnrollmentResponse {
  data: EnrollmentTableRow[];
  total: number;
  totalPaid: number;
}

export const fetchEnrollmentsByExamId = async (
  examId: number,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sessionId?: number | null;
    sessionLocationId?: number | null;
    sortBy?: string | null | undefined;
    descending?: boolean | null | undefined;
  },
): Promise<EnrollmentTableRow[] | PaginatedEnrollmentResponse> => {
  const response = await api.get<
    | BackendEnrollmentDetail[]
    | { data: BackendEnrollmentDetail[]; total: number; totalPaid: number }
  >(`/exam-enrollments/exam/${examId}`, { params });

  if (params?.page && params?.limit) {
    const paginatedData = response.data as {
      data: BackendEnrollmentDetail[];
      total: number;
      totalPaid: number;
    };
    const data = (paginatedData.data || []).map(
      (enrollment: BackendEnrollmentDetail, index: number): EnrollmentTableRow => ({
        index: (params.page! - 1) * params.limit! + index + 1,
        ermId: enrollment.ERM_ID,
        nationalId: enrollment.USER?.USER_NATIONAL_ID || '-',
        titleTh: enrollment.USER?.PROFILE?.userTitleTh || '-',
        fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh || '-',
        paymentStatus: enrollment.ERM_STATUS,
        verifyStatus: enrollment.ERM_VERIFY_STATUS,
        sessionId: enrollment.SESSION_ID,
        sessionLocationId: enrollment.SL_ID ?? null,
        userProfileId: enrollment.USER?.PROFILE?.userProfileId || 0,
        remark: enrollment.ERM_PHYSICAL_STATUS || '',
        slId: enrollment.SL_ID,
        lsId: enrollment.LS_ID,
      }),
    );
    return {
      data,
      total: paginatedData.total || 0,
      totalPaid: paginatedData.totalPaid || 0,
    };
  }

  const listData = response.data as BackendEnrollmentDetail[];
  return (listData || []).map(
    (enrollment: BackendEnrollmentDetail, index: number): EnrollmentTableRow => ({
      index: index + 1,
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.USER?.USER_NATIONAL_ID || '-',
      titleTh: enrollment.USER?.PROFILE?.userTitleTh || '-',
      fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh || '-',
      paymentStatus: enrollment.ERM_STATUS,
      verifyStatus: enrollment.ERM_VERIFY_STATUS,
      sessionId: enrollment.SESSION_ID,
      sessionLocationId: enrollment.SL_ID ?? null,
      userProfileId: enrollment.USER?.PROFILE?.userProfileId || 0,
      remark: enrollment.ERM_PHYSICAL_STATUS || '',
      slId: enrollment.SL_ID,
      lsId: enrollment.LS_ID,
    }),
  );
};

export const fetchRawEnrollmentsByExamId = async (
  examId: number,
): Promise<BackendEnrollmentDetail[]> => {
  const response = await api.get<BackendEnrollmentDetail[]>(`/exam-enrollments/exam/${examId}`);
  return response.data;
};

export const fetchEnrollmentById = async (id: number): Promise<BackendEnrollmentDetail> => {
  const response = await api.get<BackendEnrollmentDetail>(`/exam-enrollments/${id}`);
  return response.data;
};

export const updateEnrollmentStatus = async (
  id: number,
  data: Partial<BackendEnrollmentDetail>,
): Promise<BackendEnrollmentDetail> => {
  const response = await api.patch<BackendEnrollmentDetail>(`/exam-enrollments/${id}`, data);
  return response.data;
};

export interface BulkSeatAssignment {
  ermId: number;
  lsId: number;
  slId: number;
}

export const bulkAssignEnrollmentSeats = async (
  assignments: BulkSeatAssignment[],
  sessionIds: number[],
): Promise<BackendEnrollmentDetail[]> => {
  const response = await api.patch<BackendEnrollmentDetail[]>(
    '/exam-enrollments/bulk-seat-assignments',
    { assignments, sessionIds },
  );
  return response.data;
};

export interface RequestFixPayload {
  fixDeadline: string;
  reasons: string[];
  notes?: string | undefined;
  profileUrl: string;
}

export const requestEnrollmentFix = async (
  id: number,
  payload: RequestFixPayload,
): Promise<{ success: boolean }> => {
  const response = await api.post<{ success: boolean }>(
    `/exam-enrollments/${id}/request-fix`,
    payload,
  );
  return response.data;
};
