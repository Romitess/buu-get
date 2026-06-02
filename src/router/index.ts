import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';

export default defineRouter(({ store }) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    const userStore = useUserStore(store);
    if (localStorage.getItem('isLoggedIn') === 'true' && !userStore.isLoggedIn) {
      await userStore.initialize();
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const matchedRecord = to.matched.find((record) => record.meta.roles);
    const allowedRoles = matchedRecord
      ? (matchedRecord.meta as { roles?: string[] }).roles
      : undefined;
    if (requiresAuth && !userStore.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }
    if (userStore.isLoggedIn && allowedRoles) {
      const hasPermission = allowedRoles.includes(userStore.userRole || '');

      if (!hasPermission) {
        const redirectRoute =
          userStore.userRole === ROLES.CANDIDATE
            ? { name: 'exam-schedule' }
            : userStore.userRole === ROLES.EXAM_OPERATIONS_OFFICER
              ? { name: 'admin-location-management' }
              : { name: 'admin-dashboard' };
        if (to.name === redirectRoute.name) {
          console.warn('Access denied even to default dashboard. Redirecting to login.');
          return { name: 'login' };
        }

        return redirectRoute;
      }
    }
    if (userStore.isLoggedIn && (to.name === 'login' || to.name === 'register')) {
      if (to.query.redirect) {
        return to.query.redirect as string;
      }
      return userStore.userRole === ROLES.CANDIDATE
        ? { name: 'exam-schedule' }
        : userStore.userRole === ROLES.EXAM_OPERATIONS_OFFICER
          ? { name: 'admin-location-management' }
          : { name: 'admin-dashboard' };
    }

    return true;
  });

  return Router;
});
