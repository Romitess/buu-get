import { api } from 'src/boot/axios';
import type { BackendLocation } from 'src/types/exam';
import { unwrapPaginated, type PaginatedResponse } from 'src/types/pagination';

export type SeatDirectionPayload = 'HORIZONTAL' | 'VERTICAL';
export type LocationAislePositionType = 'row' | 'column';

export interface LocationAislePositionPayload {
  type: LocationAislePositionType;
  index: number;
}

export interface LocationPayload {
  LOCATION_NAME: string;
  LOCATION_ROOM_NO?: string | undefined;
  LOCATION_FLOOR_NO?: number | undefined;
  LOCATION_TOTAL_ROWS?: number | undefined;
  LOCATION_TOTAL_COLS?: number | undefined;
  LOCATION_SEAT_CAPACITY?: number | undefined;
  LOCATION_SEAT_DIRECTION?: SeatDirectionPayload | undefined;
  LOCATION_AISLE_AFTER_COL?: LocationAislePositionPayload[] | undefined;
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

interface BackendLocationRaw extends BackendLocation {
  LOCATION_SEAT_DIRECTION?: SeatDirectionPayload;
  LOCATION_AISLE_AFTER_COL?: Array<LocationAislePositionPayload | number> | null;
}

const splitAislePositions = (
  positions: Array<LocationAislePositionPayload | number> | null | undefined,
): { rows: number[]; cols: number[] } => {
  const rows: number[] = [];
  const cols: number[] = [];

  positions?.forEach((position) => {
    if (typeof position === 'number') {
      cols.push(position);
      return;
    }

    if (position.type === 'row') {
      rows.push(position.index);
      return;
    }

    cols.push(position.index);
  });

  return {
    rows: rows.sort((a, b) => a - b),
    cols: cols.sort((a, b) => a - b),
  };
};

const normalizeLocation = <T extends BackendLocation>(location: T): T => {
  const raw = location as BackendLocationRaw;
  const { rows, cols } = splitAislePositions(raw.LOCATION_AISLE_AFTER_COL);

  return {
    ...location,
    SEAT_DIRECTION: location.SEAT_DIRECTION ?? raw.LOCATION_SEAT_DIRECTION,
    AISLE_AFTER_COLS: location.AISLE_AFTER_COLS ?? cols,
    AISLE_AFTER_ROWS: location.AISLE_AFTER_ROWS ?? rows,
  };
};

const LOCATION_PAGE_LIMIT = 100;
const LOCATION_MAX_PAGES = 20;

export const fetchLocationsPage = async (params: {
  page: number;
  limit: number;
  search?: string;
  signal?: AbortSignal;
}): Promise<{ data: BackendLocation[]; total: number }> => {
  const requestConfig: {
    params: Record<string, number | string | boolean>;
    signal?: AbortSignal;
  } = {
    params: {
      includeSeats: true,
      page: params.page,
      limit: params.limit,
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  };
  if (params.signal) {
    requestConfig.signal = params.signal;
  }
  const response = await api.get<PaginatedResponse<BackendLocation>>('/exam-locations', requestConfig);
  const unwrapped = unwrapPaginated<BackendLocation>(response.data);
  return {
    data: unwrapped.data.map((location) => normalizeLocation(location)),
    total: unwrapped.total,
  };
};

/** occupancy / dropdown — limit=100 แล้วไล่หน้าถ้าจำเป็น ไม่บังคับ limit=10 */
export const fetchLocations = async (signal?: AbortSignal): Promise<BackendLocation[]> => {
  const all: BackendLocation[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const pageParams: { page: number; limit: number; signal?: AbortSignal } = {
      page,
      limit: LOCATION_PAGE_LIMIT,
    };
    if (signal) {
      pageParams.signal = signal;
    }
    const { data, total } = await fetchLocationsPage(pageParams);
    all.push(...data);
    totalPages = Math.min(
      LOCATION_PAGE_LIMIT > 0 ? Math.ceil(total / LOCATION_PAGE_LIMIT) : 1,
      LOCATION_MAX_PAGES,
    );
    page += 1;
  } while (page <= totalPages);

  return all;
};

export const createLocation = async (payload: LocationPayload): Promise<BackendLocation> => {
  const response = await api.post<BackendLocation>('/exam-locations', payload);
  return normalizeLocation(response.data);
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
  return normalizeLocation(response.data);
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

export const fetchLocationSeats = async (
  locationId: number | string,
  requestConfig?: { signal?: AbortSignal },
): Promise<BackendLocationSeat[]> => {
  const response = await api.get<BackendLocationSeat[]>(
    `/exam-location-seats/location/${locationId}`,
    requestConfig,
  );
  return response.data;
};

export const deleteLocation = async (id: number | string): Promise<void> => {
  await api.delete(`/exam-locations/${id}`);
};

export const fetchLocationById = async (
  id: number | string,
  requestConfig?: { signal?: AbortSignal },
): Promise<BackendLocation & { SEATS: BackendLocationSeat[] }> => {
  const response = await api.get<BackendLocation & { SEATS: BackendLocationSeat[] }>(
    `/exam-locations/${id}`,
    requestConfig,
  );
  return normalizeLocation(response.data);
};

export const deleteLocationSeat = async (id: number | string): Promise<void> => {
  await api.delete(`/exam-location-seats/${id}`);
};
