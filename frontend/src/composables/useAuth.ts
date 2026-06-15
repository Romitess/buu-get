import { ref } from 'vue';
import { api } from 'boot/axios';
import type { AxiosError } from 'axios';

interface RegisterPayload {
  email: string;
  password: string;
  userType: 'thai' | 'foreigner';
  nationalId?: string;
  country?: string;
  titleTH?: string;
  titleEN?: string;
  fullName?: string;
  englishName?: string;
  phone?: string;
  birthdate?: string;
  education?: string;
  faculty?: string;
}

interface RegisterResponse {
  success: boolean;
  data?: { message: string; userId: number };
  message?: string;
}

export function useAuth() {
  // 1. State
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 2. Methods
  const register = async (credentials: RegisterPayload): Promise<RegisterResponse> => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post('/auth/register', credentials);
      return { success: true, data: response.data };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Registration failed';
      error.value = msg;
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  };

  // 3. Expose
  return { register, isLoading, error };
}
