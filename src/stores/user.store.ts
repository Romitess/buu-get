import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from '../types/user';
import { getUsersFromApi } from '../services/user.service';
import { AUTH_LOADING_DURATION_MS, DEFAULT_LOADING_DURATION_MS } from '../constants/timing';

// (UserRole is now imported from src/types/user.ts)

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const isLoadingGlobal = ref<boolean>(false);
  const loadingText = ref<string>('กำลังเข้าสู่ระบบ...');
  const error = ref<string | null>(null);

  // === Data from Backend ===
  const users = ref<User[]>([]);

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
   * ฟังก์ชันโหลดข้อมูลผู้ใช้จาก Backend
   */
  async function fetchUsers(): Promise<void> {
    isLoadingGlobal.value = true;
    error.value = null;
    try {
      users.value = await getUsersFromApi();
    } catch {
      error.value = 'ไม่สามารถโหลดข้อมูลผู้ใช้งานได้';
      console.error('Store: Failed to fetch users');
    } finally {
      isLoadingGlobal.value = false;
    }
  }

  /**
   * ฟังก์ชันโหลดข้อมูลผู้ใช้เริ่มต้น (Check LocalStorage)
   */
  function initialize(): void {
    const savedId = localStorage.getItem('user_id');
    const status = localStorage.getItem('isLoggedIn');

    if (savedId && status === 'true') {
      // ตรวจสอบเฉพาะใน Real Data
      const found = users.value.find((u) => String(u.id) === savedId || u.nationalId === savedId);

      if (found) {
        currentUser.value = found;
        isLoggedIn.value = true;
      }
    }
  }

  /**
   * ฟังก์ชันตรวจสอบว่ามีผู้ใช้นี้ในระบบหรือไม่
   */
  function checkUserExists(inputID: string): boolean {
    // ตรวจสอบเฉพาะใน Real Data
    const found = users.value.find(
      (user) => user.nationalId === inputID || String(user.id) === inputID,
    );
    return !!found;
  }

  /**
   * ฟังก์ชัน Login แบบ Async
   */
  async function login(inputID: string, password?: string): Promise<boolean> {
    loadingText.value = 'กำลังเข้าสู่ระบบ...';
    isLoadingGlobal.value = true;
    error.value = null;

    try {
      // ขั้นแรก: ลองดึงข้อมูลจาก API มาเก็บไว้ใน users state ก่อน (ถ้ายังไม่มี)
      if (users.value.length === 0) {
        await fetchUsers();
      }

      // ตรวจสอบสิทธิ์จากข้อมูลจริงใน Store (หรืออนาคตเรียก API ตรงๆ)
      const foundUser = users.value.find(
        (u) => (u.nationalId === inputID || String(u.id) === inputID) && u.password === password,
      );

      if (foundUser) {
        currentUser.value = foundUser;
        isLoggedIn.value = true;
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user_id', String(foundUser.id || foundUser.nationalId));
        return true;
      }
      error.value = 'รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง';
      return false;
    } catch {
      error.value = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
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

      // อัปเดตใน Real Users (Local only)
      const realIndex = users.value.findIndex(
        (u) =>
          (u.id && u.id === currentUser.value?.id) ||
          u.nationalId === currentUser.value?.nationalId,
      );
      if (realIndex !== -1) {
        users.value[realIndex] = { ...currentUser.value };
      }
    }
  }

  /**
   * ฟังก์ชัน Logout
   */
  function logout(): void {
    // ล้างข้อมูลทันทีเพื่อให้ Route Guard ทำงานถูกต้อง

    loadingText.value = 'กำลังออกจากระบบ...';
    isLoadingGlobal.value = true;
    setTimeout(() => {
      currentUser.value = null;
      isLoggedIn.value = false;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user_id');
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
    error,
    users,
    // mockUsers,
    userRole,
    profileItems,
    fetchUsers,
    initialize,
    checkUserExists,
    login,
    logout,
    updateProfile,
    triggerLoading,
  };
});
