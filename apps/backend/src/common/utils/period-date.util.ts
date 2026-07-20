const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT_TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2})[T ](00:00:00)/;

/** แปลงวันที่ปิดช่วง (date-only หรือเวลา 00:00:00) ให้เป็น 23:59:59 (+07:00) */
export function normalizePeriodEndDate(
  value?: string | null,
): string | undefined {
  if (value == null || !value.trim()) {
    return undefined;
  }

  const trimmed = value.trim();

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return `${trimmed}T23:59:59+07:00`;
  }

  const midnightMatch = MIDNIGHT_TIMESTAMP_PATTERN.exec(trimmed);
  if (midnightMatch?.[1]) {
    return `${midnightMatch[1]}T23:59:59+07:00`;
  }

  return trimmed;
}
