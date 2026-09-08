import { api } from 'boot/axios';

export type SystemSettingGroup =
  | 'exam'
  | 'payment'
  | 'certificate'
  | 'org'
  | 'email';

export interface SystemSettingItem {
  key: string;
  group: string;
  type: string;
  value: string;
  defaultValue: string;
  descriptionTh: string;
  updatedBy?: number | null;
  updatedAt?: string | null;
}

export async function fetchSystemSettings(): Promise<SystemSettingItem[]> {
  const response = await api.get<SystemSettingItem[]>('/system-settings');
  return response.data;
}

export async function updateSystemSettings(
  settings: Array<{ key: string; value: string }>,
): Promise<SystemSettingItem[]> {
  const response = await api.patch<SystemSettingItem[]>('/system-settings', {
    settings,
  });
  return response.data;
}

export function getSettingValue(
  settings: SystemSettingItem[],
  key: string,
  fallback: string,
): string {
  return settings.find((item) => item.key === key)?.value ?? fallback;
}

export function getSettingNumber(
  settings: SystemSettingItem[],
  key: string,
  fallback: number,
): number {
  const raw = getSettingValue(settings, key, String(fallback));
  const num = Number(raw);
  return Number.isFinite(num) ? num : fallback;
}
