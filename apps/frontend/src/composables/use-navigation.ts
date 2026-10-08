import { computed, ref, type ComputedRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import type { NavigationItem } from 'src/types/navigation';
import type { UserRole } from 'src/types/user';
import { useQuasar } from 'quasar';

const NAV_I18N_KEYS = {
  home: 'navigation.home',
  'exam-schedule': 'navigation.examSchedule',
  'exam-simulation': 'navigation.examSimulation',
  'exam-history': 'navigation.examHistory',
  'user-profile': 'navigation.personalProfile',
  'admin-dashboard': 'navigation.dashboard',
  'admin-create-exam': 'navigation.createExam',
  'admin-exam-management': 'navigation.manageExams',
  'admin-page-builder': 'navigation.pageBuilder',
  'admin-candidate-accounts': 'navigation.candidateAccounts',
} as const satisfies Record<string, string>;

interface NavigationLinkDef extends Omit<NavigationItem, 'label'> {
  labelKey: string;
  /** บทบาทจริงที่ต้องมี แม้ผู้ใช้จะสลับมุมมองอยู่ */
  requireRealRoles?: UserRole[];
}

// Global shared state for the admin sidebar drawer
const leftDrawerOpen = ref(true); // Default open on desktop
const miniState = ref(true);      // Default mini (collapsed)
const isHovered = ref(false);     // Expanded on hover

export function useNavigation() {
  const userStore = useUserStore();
  const router = useRouter();
  const $q = useQuasar();
  const { t, locale } = useI18n();

  const allLinkDefs: NavigationLinkDef[] = [
    {
      name: 'home',
      labelKey: NAV_I18N_KEYS.home,
      icon: 'home',
      path: '/',
    },
    {
      name: 'exam-schedule',
      labelKey: NAV_I18N_KEYS['exam-schedule'],
      icon: 'list_alt',
      path: '/user/exam-schedule',
      requiredRoles: [ROLES.CANDIDATE],
    },
    {
      name: 'exam-simulation',
      labelKey: NAV_I18N_KEYS['exam-simulation'],
      icon: 'monitor',
      path: '/user/exam-simulation',
      requiredRoles: [ROLES.CANDIDATE],
    },
    {
      name: 'exam-history',
      labelKey: NAV_I18N_KEYS['exam-history'],
      icon: 'history',
      path: '/user/exam-history',
      requiredRoles: [ROLES.CANDIDATE],
    },
    {
      name: 'user-profile',
      labelKey: NAV_I18N_KEYS['user-profile'],
      icon: 'person',
      path: '/user/profile',
      requiredRoles: [ROLES.CANDIDATE],
    },
    {
      name: 'admin-dashboard',
      labelKey: NAV_I18N_KEYS['admin-dashboard'],
      icon: 'dashboard',
      path: '/admin/dashboard',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
      name: 'admin-create-exam',
      labelKey: NAV_I18N_KEYS['admin-create-exam'],
      icon: 'add_circle',
      path: '/admin/create-exam',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
      name: 'admin-exam-management',
      labelKey: NAV_I18N_KEYS['admin-exam-management'],
      icon: 'edit_document',
      path: '/admin/exam-management',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN, ROLES.REGISTRATION_OFFICER],
    },
    {
      name: 'admin-page-builder',
      labelKey: NAV_I18N_KEYS['admin-page-builder'],
      icon: 'web',
      path: '/admin/page-builder',
      requiredRoles: [ROLES.STAFF, ROLES.ADMIN, ROLES.REGISTRATION_OFFICER],
    },
    {
      name: 'admin-candidate-accounts',
      labelKey: NAV_I18N_KEYS['admin-candidate-accounts'],
      icon: 'manage_accounts',
      path: '/admin/candidate-accounts',
      requiredRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
      requireRealRoles: [ROLES.SUPER_ADMIN],
    },
  ];

  const computedLinks: ComputedRef<NavigationItem[]> = computed(() => {
    void locale.value;

    return allLinkDefs
      .filter((link) => {
        if (!link.requireRealRoles || link.requireRealRoles.length === 0) {
          return true;
        }
        if (!userStore.isLoggedIn) return false;
        return link.requireRealRoles.some((role) => userStore.userRoles.includes(role));
      })
      .map((link) => {
        const item: NavigationItem = {
          name: link.name,
          label: t(link.labelKey),
          icon: link.icon,
          path: link.path,
        };

        if (link.badge !== undefined) item.badge = link.badge;
        if (link.hidden !== undefined) item.hidden = link.hidden;
        if (link.children !== undefined) item.children = link.children;
        if (link.requiredRoles !== undefined) item.requiredRoles = link.requiredRoles;

        return item;
      })
      .filter((link) => {
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
      if (leftDrawerOpen.value) {
        leftDrawerOpen.value = false;
        miniState.value = true;
      } else {
        leftDrawerOpen.value = true;
        miniState.value = true;
      }
    }
  };

  const isMini = computed(() => !isHovered.value && miniState.value);

  const STAFF_ROLES = [
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
    ROLES.STAFF,
    ROLES.REGISTRATION_OFFICER,
    ROLES.EXAM_OPERATIONS_OFFICER,
    ROLES.FINANCE,
    ROLES.EXECUTIVE,
    ROLES.PROCTOR,
  ];

  const hasStaffRole = computed(() => {
    if (!userStore.isLoggedIn) return false;
    const roles = userStore.userRoles;
    if (roles.length > 0) {
      return roles.some((r) => STAFF_ROLES.includes(r));
    }
    return STAFF_ROLES.includes(userStore.userRole ?? '');
  });

  const isCandidateUser = computed(() => {
    if (!userStore.isLoggedIn) return false;
    const roles = userStore.userRoles;
    if (roles.length > 0) {
      return roles.includes(ROLES.CANDIDATE);
    }
    return userStore.userRole === ROLES.CANDIDATE;
  });

  /**
   * Left sidebar:
   * - Staff: always (desktop + mobile drawer)
   * - Candidate on desktop (md+): keep pre-mobile-first shell identical
   * - Candidate/guest on mobile: hidden — bottom nav instead
   */
  const showAdminDrawer = computed(() => {
    if (hasStaffRole.value) return true;
    if (isCandidateUser.value && !$q.screen.lt.md) return true;
    return false;
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
