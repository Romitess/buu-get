import { api } from 'src/boot/axios';
import type { BackendLocation } from 'src/types/exam';

export interface LocationPayload {
  LOCATION_NAME: string;
  LOCATION_ROOM_NO?: string | undefined;
  LOCATION_FLOOR_NO?: number | undefined;
  LOCATION_TOTAL_ROWS?: number | undefined;
  LOCATION_TOTAL_COLS?: number | undefined;
  LOCATION_SEAT_CAPACITY?: number | undefined;
  SEAT_LABEL_FORMAT?: string | undefined;
  LOCATION_IS_SPLIT?: number | undefined;
}

export interface BackendLocationSeat {
  LS_ID: number;
  LOCATION_ID: number;
  LS_ROW_NO: number;
  LS_COL_NO: number;
  LS_SEAT_LABEL: string | null;
  LS_SEAT_STATUS: number;
  LS_SORT_ORDER: number | null;
}

export const fetchLocations = async (): Promise<BackendLocation[]> => {
  const response = await api.get<BackendLocation[]>('/exam-locations');
  return response.data;
};

export const createLocation = async (payload: LocationPayload): Promise<BackendLocation> => {
  const response = await api.post<BackendLocation>('/exam-locations', payload);
  return response.data;
};

/**
 * สร้างห้องสอบ + generate ที่นั่งอัตโนมัติ (เรียก 2 API ต่อกัน)
 * 1. POST /exam-locations  → ได้ LOCATION_ID
 * 2. POST /exam-location-seats/generate/:locationId → สร้างที่นั่งตาม rows × cols
 */
export const createLocationWithSeats = async (
  payload: LocationPayload,
): Promise<{ location: BackendLocation; seats: BackendLocationSeat[] }> => {
  // Step 1: สร้างห้องสอบ
  const location = await createLocation(payload);

  // Step 2: Auto-generate ที่นั่งจาก LOCATION_TOTAL_ROWS × LOCATION_TOTAL_COLS
  const seatsResponse = await api.post<BackendLocationSeat[]>(
    `/exam-location-seats/generate/${location.LOCATION_ID}`,
  );

  return { location, seats: seatsResponse.data };
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
