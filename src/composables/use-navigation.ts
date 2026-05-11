import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import type { NavigationItem } from 'src/types/navigation';

export function useNavigation() {
  const userStore = useUserStore();
  const router = useRouter();

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

  const leftDrawerOpen: Ref<boolean> = ref(false);

  const toggleLeftDrawer = (): void => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  };

  const logout = async (): Promise<void> => {
    userStore.logout();
    await router.push({ name: 'login' });
  };

  return {
    userStore,
    computedLinks,
    leftDrawerOpen,
    toggleLeftDrawer,
    logout,
  };
}
