import { computed, ref, type ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import type { NavigationItem } from 'src/types/navigation';
import { useQuasar } from 'quasar';

// Global shared state for the admin sidebar drawer
const leftDrawerOpen = ref(true); // Default open on desktop
const miniState = ref(true);      // Default mini (collapsed)
const isHovered = ref(false);     // Expanded on hover

export function useNavigation() {
  const userStore = useUserStore();
  const router = useRouter();
  const $q = useQuasar();

  const allLinks: NavigationItem[] = [
    {
      name: 'home',
      label: 'หน้าหลัก',
      icon: 'home',
      path: '/',
    },
    // === Candidate Menus ===
    {
      name: 'exam-schedule',
      label: 'ตารางสอบ (Candidate)',
      icon: 'event',
      path: '/user/exam-schedule',
      requiredRoles: [ROLES.CANDIDATE],
    },
    {
      name: 'exam-history',
      label: 'ประวัติการสอบ (Candidate)',
      icon: 'history',
      path: '/user/exam-history',
      requiredRoles: [ROLES.CANDIDATE],
    },
    // === Staff Menus ===
    {
      name: 'admin-dashboard',
      label: 'Dashboard (Exam Opening Officer)',
      icon: 'dashboard',
      path: '/admin/dashboard',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
      name: 'admin-create-exam',
      label: 'สร้างรอบสอบ',
      icon: 'add_circle',
      path: '/admin/create-exam',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
      name: 'admin-exam-management',
      label: 'จัดการรอบสอบ',
      icon: 'edit_document',
      path: '/admin/exam-management',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN, ROLES.REGISTRATION_OFFICER],
    },
  ];

  const computedLinks: ComputedRef<NavigationItem[]> = computed(() => {
    return allLinks.filter((link) => {
      // ถ้าไม่มีการกำหนด Role หรือเป็น Public -> ให้ผ่าน
      if (!link.requiredRoles || link.requiredRoles.length === 0) {
        return true;
      }

      // ถ้าต้องใช้ Role แต่ยังไม่ได้ Login -> ซ่อน
      if (!userStore.isLoggedIn) {
        return false;
      }

      // ตรวจสอบสิทธิ์ (Role)
      if (!userStore.userRole) return false;
      return link.requiredRoles.includes(userStore.userRole);
    });
  });

  const toggleLeftDrawer = (): void => {
    if ($q.screen.lt.md) {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    } else {
      miniState.value = !miniState.value;
    }
  };

  const isMini = computed(() => !isHovered.value && miniState.value);

  const showAdminDrawer = computed(() => {
    if (!userStore.isLoggedIn) return false;
    const role = userStore.userRole;
    return [
      ROLES.ADMIN,
      ROLES.STAFF,
      ROLES.REGISTRATION_OFFICER,
      ROLES.EXAM_OPERATIONS_OFFICER,
      ROLES.FINANCE,
      ROLES.EXECUTIVE,
      ROLES.PROCTOR,
    ].includes(role as string);
  });

  const logout = async (): Promise<void> => {
    userStore.logout();
    await router.push({ name: 'login' });
  };

  return {
    userStore,
    computedLinks,
    leftDrawerOpen,
    miniState,
    isHovered,
    isMini,
    showAdminDrawer,
    toggleLeftDrawer,
    logout,
  };
}
