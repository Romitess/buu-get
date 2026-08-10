import { ENROLLMENT_STATUS } from 'src/constants/exam';

/** สถานะที่ยังถือว่าสมัครค้างอยู่ — ตรงกับ backend conflict check */
const ACTIVE_ENROLLMENT_STATUSES = new Set<number>([
  ENROLLMENT_STATUS.UNPAID,
  ENROLLMENT_STATUS.PAID,
  ENROLLMENT_STATUS.SEAT_ASSIGNED,
  ENROLLMENT_STATUS.SEAT_PUBLISHED,
]);

/**
 * Active enrollment that blocks re-registration / counts as "ลงทะเบียนแล้ว".
 * Coerces string statuses from API (e.g. "5") so CANCELLED is never treated as active.
 */
export function isActiveEnrollmentStatus(
  status: number | string | null | undefined,
): boolean {
  if (status === null || status === undefined || status === '') return false;
  const n = Number(status);
  if (Number.isNaN(n)) return false;
  return ACTIVE_ENROLLMENT_STATUSES.has(n);
}
