/** Payload จากภายนอก (ธนาคาร/DirectLink) — shape ยังไม่ fix ตาม spec */
export type ExternalCallbackBody = Record<string, unknown>;

export type ExternalCallbackQuery = Record<string, unknown>;

export type ThaidEndpoint = 'approval' | 'payment';

export type IdentityCallbackSource = 'sandbox' | 'thaid';

export type IdentityCallbackStatus =
  | 'success'
  | 'denied'
  | 'error'
  | 'unknown'
  | 'mismatch';

export interface IdentityCallbackRedirect {
  url: string;
  statusCode: 302;
}

export interface ThaidSessionLoginResponse {
  outcome: 'login';
  notice: 'signed_in' | 'existing_account';
  received?: {
    nationalId: string;
    titleTH: string;
    titleEN: string;
    fullName: string;
    englishName: string;
    birthdate: string;
    address: string;
  };
  login: {
    accessToken: string;
    user: {
      id?: number;
      psnId?: string;
      actorType: 'user' | 'person';
      email: string;
      role: string;
      roles: string[];
      remark?: string | null;
    };
  };
}

export interface ThaidSessionPrefillResponse {
  outcome: 'prefill';
  notice: 'no_account' | 'continue_register';
  registrationToken: string;
  prefill: {
    nationalId: string;
    titleTH: string;
    titleEN: string;
    fullName: string;
    englishName: string;
    birthdate: string;
    address: string;
  };
}

export interface ThaidSessionUpdatedResponse {
  outcome: 'updated';
  received: {
    nationalId: string;
    titleTH: string;
    titleEN: string;
    fullName: string;
    englishName: string;
    birthdate: string;
    address: string;
  };
}

export type ThaidSessionResponse =
  | ThaidSessionLoginResponse
  | ThaidSessionPrefillResponse
  | ThaidSessionUpdatedResponse;

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
