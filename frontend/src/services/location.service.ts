import { api } from 'src/boot/axios';
import type { BackendLocation } from 'src/types/exam';

export type SeatDirectionPayload = 'HORIZONTAL' | 'VERTICAL';

export interface LocationPayload {
  LOCATION_NAME: string;
  LOCATION_ROOM_NO?: string | undefined;
  LOCATION_FLOOR_NO?: number | undefined;
  LOCATION_TOTAL_ROWS?: number | undefined;
  LOCATION_TOTAL_COLS?: number | undefined;
  LOCATION_SEAT_CAPACITY?: number | undefined;
  SEAT_LABEL_FORMAT?: string | undefined;
  SEAT_DIRECTION?: SeatDirectionPayload | undefined;
  AISLE_AFTER_COLS?: number[] | undefined;
  AISLE_AFTER_ROWS?: number[] | undefined;
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
  return Promise.all(
    response.data.map(async (location) => {
      try {
        return await fetchLocationById(location.LOCATION_ID);
      } catch {
        return location;
      }
    }),
  );
};

export const createLocation = async (payload: LocationPayload): Promise<BackendLocation> => {
  const response = await api.post<BackendLocation>('/exam-locations', payload);
  return response.data;
};

export const createLocationWithSeats = async (
  payload: LocationPayload,
  seatStatuses?: Record<string, number>,
): Promise<{ locationId: number; seatCount: number }> => {
  const response = await api.post<{ locationId: number; seatCount: number }>(
    '/exam-locations/with-seats',
    { ...payload, seatStatuses },
  );

  return response.data;
};

export const updateLocation = async (
  id: number | string,
  payload: LocationPayload,
): Promise<BackendLocation> => {
  const response = await api.patch<BackendLocation>(`/exam-locations/${id}`, payload);
  return response.data;
};

export const updateSeatStatus = async (
  seatId: number,
  status: number,
): Promise<BackendLocationSeat> => {
  const response = await api.patch<BackendLocationSeat>(`/exam-location-seats/${seatId}`, {
    LS_SEAT_STATUS: status,
  });
  return response.data;
};

export const deleteLocation = async (id: number | string): Promise<void> => {
  await api.delete(`/exam-locations/${id}`);
};

export const fetchLocationById = async (
  id: number | string,
): Promise<BackendLocation & { SEATS: BackendLocationSeat[] }> => {
  const response = await api.get<BackendLocation & { SEATS: BackendLocationSeat[] }>(
    `/exam-locations/${id}`,
  );
  return response.data;
};

export const deleteLocationSeat = async (id: number | string): Promise<void> => {
  await api.delete(`/exam-location-seats/${id}`);
};
