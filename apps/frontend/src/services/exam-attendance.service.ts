import { api } from 'src/boot/axios';
import type { BackendAttendance } from 'src/types/enrollment.types';

export interface CreateExamAttendancePayload {
  ERM_ID: number;
  ATTEND_STATUS: number;
}

export const createExamAttendance = async (
  payload: CreateExamAttendancePayload,
): Promise<BackendAttendance> => {
  const response = await api.post<BackendAttendance>('/exam-attendances', payload);
  return response.data;
};
