export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export const unwrapPaginated = <T>(
  body: unknown,
): { data: T[]; total: number; totalPages: number; meta?: PaginationMeta } => {
  if (Array.isArray(body)) {
    return { data: body as T[], total: body.length, totalPages: 1 };
  }
  if (body && typeof body === 'object' && 'data' in body) {
    const rec = body as PaginatedResponse<T>;
    const data = Array.isArray(rec.data) ? rec.data : [];
    const total = rec.meta?.total ?? data.length;
    const totalPages = rec.meta?.totalPages && rec.meta.totalPages > 0 ? rec.meta.totalPages : 1;
    return { data, total, totalPages, meta: rec.meta };
  }
  return { data: [], total: 0, totalPages: 1 };
};
