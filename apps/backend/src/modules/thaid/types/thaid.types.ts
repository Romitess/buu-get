/** Payload จากภายนอก (ธนาคาร/DirectLink) — shape ยังไม่ fix ตาม spec */
export type ExternalCallbackBody = Record<string, unknown>;

export type ExternalCallbackQuery = Record<string, unknown>;

export type ThaidEndpoint = 'approval' | 'payment';

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
