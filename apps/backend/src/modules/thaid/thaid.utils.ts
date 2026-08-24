/** แปลง payload จากภายนอกเป็น object ธรรมดา — ไม่ fix shape ตาม spec */
export function toRecord(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

export function readQueryParam(
  query: Record<string, unknown>,
  key: string,
): string | undefined {
  const raw = query[key];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (Array.isArray(raw) && typeof raw[0] === 'string') {
    const trimmed = raw[0].trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return undefined;
}
