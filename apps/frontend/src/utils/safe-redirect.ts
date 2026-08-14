const ALLOWED_FIRST_SEGMENTS = new Set([
  'admin',
  'user',
  'login',
  'register',
  'verify',
  'v',
]);

/**
 * อนุญาตเฉพาะ path ในแอป: ขึ้นต้นด้วย `/` เดี่ยว ไม่ใช่ protocol / javascript
 * และ first segment ต้องตรงกับ routes.ts
 */
export const resolveSafeInAppRedirect = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('http:') ||
    lower.startsWith('https:') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:')
  ) {
    return null;
  }

  const pathOnly = trimmed.split(/[?#]/, 1)[0] ?? '';
  const firstSegment = pathOnly.replace(/^\//, '').split('/')[0] ?? '';
  if (firstSegment === '') return trimmed;
  if (!ALLOWED_FIRST_SEGMENTS.has(firstSegment)) return null;

  return trimmed;
};
