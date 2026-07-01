/**
 * PaginatedResponse<T> — รูปแบบ response มาตรฐานสำหรับ endpoint ที่แบ่งหน้า
 * ให้ทุก list endpoint คืน metadata ครบ (page/limit/total/totalPages) เพื่อ client ไม่ต้องคำนวณเอง
 */
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

/**
 * ประกอบ PaginatedResponse จากผลลัพธ์ที่ดึงมา + พารามิเตอร์ที่ใช้จริง
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}
