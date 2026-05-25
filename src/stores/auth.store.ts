import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import type { AxiosError } from 'axios';

// ============================================================================
// Types
// ============================================================================

export interface RegisterPayload {
  email: string;
  password: string;
  userType: 'thai' | 'foreigner';
  nationalId?: string | undefined;
  country?: string | undefined;
  titleTH?: string | undefined;
  titleEN?: string | undefined;
  fullName?: string | undefined;
  englishName?: string | undefined;
  phone?: string | undefined;
  birthdate?: string | undefined;
  educationLevel?: string | undefined;
  faculty?: string | undefined;
  institution?: string | undefined;
  address?: string | undefined;
  province?: string | undefined;
  zipCode?: string | undefined;
  profileImagePath?: string | undefined;
  confirmPassword?: string | undefined;
  [key: string]: unknown;
}

export interface AuthResponse {
  success: boolean;
  data?: { message: string; userId: number };
  message?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  user?: { id: number; email: string; role: string };
  message?: string;
}

// ============================================================================
// Store
// ============================================================================

export const useAuthStore = defineStore('auth', () => {
  // === State ===
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));

  // === Actions ===

  /**
   * สมัครสมาชิก — เรียก POST /auth/register
   */
  async function register(payload: RegisterPayload): Promise<AuthResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post('/auth/register', payload);
      return { success: true, data: response.data };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Registration failed';
      error.value = msg;
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * เข้าสู่ระบบ — เรียก POST /auth/login
   */
  async function login(payload: LoginPayload): Promise<LoginResponse> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post('/auth/login', payload);
      const { accessToken: token, user } = response.data;

      // เก็บ Token ไว้ใน State และ LocalStorage
      accessToken.value = token;
      localStorage.setItem('access_token', token);
      localStorage.setItem('isLoggedIn', 'true');
      if (user?.id) {
        localStorage.setItem('user_id', String(user.id));
      }

      return { success: true, accessToken: token, user };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Login failed';
      error.value = msg;
      return { success: false, message: msg };
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * ออกจากระบบ — ล้าง Token และ State
   */
  function logout(): void {
    accessToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user_id');
  }

  /**
   * ล้าง Error
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    isLoading,
    error,
    accessToken,

    // Actions
    register,
    login,
    logout,
    clearError,
  };
});
