export type ThaidCallbackStatus =
  | 'success'
  | 'denied'
  | 'error'
  | 'unknown'
  | 'mismatch';

export function parseThaidCallbackStatus(raw: unknown): ThaidCallbackStatus {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (
    value === 'success' ||
    value === 'denied' ||
    value === 'error' ||
    value === 'mismatch'
  ) {
    return value;
  }
  return 'unknown';
}
