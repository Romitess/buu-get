/**
 * พอร์ตยืนยันตัวตน ThaID (OIDC authorization code)
 * แยกจาก callback ธนาคารที่ `/approval` และ `/payment`
 */

export type IdentityAuthIntent = 'login' | 'register' | 'update';

export interface IdentityAuthStartOptions {
  /** Optional return path after successful callback (relative app route). */
  returnTo?: string;
  /** เจตนาของปุ่มที่ผู้ใช้กด เก็บคู่กับ state */
  intent?: IdentityAuthIntent;
  /** บัญชีที่จะอัปเดต เมื่อ intent เป็น update */
  userId?: number;
}

export interface IdentityAuthStartResult {
  /** Authorization URL when IdP is configured; null when stubbed. */
  authorizationUrl: string | null;
  state: string | null;
}

export interface IdentityCallbackPayload {
  query: Record<string, unknown>;
  body: Record<string, unknown>;
}

export interface IdentityCallbackResult {
  subject: string | null;
  claims: Record<string, unknown>;
}

export interface IdentityProvider {
  startAuth(
    options?: IdentityAuthStartOptions,
  ): Promise<IdentityAuthStartResult>;
  handleCallback(
    payload: IdentityCallbackPayload,
  ): Promise<IdentityCallbackResult>;
  linkToUser(userId: number, identitySubject: string): Promise<void>;
}
