import { api } from 'src/boot/axios';

export type ThaidStartIntent = 'login' | 'register';

export interface ThaidPrefillFields {
  nationalId: string;
  titleTH: string;
  titleEN: string;
  fullName: string;
  englishName: string;
  birthdate: string;
  address?: string;
}

export interface ThaidLoginSession {
  outcome: 'login';
  notice: 'signed_in' | 'existing_account';
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

export interface ThaidPrefillSession {
  outcome: 'prefill';
  notice: 'no_account' | 'continue_register';
  registrationToken: string;
  prefill: ThaidPrefillFields;
}

export type ThaidSessionResult = ThaidLoginSession | ThaidPrefillSession;

const PREFILL_KEY = 'thaid-prefill';

export function thaidStartUrl(intent: ThaidStartIntent): string {
  const base = (api.defaults.baseURL ?? '').replace(/\/$/, '');
  return `${base}/thaid/${intent}`;
}

export function startThaid(intent: ThaidStartIntent): void {
  window.location.assign(thaidStartUrl(intent));
}

export async function exchangeThaidTicket(ticket: string): Promise<ThaidSessionResult> {
  const response = await api.post<ThaidSessionResult>('/thaid/session', { ticket });
  return response.data;
}

export function storeThaidPrefill(session: ThaidPrefillSession): void {
  sessionStorage.setItem(PREFILL_KEY, JSON.stringify(session));
}

export function takeThaidPrefill(): ThaidPrefillSession | null {
  const raw = sessionStorage.getItem(PREFILL_KEY);
  if (!raw) {
    return null;
  }
  sessionStorage.removeItem(PREFILL_KEY);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPrefillSession(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isPrefillSession(value: unknown): value is ThaidPrefillSession {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.outcome === 'prefill' &&
    typeof record.registrationToken === 'string' &&
    record.prefill !== null &&
    typeof record.prefill === 'object'
  );
}
