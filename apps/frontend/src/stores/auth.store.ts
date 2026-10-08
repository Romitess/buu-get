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
  address?: string | null | undefined;
  passportNo?: string | undefined;
  profileImage?: string | undefined;
  confirmPassword?: string | undefined;
  thaidRegistrationToken?: string | undefined;
}

export interface AuthResponse {
  success: boolean;
  data?: { message: string; userId: number };
  accessToken?: string;
  user?: LoginResponse['user'] & {
    actorType?: 'user' | 'person';
    remark?: string | null;
  };
  message?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken?: string;
  user?: { id: number; email: string; role: string; roles?: string[] };
  message?: string;
}

export interface OtpResponse {
  success: boolean;
  message?: string;
}

// ============================================================================
// Store
// ============================================================================

export const useAuthStore = defineStore('auth', () => {
  // === State ===
  const error = ref<string | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));

  // === Actions ===

  /**
   * สมัครสมาชิก — เรียก POST /auth/register
   */
  async function register(payload: RegisterPayload): Promise<AuthResponse> {
    error.value = null;

    try {
      const response = await api.post<{
        message: string;
        userId: number;
        accessToken?: string;
        user?: AuthResponse['user'];
      }>('/auth/register', payload);
      const { accessToken, user, message, userId } = response.data;
      return {
        success: true,
        data: { message, userId },
        ...(accessToken !== undefined ? { accessToken } : {}),
        ...(user !== undefined ? { user } : {}),
      };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Registration failed';
      error.value = msg;
      return { success: false, message: msg };
    }
  }

  async function sendOtp(email: string): Promise<OtpResponse> {
    error.value = null;

    try {
      await api.post('/auth/send-otp', { email });
      return { success: true };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Failed to send OTP';
      error.value = msg;
      return { success: false, message: msg };
    }
  }

  async function verifyOtp(email: string, otp: string): Promise<OtpResponse> {
    error.value = null;

    try {
      await api.post('/auth/verify-otp', { email, otp });
      return { success: true };
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Invalid OTP';
      error.value = msg;
      return { success: false, message: msg };
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
    localStorage.removeItem('psn_id');
  }

  /**
   * ล้าง Error
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    // State
    error,
    accessToken,

    // Actions
    register,
    sendOtp,
    verifyOtp,
    logout,
    clearError,
  };
});
