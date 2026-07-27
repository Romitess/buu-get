/**
 * Public frontend URL for QR codes on certificates/receipts.
 * Uses VITE_API_URL from .env; falls back to browser origin at runtime.
 */
export function getPublicAppUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:9000';
}

export function buildCertificateVerifyUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/$/, '')}/#/verify/certificate/${encodeURIComponent(code)}`;
}

export function buildReceiptVerifyUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/$/, '')}/#/verify/receipt/${encodeURIComponent(code)}`;
}

export function buildVerifyLandingUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/$/, '')}/#/verify`;
}
