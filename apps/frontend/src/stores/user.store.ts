import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from 'src/types/user';
import * as userService from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const error = ref<string | null>(null);

  // === Helpers ===
  /** normalize ชื่อ role ให้เป็น snake_case ตัวพิมพ์เล็ก (ตรงกับ ROLES constant) */
  const normalizeRole = (role: string): UserRole => role.toLowerCase().replace(/\s+/g, '_');

  /** แปลง role/roles จาก backend → roles array ที่ normalize แล้ว (รวม primary เสมอ) */
  const buildRoles = (primary: string | undefined, list: string[] | undefined): UserRole[] => {
    const normalized = [
      ...(primary ? [normalizeRole(primary)] : []),
      ...(list ?? []).map(normalizeRole),
    ];
    const uniqueRoles = [...new Set(normalized)];
    return uniqueRoles.length > 0 ? uniqueRoles : [ROLES.CANDIDATE];
  };

  // === Computed ===
  const userRole = computed<UserRole | null>(() => (currentUser.value?.role as UserRole) || null);

  /** role ทั้งหมดของผู้ใช้ — ใช้สำหรับเช็กสิทธิ์แบบ multi-role */
  const userRoles = computed<UserRole[]>(() => currentUser.value?.roles ?? []);

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

  /** เคลียร์ exam Pinia + in-memory exam API cache (dynamic import กัน circular) */
  async function clearExamCaches(): Promise<void> {
    const [{ useExamStore }, { invalidateExamCache }] = await Promise.all([
      import('src/stores/exam.store'),
      import('src/services/exam.service'),
    ]);
    // HMR โดยไม่มี acceptHMRUpdate อาจเหลือ exam store instance เก่าที่ยังไม่มี action ใหม่
    let examStore = useExamStore();
    if (typeof examStore.resetExamUserState !== 'function') {
      examStore.$dispose();
      examStore = useExamStore();
    }
    examStore.resetExamUserState();
    invalidateExamCache();
  }

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
          const roles = buildRoles(profile.role, profile.roles);
          currentUser.value = {
            ...profile,
            role: roles[0] ?? ROLES.CANDIDATE,
            roles,
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
   * Hydrate จาก login response โดยตรง — ไม่เรียก initialize()/GET /auth/me ซ้ำ
   */
  async function login(email: string, password?: string): Promise<boolean> {
    error.value = null;

    try {
      const result = await userService.authenticateUser(email, password);

      if (result) {
        await clearExamCaches();

        localStorage.setItem('access_token', result.accessToken);
        localStorage.setItem('isLoggedIn', 'true');
        if (result.user?.id) {
          localStorage.setItem('user_id', String(result.user.id));
        }
        accessToken.value = result.accessToken;

        const roles = buildRoles(result.user.role, result.user.roles);
        currentUser.value = {
          email: result.user.email,
          role: roles[0],
          roles,
          id: result.user.id,
          remark: result.user.remark ?? '',
        } as User;

        isLoggedIn.value = true;
        return true;
      }
      error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      return false;
    } catch (err) {
      console.error('Login Error:', err);
      error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
      return false;
    }
  }

  /**
   * โหลด profile เต็มแบบ background หลัง login ขั้นต่ำ
   * no-op ถ้ามี fullNameTH / nationalId แล้ว — ไม่ผูกกับปุ่ม loading
   */
  async function ensureProfileLoaded(): Promise<void> {
    if (!isLoggedIn.value) return;
    const token = accessToken.value || localStorage.getItem('access_token');
    if (!token) return;
    if (currentUser.value?.fullNameTH || currentUser.value?.nationalId) return;

    try {
      const profile = await userService.getProfile(token);
      if (!profile) return;

      const roles = buildRoles(profile.role, profile.roles);
      currentUser.value = {
        ...profile,
        role: roles[0] ?? ROLES.CANDIDATE,
        roles,
      };
      if (profile.id) {
        localStorage.setItem('user_id', String(profile.id));
      }
    } catch (err) {
      console.error('ensureProfileLoaded failed:', err);
    }
  }

  /** อัปเดต currentUser จาก partial (เช่นหลัง PATCH profile) โดยไม่เรียก GET /auth/me */
  function patchCurrentUser(partial: Partial<User>): void {
    if (!currentUser.value) return;
    currentUser.value = { ...currentUser.value, ...partial };
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
    void clearExamCaches();
  }

  return {
    currentUser,
    isLoggedIn,
    accessToken,
    error,
    userRole,
    userRoles,
    profileItems,
    initialize,
    login,
    ensureProfileLoaded,
    patchCurrentUser,
    logout,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
