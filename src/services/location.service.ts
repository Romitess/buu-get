import { api } from 'src/boot/axios';
import type { BackendLocation } from 'src/types/exam';

export interface LocationPayload {
  LOCATION_NAME: string;
  LOCATION_ROOM_NO: string;
}

export const fetchLocations = async (): Promise<BackendLocation[]> => {
  const response = await api.get<BackendLocation[]>('/exam-locations');
  return response.data;
};

export const createLocation = async (payload: LocationPayload): Promise<BackendLocation> => {
  const response = await api.post<BackendLocation>('/exam-locations', payload);
  return response.data;
};

export const updateLocation = async (
  id: number | string,
  payload: LocationPayload,
): Promise<BackendLocation> => {
  const response = await api.patch<BackendLocation>(`/exam-locations/${id}`, payload);
  return response.data;
};

export const deleteLocation = async (id: number | string): Promise<void> => {
  await api.delete(`/exam-locations/${id}`);
};
