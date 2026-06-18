import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from 'src/types/user';
import * as userService from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';
import { AUTH_LOADING_DURATION_MS, DEFAULT_LOADING_DURATION_MS } from 'src/constants/timing';

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const isLoadingGlobal = ref<boolean>(false);
  const loadingText = ref<string>('กำลังโหลดข้อมูล...');
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const error = ref<string | null>(null);

  // === Computed ===
  const userRole = computed<UserRole | null>(() => (currentUser.value?.role as UserRole) || null);

  const profileItems = computed(() => {
    if (!currentUser.value) return [];
    const u = currentUser.value;
    return [
      { label: 'เลขประจำตัวประชาชน', value: u.nationalId },
      { label: 'หนังสือเดินทาง', value: u.passportNo || '-' },
      { label: 'อีเมล', value: u.email },
      { label: 'สถานะผู้ใช้งาน', value: u.status },
      { label: 'คำนำหน้า (TH)', value: u.titleTH },
      { label: 'ชื่อ - นามสกุล (TH)', value: u.fullNameTH },
      { label: 'คำนำหน้า (EN)', value: u.titleEN },
      { label: 'ชื่อ - นามสกุล (EN)', value: u.fullNameEN },
      { label: 'วันเกิด', value: u.birthdate },
      { label: 'เบอร์โทรศัพท์', value: u.phone },
      { label: 'ระดับการศึกษาสูงสุด', value: u.educationLevel },
      { label: 'ประเทศ', value: u.country },
      { label: 'ที่อยู่', value: u.address },
      { label: 'เลขประจำตัวผู้เสียภาษี', value: u.taxId },
      { label: 'ซิงค์กับ ThaiD', value: u.thaidSynced ? 'ใช่' : 'ไม่ใช่' },
    ];
  });

  // === Actions ===

  /**
   * ฟังก์ชันโหลดข้อมูลผู้ใช้เริ่มต้น (Check LocalStorage + Token)
   */
  async function initialize(): Promise<void> {
    const token = localStorage.getItem('access_token');
    const status = localStorage.getItem('isLoggedIn');

    if (token && status === 'true') {
      try {
        const profile = await userService.getProfile(token);
        if (profile) {
          currentUser.value = {
            ...profile,
            role: profile.role?.toLowerCase().replace(/\s+/g, '_') || ROLES.CANDIDATE,
          };
          isLoggedIn.value = true;
          accessToken.value = token;
          if (profile.id) {
            localStorage.setItem('user_id', String(profile.id));
          }
        } else {
          logout();
        }
      } catch (err) {
        console.error('Initialize failed:', err);
        logout();
      }
    }
  }

  /**
   * ฟังก์ชัน Login แบบ Async ต่อ Backend จริง
   */
  async function login(email: string, password?: string): Promise<boolean> {
    loadingText.value = 'กำลังเข้าสู่ระบบ...';
    isLoadingGlobal.value = true;
    error.value = null;

    try {
      const result = await userService.authenticateUser(email, password);

      if (result) {
        localStorage.setItem('access_token', result.accessToken);
        localStorage.setItem('isLoggedIn', 'true');
        if (result.user?.id) {
          localStorage.setItem('user_id', String(result.user.id));
        }
        accessToken.value = result.accessToken;

        currentUser.value = {
          email: result.user.email,
          role: result.user.role?.toLowerCase().replace(/\s+/g, '_') || ROLES.CANDIDATE,
          id: result.user.id,
        } as User;

        isLoggedIn.value = true;
        await initialize();
        return true;
      }
      error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      return false;
    } catch (err) {
      console.error('Login Error:', err);
      error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
      return false;
    } finally {
      setTimeout(() => {
        isLoadingGlobal.value = false;
      }, 500);
    }
  }

  /**
   * ฟังก์ชัน Logout
   */
  function logout(): void {
    currentUser.value = null;
    isLoggedIn.value = false;
    accessToken.value = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');

    loadingText.value = 'กำลังออกจากระบบ...';
    isLoadingGlobal.value = true;
    setTimeout(() => {
      isLoadingGlobal.value = false;
    }, AUTH_LOADING_DURATION_MS);
  }

  /**
   * ฟังก์ชันจำลองการโหลด
   */
  function triggerLoading(
    text = 'กำลังโหลดข้อมูล...',
    duration = DEFAULT_LOADING_DURATION_MS,
  ): void {
    loadingText.value = text;
    isLoadingGlobal.value = true;
    setTimeout(() => {
      isLoadingGlobal.value = false;
    }, duration);
  }

  return {
    currentUser,
    isLoggedIn,
    isLoadingGlobal,
    loadingText,
    accessToken,
    error,
    userRole,
    profileItems,
    initialize,
    login,
    logout,
    triggerLoading,
  };
});
