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
