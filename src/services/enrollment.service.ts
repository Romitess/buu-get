import { api } from 'src/boot/axios';
import type { BackendEnrollmentDetail, EnrollmentTableRow } from 'src/types/enrollment.types';

export const fetchEnrollmentsByExamId = async (examId: number): Promise<EnrollmentTableRow[]> => {
  const response = await api.get<BackendEnrollmentDetail[]>(`/exam-enrollments/exam/${examId}`);

  return response.data.map(
    (enrollment: BackendEnrollmentDetail, index: number): EnrollmentTableRow => ({
      index: index + 1,
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.USER?.USER_NATIONAL_ID || '-',
      titleTh: enrollment.USER?.PROFILE?.userTitleTh || '-',
      fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh || '-',
      paymentStatus: enrollment.ERM_STATUS,
      verifyStatus: enrollment.ERM_VERIFY_STATUS,
      sessionId: enrollment.SESSION_ID,
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
