import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from 'src/types/user';
import * as userService from 'src/services/user.service';
import { ROLES, ADMIN_SWITCHABLE_ROLES, SUPER_ADMIN_SWITCHABLE_ROLES } from 'src/constants/roles';

export const useUserStore = defineStore('user', () => {
  // === State ===
  const currentUser = ref<User | null>(null);
  const isLoggedIn = ref<boolean>(false);
  const accessToken = ref<string | null>(localStorage.getItem('access_token'));
  const error = ref<string | null>(null);

  // === Helpers ===
  /** normalize ชื่อ role ให้เป็น snake_case ตัวพิมพ์เล็ก (ตรงกับ ROLES constant) */
  const normalizeRole = (role: string): UserRole => role.toLowerCase().replace(/\s+/g, '_');

  const readActiveRoleFromStorage = (): UserRole | null => {
    const stored = localStorage.getItem('active_role');
    if (!stored) return null;
    return normalizeRole(stored);
  };

  const activeRole = ref<UserRole | null>(readActiveRoleFromStorage());

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
  /** role ทั้งหมดของผู้ใช้ — ใช้สำหรับเช็กสิทธิ์แบบ multi-role */
  const userRoles = computed<UserRole[]>(() => currentUser.value?.roles ?? []);

  const canSwitchRole = computed(() =>
    userRoles.value.some((r) => r === ROLES.ADMIN || r === ROLES.SUPER_ADMIN),
  );

  const switchableRoles = computed<UserRole[]>(() => {
    if (!canSwitchRole.value) return [];
    if (userRoles.value.includes(ROLES.SUPER_ADMIN)) {
      return SUPER_ADMIN_SWITCHABLE_ROLES;
    }
    return ADMIN_SWITCHABLE_ROLES;
  });

  const userRole = computed<UserRole | null>(() => {
    if (canSwitchRole.value && activeRole.value) {
      return activeRole.value;
    }
    return currentUser.value?.role ?? null;
  });

  /** roles สำหรับเช็กสิทธิ์ UI — รวม activeRole เมื่อ admin/super_admin สลับมุมมอง */
  const effectiveRoles = computed<UserRole[]>(() => {
    if (canSwitchRole.value && activeRole.value) {
      return [...new Set([...userRoles.value, activeRole.value])];
    }
    return userRoles.value;
  });

  const hasEffectiveRole = (role: UserRole): boolean => effectiveRoles.value.includes(role);

  /** บุคลากร loginBuu (MSG_T_PERSON) — ไม่มี USER_PROFILE และห้ามแก้ข้อมูลส่วนตัว */
  const isPersonnelActor = computed(
    () =>
      currentUser.value?.actorType === 'person' ||
      (!!currentUser.value?.psnId && currentUser.value?.actorType !== 'user'),
  );

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

  function applyDefaultActiveRole(): void {
    if (!canSwitchRole.value) {
      activeRole.value = null;
      localStorage.removeItem('active_role');
      return;
    }

    const stored = activeRole.value;
    if (stored && switchableRoles.value.includes(stored)) {
      return;
    }

    // ค่าเริ่มต้น: มุมมอง admin (หรือตัวแรกในรายการที่สลับได้)
    if (switchableRoles.value.includes(ROLES.ADMIN)) {
      setActiveRole(ROLES.ADMIN);
      return;
    }
    const fallback = switchableRoles.value[0];
    if (fallback) {
      setActiveRole(fallback);
    }
  }

  function setActiveRole(role: UserRole): void {
    if (!switchableRoles.value.includes(role)) {
      return;
    }
    activeRole.value = role;
    localStorage.setItem('active_role', role);
  }

  async function switchActiveRole(role: UserRole): Promise<void> {
    setActiveRole(role);
    await clearExamCaches();
  }

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

  async function clearNotificationState(): Promise<void> {
    const { useNotificationStore } = await import('src/stores/notification.store');
    useNotificationStore().stop();
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
          if (profile.psnId) {
            localStorage.setItem('psn_id', profile.psnId);
            localStorage.removeItem('user_id');
          } else if (profile.id) {
            localStorage.setItem('user_id', String(profile.id));
          }
          applyDefaultActiveRole();
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
        await hydrateFromLogin(result);
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

  /** Login ด้วยบัญชีมหาวิทยาลัย (บุคลากร / MSG_T_PERSON) */
  async function loginBuu(username: string, password: string): Promise<boolean> {
    error.value = null;

    try {
      const result = await userService.authenticateBuuUser(username, password);

      if (result) {
        await hydrateFromLogin(result);
        return true;
      }
      error.value = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      return false;
    } catch (err) {
      console.error('BUU Login Error:', err);
      error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
      return false;
    }
  }

  async function hydrateFromLogin(result: userService.LoginResponse): Promise<void> {
    await clearExamCaches();

    localStorage.setItem('access_token', result.accessToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.removeItem('user_id');
    localStorage.removeItem('psn_id');

    if (result.user.actorType === 'person' && result.user.psnId) {
      localStorage.setItem('psn_id', result.user.psnId);
    } else if (result.user.id != null) {
      localStorage.setItem('user_id', String(result.user.id));
    }

    accessToken.value = result.accessToken;

    const roles = buildRoles(result.user.role, result.user.roles);
    currentUser.value = {
      email: result.user.email,
      role: roles[0],
      roles,
      id: result.user.id,
      psnId: result.user.psnId,
      actorType: result.user.actorType,
      remark: result.user.remark ?? '',
    } as User;

    isLoggedIn.value = true;
    applyDefaultActiveRole();
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
      const nextActorType = profile.actorType ?? currentUser.value?.actorType;
      const nextPsnId = profile.psnId ?? currentUser.value?.psnId;
      currentUser.value = {
        ...profile,
        role: roles[0] ?? ROLES.CANDIDATE,
        roles,
        ...(nextActorType !== undefined ? { actorType: nextActorType } : {}),
        ...(nextPsnId !== undefined ? { psnId: nextPsnId } : {}),
      };
      if (profile.psnId) {
        localStorage.setItem('psn_id', profile.psnId);
        localStorage.removeItem('user_id');
      } else if (profile.id) {
        localStorage.setItem('user_id', String(profile.id));
      }
      applyDefaultActiveRole();
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
    activeRole.value = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('psn_id');
    localStorage.removeItem('active_role');
    void clearExamCaches();
    void clearNotificationState();
  }

  return {
    currentUser,
    isLoggedIn,
    accessToken,
    error,
    userRole,
    userRoles,
    effectiveRoles,
    hasEffectiveRole,
    isPersonnelActor,
    activeRole,
    canSwitchRole,
    switchableRoles,
    profileItems,
    initialize,
    login,
    loginBuu,
    ensureProfileLoaded,
    patchCurrentUser,
    setActiveRole,
    switchActiveRole,
    logout,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}
