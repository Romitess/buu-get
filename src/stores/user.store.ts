import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from 'src/types/user';
import * as userService from 'src/services/user.service';
import { AUTH_LOADING_DURATION_MS, DEFAULT_LOADING_DURATION_MS } from 'src/constants/timing';

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const isLoadingGlobal = ref<boolean>(false);
  const loadingText = ref<string>('กำลังโหลดข้อมูล...');

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
      { label: 'จังหวัด', value: u.province },
      { label: 'ที่อยู่', value: u.address },
      { label: 'เลขประจำตัวผู้เสียภาษี', value: u.taxId },
      { label: 'ซิงค์กับ ThaiD', value: u.thaidSynced ? 'ใช่' : 'ไม่ใช่' },
    ];
  });

  // === Actions ===

  /**
   * ฟังก์ชันโหลดข้อมูลผู้ใช้เริ่มต้น (Check LocalStorage)
   */
  async function initialize(): Promise<void> {
    const savedId = localStorage.getItem('user_id');
    const status = localStorage.getItem('isLoggedIn');

    if (savedId && status === 'true') {
      const found = await userService.findUserByIdentifier(savedId);
      if (found) {
        currentUser.value = found;
        isLoggedIn.value = true;
      }
    }
  }

  /**
   * ฟังก์ชันตรวจสอบว่ามีผู้ใช้นี้ในระบบหรือไม่
   */
  async function checkUserExists(inputID: string): Promise<boolean> {
    const foundUser = await userService.findUserByIdentifier(inputID);
    return !!foundUser;
  }

  /**
   * ฟังก์ชัน Login แบบ Async
   */
  async function login(inputID: string, password?: string): Promise<boolean> {
    loadingText.value = 'กำลังเข้าสู่ระบบ...';
    isLoadingGlobal.value = true;

    try {
      const foundUser = await userService.authenticateUser(inputID, password);

      if (foundUser) {
        currentUser.value = foundUser;
        isLoggedIn.value = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', String(foundUser.id || foundUser.nationalId));
        return true;
      }
      return false;
    } finally {
      // หน่วงเวลาเล็กน้อยให้ UI ดูลื่นไหล
      setTimeout(() => {
        isLoadingGlobal.value = false;
      }, 500);
    }
  }

  /**
   * ฟังก์ชันอัปเดตข้อมูลส่วนตัว
   */
  function updateProfile(newData: Partial<User>): void {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...newData };
    }
  }

  /**
   * ฟังก์ชัน Logout
   */
  function logout(): void {
    // ล้างข้อมูลทันทีเพื่อให้ Route Guard ทำงานถูกต้อง
    currentUser.value = null;
    isLoggedIn.value = false;
    localStorage.removeItem('isLoggedIn');
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
    userRole,
    profileItems,
    initialize,
    checkUserExists,
    login,
    logout,
    updateProfile,
    triggerLoading,
  };
});
