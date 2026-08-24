export type ThaidCallbackStatus = 'success' | 'denied' | 'error' | 'unknown';

export function parseThaidCallbackStatus(raw: unknown): ThaidCallbackStatus {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'success' || value === 'denied' || value === 'error') {
    return value;
  }
  return 'unknown';
}
