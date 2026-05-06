import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from 'src/components/models';

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const isLoadingGlobal = ref<boolean>(false);
  const loadingText = ref<string>('กำลังเข้าสู่ระบบ...');

  // === Mock Data ===
  const mockUsers = ref<User[]>([
    {
      id: 1,
      nationalId: '1234567890123',
      passportNo: '',
      email: '67160426@go.buu.ac.th',
      password: '1234',
      status: 'ACTIVE',
      profileId: 1,
      titleTH: 'นาย',
      fullNameTH: 'นที บุญญานนท์',
      titleEN: 'Mr.',
      fullNameEN: 'Natee Boonyanon',
      birthdate: '2005-05-23',
      phone: '0984343014',
      educationLevel: 'ปริญญาตรี',
      country: 'TH',
      province: 'ชลบุรี',
      address: '104/13 ถ.มาบมะยมใต้ ต.แสนสุข',
      taxId: '1234567890123',
      thaidSynced: true,
      role: 'user',
    },
    {
      id: 2,
      nationalId: '1111111111111',
      passportNo: '',
      email: 'staff@buu.ac.th',
      password: '1234',
      status: 'ACTIVE',
      profileId: 2,
      titleTH: 'นาย',
      fullNameTH: 'เจ้าหน้าที่ ทดสอบ',
      titleEN: 'Mr.',
      fullNameEN: 'Staff Test',
      birthdate: '1990-01-01',
      phone: '0812345678',
      educationLevel: 'ปริญญาโท',
      country: 'TH',
      province: 'ชลบุรี',
      address: 'อาคารสำนักงานอธิการบดี',
      taxId: '1111111111111',
      thaidSynced: true,
      role: 'staff',
    },
  ]);

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
   * ฟังก์ชันโหลดข้อมูลผู้ใช้เริ่มต้น (Check LocalStorage)
   */
  function initialize(): void {
    const savedId = localStorage.getItem('user_id');
    const status = localStorage.getItem('isLoggedIn');

    if (savedId && status === 'true') {
      const found = mockUsers.value.find(
        (u) => String(u.id) === savedId || u.nationalId === savedId,
      );
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
    const foundUser = mockUsers.value.find(
      (user) => user.nationalId === inputID || String(user.id) === inputID,
    );
    return !!foundUser;
  }

  /**
   * ฟังก์ชัน Login แบบ 2 ขั้นตอน (ตรวจรหัสผ่านด้วย)
   */
  function login(inputID: string, password?: string): boolean {
    const foundUser = mockUsers.value.find(
      (user) => user.nationalId === inputID || String(user.id) === inputID,
    );

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
      const index = mockUsers.value.findIndex(
        (u) =>
          (u.id && u.id === currentUser.value?.id) ||
          u.nationalId === currentUser.value?.nationalId,
      );
      if (index !== -1) {
        mockUsers.value[index] = { ...currentUser.value };
      }
    }
  }

  /**
   * ฟังก์ชัน Logout พร้อม Loading
   */
  function logout(): void {
    loadingText.value = 'กำลังออกจากระบบ...';
    isLoadingGlobal.value = true;

    // หน่วงเวลา 1.5 วินาทีเท่า Login
    setTimeout(() => {
      currentUser.value = null;
      isLoggedIn.value = false;
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user_id');
      isLoadingGlobal.value = false;
    }, 1500);
  }

  /**
   * ฟังก์ชันจำลองการโหลดสำหรับหน้าทั่วไป (ใช้เวลาสั้นลง)
   */
  function triggerLoading(text = 'กำลังโหลดข้อมูล...', duration = 500): void {
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
