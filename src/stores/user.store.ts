import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from 'src/types/user';
import { mockUsers as initialMockUsers, getUsersFromApi } from 'src/services/user.service';
import { AUTH_LOADING_DURATION_MS, DEFAULT_LOADING_DURATION_MS } from 'src/constants/timing';

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const isLoadingGlobal = ref<boolean>(false);
  const loadingText = ref<string>('กำลังเข้าสู่ระบบ...');

  // === Data from Backend ===
  const users = ref<User[]>([]);

  // === Mock Data ===
  const mockUsers = ref<User[]>([...initialMockUsers]);

  // === Computed ===
  const userRole = computed(() => currentUser.value?.role || null);

  // แปลงข้อมูล currentUser เป็น Array สำหรับแสดงในหน้า Profile
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
    try {
      users.value = await getUsersFromApi();
    } catch (error) {
      console.error('Store: Failed to fetch users:', error);
    }
  }

  /**
   * ฟังก์ชันโหลดข้อมูลผู้ใช้เริ่มต้น (Check LocalStorage)
   */
  function initialize(): void {
    const savedId = localStorage.getItem('user_id');
    const status = localStorage.getItem('isLoggedIn');

    if (savedId && status === 'true') {
      // ตรวจสอบทั้งใน Mock และ Real Data (ถ้ามี)
      const foundInMock = mockUsers.value.find(
        (u) => String(u.id) === savedId || u.nationalId === savedId,
      );
      const foundInReal = users.value.find(
        (u) => String(u.id) === savedId || u.nationalId === savedId,
      );

      const found = foundInMock || foundInReal;
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
    const foundInMock = mockUsers.value.find(
      (user) => user.nationalId === inputID || String(user.id) === inputID,
    );
    const foundInReal = users.value.find(
      (user) => user.nationalId === inputID || String(user.id) === inputID,
    );
    return !!(foundInMock || foundInReal);
  }

  /**
   * ฟังก์ชัน Login แบบ 2 ขั้นตอน (ตรวจรหัสผ่านด้วย)
   */
  function login(inputID: string, password?: string): boolean {
    // ตรวจสอบทั้งใน Mock และ Real Data
    const foundUser =
      mockUsers.value.find((user) => user.nationalId === inputID || String(user.id) === inputID) ||
      users.value.find((user) => user.nationalId === inputID || String(user.id) === inputID);

    if (foundUser && foundUser.password === password) {
      currentUser.value = foundUser;
      isLoggedIn.value = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_id', String(foundUser.id || foundUser.nationalId));
      return true;
    }
    return false;
  }

  /**
   * ฟังก์ชันอัปเดตข้อมูลส่วนตัว
   */
  function updateProfile(newData: Partial<User>): void {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...newData };

      // อัปเดตใน Mock Users
      const mockIndex = mockUsers.value.findIndex(
        (u) =>
          (u.id && u.id === currentUser.value?.id) ||
          u.nationalId === currentUser.value?.nationalId,
      );
      if (mockIndex !== -1) {
        mockUsers.value[mockIndex] = { ...currentUser.value };
      }

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
   * ฟังก์ชัน Logout พร้อม Loading
   */
  function logout(): void {
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
   * ฟังก์ชันจำลองการโหลดสำหรับหน้าทั่วไป (ใช้เวลาสั้นลง)
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
    users,
    mockUsers,
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
