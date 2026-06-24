import { api } from 'src/boot/axios';
import type { AxiosRequestConfig } from 'axios';
import type { ProfileEditHistory } from 'src/types/profile-edit-history.types';

export const fetchProfileEditHistory = async (
  userProfileId: number,
  token?: string,
): Promise<ProfileEditHistory[]> => {
  const activeToken = token || localStorage.getItem('access_token');
  const config: AxiosRequestConfig = {};
  if (activeToken) {
    config.headers = { Authorization: `Bearer ${activeToken}` };
  }
  const response = await api.get<ProfileEditHistory[]>(
    `/profile-edit-history/profile/${userProfileId}`,
    config,
  );
  return response.data;
};

/**
 * ดึง "รูปโปรไฟล์ล่าสุดจากประวัติ" ของหลาย profileId ใน request เดียว
 * (แทนการยิงทีละ profileId แบบ N+1 ในหน้า จัดการที่นั่งสอบ)
 */
export const fetchLatestProfileHistoryImages = async (
  profileIds: number[],
  token?: string,
): Promise<Record<number, string | null>> => {
  if (profileIds.length === 0) return {};
  const activeToken = token || localStorage.getItem('access_token');
  const config: AxiosRequestConfig = {};
  if (activeToken) {
    config.headers = { Authorization: `Bearer ${activeToken}` };
  }
  const response = await api.post<Record<number, string | null>>(
    '/profile-edit-history/latest-images',
    { profileIds },
    config,
  );
  return response.data;
};
