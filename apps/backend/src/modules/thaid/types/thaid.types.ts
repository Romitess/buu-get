/** Payload จากภายนอก (ธนาคาร/DirectLink) — shape ยังไม่ fix ตาม spec */
export type ExternalCallbackBody = Record<string, unknown>;

export type ExternalCallbackQuery = Record<string, unknown>;

export type ThaidEndpoint = 'approval' | 'payment';

export type IdentityCallbackSource = 'sandbox' | 'thaid';

export type IdentityCallbackStatus = 'success' | 'denied' | 'error' | 'unknown';

export interface IdentityCallbackRedirect {
  url: string;
  statusCode: 302;
}

export interface ExternalCallbackPayload {
  body: ExternalCallbackBody;
  query: ExternalCallbackQuery;
}

export interface ExternalCallbackResult {
  ok: true;
  endpoint: ThaidEndpoint;
  receivedAt: string;
  body: ExternalCallbackBody;
  query: ExternalCallbackQuery;
}
