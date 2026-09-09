export const AUDIT_MODULE_NAME = 'buu-get';

export const AUDIT_STATE_MAX_BYTES = 8192;

export const AUDIT_EXPORT_MAX_ROWS = 5000;

export const AUDIT_CORRELATION_HEADER = 'x-correlation-id';

export const AUDIT_METADATA_KEY = 'audit';

/**
 * Normalized (lowercase, no _/-) keys that must never appear in snapshots,
 * even if a caller allowlists them.
 */
export const AUDIT_DENYLIST_NORMALIZED: ReadonlySet<string> = new Set([
  'password',
  'userpassword',
  'otp',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'nationalid',
  'usernationalid',
  'passport',
  'userpassportno',
  'passportno',
  'cardnumber',
  'cvv',
  'qrcode',
  'qrpayload',
  'qrcodedata',
  'paymentpayload',
]);

export function normalizeAuditKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '');
}
