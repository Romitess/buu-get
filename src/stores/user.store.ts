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
      id: 'u-001',
      nationalId: '1234567890123',
      fullName: 'นที บุญญานนท์',
      titleTH: 'นาย',
      titleEN: 'Mr.',
      englishName: 'Natee Boonyanon',
      email: '67160426@go.buu.ac.th',
      birthdate: '2005-05-23',
      phone: '0984343014',
      educationLevel: 'ปริญญาตรี',
      faculty: 'วิทยาการสารสนเทศ สาขา วิทยาการคอมพิวเตอร์',
      institution: 'มหาวิทยาลัยบูรพา',
      address: '104/13 ถ.มาบมะยมใต้ ต.แสนสุข',
      province: 'ชลบุรี',
      zipCode: '20130',
      country: 'TH', // ✅ เพิ่มใหม่
      role: 'user',
      password: '1234',
    },
    {
      id: 'u-002',
      nationalId: '1111111111111',
      fullName: 'เจ้าหน้าที่ ทดสอบ',
      titleTH: 'นาย',
      titleEN: 'Mr.',
      englishName: 'Staff Test',
      email: 'staff@buu.ac.th',
      birthdate: '1990-01-01',
      phone: '0812345678',
      educationLevel: 'ปริญญาโท',
      faculty: 'กองคลัง',
      institution: 'มหาวิทยาลัยบูรพา',
      address: 'อาคารสำนักงานอธิการบดี',
      province: 'ชลบุรี',
      zipCode: '20131',
      country: 'TH', // ✅ เพิ่มใหม่
      role: 'staff',
      password: '1234',
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
      { label: 'ประเทศ', value: u.country }, // ✅ เพิ่มใหม่
      { label: 'ชื่อ - นามสกุล', value: u.fullName },
      { label: 'ชื่อภาษาอังกฤษ', value: u.englishName },
      { label: 'วันเกิด', value: u.birthdate },
      { label: 'ระดับการศึกษาสูงสุด', value: u.educationLevel },
      { label: 'คณะ/สาขาวิชา', value: u.faculty },
      { label: 'ชื่อสถานศึกษา', value: u.institution },
      { label: 'ที่อยู่สำหรับจัดส่งเอกสาร', value: u.address },
      { label: 'จังหวัด', value: u.province },
      { label: 'รหัสไปรษณีย์', value: u.zipCode },
      { label: 'เบอร์โทรศัพท์', value: u.phone },
      { label: 'อีเมล', value: u.email },
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
      const found = mockUsers.value.find((u) => u.id === savedId || u.nationalId === savedId);
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
      (user) => user.nationalId === inputID || user.id === inputID,
    );
    return !!foundUser;
  }

  /**
   * ฟังก์ชัน Login แบบ 2 ขั้นตอน (ตรวจรหัสผ่านด้วย)
   */
  function login(inputID: string, password?: string): boolean {
    const foundUser = mockUsers.value.find(
      (user) => user.nationalId === inputID || user.id === inputID,
    );

    if (foundUser && foundUser.password === password) {
      currentUser.value = foundUser;
      isLoggedIn.value = true;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user_id', foundUser.id || foundUser.nationalId);
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
