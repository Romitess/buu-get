import { api } from 'src/boot/axios';
import type { BackendEnrollmentDetail, EnrollmentTableRow } from 'src/types/enrollment.types';

export const fetchAllEnrollments = async (): Promise<BackendEnrollmentDetail[]> => {
  const response = await api.get<{ data: BackendEnrollmentDetail[] }>('/exam-enrollments', {
    params: { page: 1, limit: 100 },
  });
  return response.data.data ?? [];
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
): Promise<PaginatedEnrollmentResponse> => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const query: Record<string, string | number | boolean> = { page, limit };

  if (params?.search?.trim()) {
    query.search = params.search.trim();
  }
  if (params?.sessionId != null && params.sessionId > 0) {
    query.sessionId = params.sessionId;
  }
  if (params?.sessionLocationId != null && params.sessionLocationId > 0) {
    query.sessionLocationId = params.sessionLocationId;
  }
  if (params?.sortBy) {
    query.sortBy = params.sortBy;
    if (params.descending != null) {
      query.descending = params.descending;
    }
  }

  const response = await api.get<{
    data: BackendEnrollmentDetail[];
    total: number;
    totalPaid: number;
  }>(`/exam-enrollments/exam/${examId}`, {
    params: query,
  });

  const paginatedData = response.data;
  const data = (paginatedData.data || []).map(
    (enrollment: BackendEnrollmentDetail, index: number): EnrollmentTableRow => ({
      index: (page - 1) * limit + index + 1,
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.USER?.USER_NATIONAL_ID || '-',
      titleTh: enrollment.USER?.PROFILE?.userTitleTh || '-',
      fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh || '-',
      fullnameEn: enrollment.USER?.PROFILE?.userFullnameEn || '-',
      email: enrollment.USER?.USER_EMAIL?.trim() || '-',
      phone: enrollment.USER?.PROFILE?.userPhone?.trim() || '-',
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
};

export type RawEnrollmentFetchParams = {
  sessionId?: number | null;
  sessionLocationId?: number | null;
  signal?: AbortSignal;
};

export type RawEnrollmentPageParams = RawEnrollmentFetchParams & {
  page?: number;
  limit?: number;
  search?: string;
};

export interface RawEnrollmentPageResponse {
  data: BackendEnrollmentDetail[];
  total: number;
}

/** ดึงผู้สมัครหนึ่งหน้า (BackendEnrollmentDetail) — ใช้ตารางคะแนนแบบ server pagination */
export const fetchRawEnrollmentsPage = async (
  examId: number,
  params: RawEnrollmentPageParams = {},
): Promise<RawEnrollmentPageResponse> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const query: Record<string, string | number> = { page, limit };

  if (params.sessionId != null && params.sessionId > 0) {
    query.sessionId = params.sessionId;
  }
  if (params.sessionLocationId != null && params.sessionLocationId > 0) {
    query.sessionLocationId = params.sessionLocationId;
  }
  if (params.search?.trim()) {
    query.search = params.search.trim();
  }

  const requestConfig: {
    params: Record<string, string | number>;
    signal?: AbortSignal;
  } = { params: query };
  if (params.signal) {
    requestConfig.signal = params.signal;
  }

  const response = await api.get<{
    data: BackendEnrollmentDetail[];
    total: number;
    totalPaid: number;
  }>(`/exam-enrollments/exam/${examId}`, requestConfig);

  return {
    data: response.data.data ?? [],
    total: response.data.total ?? 0,
  };
};

/** ดึงผู้สมัครแบบแบ่งหน้า (limit สูงสุด 100/ครั้ง) — ควรส่ง sessionId เพื่อไม่ดึงทั้งรอบสอบ */
export const fetchRawEnrollmentsByExamId = async (
  examId: number,
  scope: RawEnrollmentFetchParams = {},
): Promise<BackendEnrollmentDetail[]> => {
  const pageSize = 100;
  const all: BackendEnrollmentDetail[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (all.length < total) {
    if (scope.signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const pageResult = await fetchRawEnrollmentsPage(examId, {
      ...scope,
      page,
      limit: pageSize,
    });
    total = pageResult.total;
    all.push(...pageResult.data);

    if (pageResult.data.length === 0 || all.length >= total) {
      break;
    }
    page += 1;
  }

  return all;
};

export const fetchEnrollmentById = async (
  id: number,
  requestConfig?: { signal?: AbortSignal },
): Promise<BackendEnrollmentDetail> => {
  const response = await api.get<BackendEnrollmentDetail>(
    `/exam-enrollments/${id}`,
    requestConfig,
  );
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
  slId: number;
  seatLabel: string;
  sortOrder?: number;
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

export interface CheckInEnrollmentPayload {
  ERM_ATTEND_CHECK_IN_TIME?: string;
}

export const checkInEnrollment = async (
  id: number,
  payload: CheckInEnrollmentPayload = {},
): Promise<BackendEnrollmentDetail> => {
  const response = await api.post<BackendEnrollmentDetail>(
    `/exam-enrollments/${id}/check-in`,
    payload,
  );
  return response.data;
};
