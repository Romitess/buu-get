import { computed, ref, type ComputedRef, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';
import type { EssentialLinkProps } from 'components/essential-link.vue';

export interface AppLink extends EssentialLinkProps {
  requiresAuth?: boolean;
  roles?: string[];
  hideIfLoggedIn?: boolean;
}

export function useNavigation() {
  const userStore = useUserStore();
  const router = useRouter();

  const allLinks: AppLink[] = [
    {
      title: 'Home',
      icon: 'home',
      link: '/',
    },
    {
      title: 'Exam Schedule',
      caption: 'View upcoming exams',
      icon: 'event',
      link: '/exam-schedule',
    },
    {
      title: 'Exam History',
      caption: 'View your past exams',
      icon: 'history',
      link: '/exam-history',
    },
    {
      title: 'Login',
      icon: 'login',
      link: '/login',
      hideIfLoggedIn: true,
    },
  ];

  const computedLinks: ComputedRef<AppLink[]> = computed(() => {
    return allLinks.filter((link) => {
      // Hide if it's supposed to be hidden when logged in (like Login link)
      if (link.hideIfLoggedIn && userStore.isLoggedIn) {
        return false;
      }

      // If it requires auth but user is not logged in, hide it
      if (link.requiresAuth && !userStore.isLoggedIn) {
        return false;
      }

      // If it requires specific roles, check if the user has one of them
      if (link.roles && link.roles.length > 0) {
        if (!userStore.userRole || !link.roles.includes(userStore.userRole)) {
          return false;
        }
      }

      return true;
    });
  });

  const leftDrawerOpen: Ref<boolean> = ref(false);

  const toggleLeftDrawer = (): void => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
  };

  const logout = (): void => {
    userStore.logout();
    void router.push('/login');
  };

  return {
    userStore,
    computedLinks,
    leftDrawerOpen,
    toggleLeftDrawer,
    logout,
  };
}
