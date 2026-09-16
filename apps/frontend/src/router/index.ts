import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { useUserStore } from 'src/stores/user.store';
import { getDefaultRouteForRole } from 'src/utils/default-route';
import { resolveSafeInAppRedirect } from 'src/utils/safe-redirect';
import {
  canAccessRoomCheckInPage,
  isRoomCheckInRoute,
} from 'src/utils/room-check-in-access';
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
    const roleRecords = to.matched.filter((record) => record.meta.roles);
    if (requiresAuth && !userStore.isLoggedIn) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }
    if (userStore.isLoggedIn && roleRecords.length > 0) {
      const effectiveRoles = userStore.effectiveRoles;
      const isPrivileged = effectiveRoles.some(
        (role) => role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN,
      );
      // บุคลากร (loginBuu) ห้ามเข้าหน้าแก้ไขโปรไฟล์ผู้สมัคร แม้จะเป็น admin
      if (to.name === 'user-profile' && userStore.isPersonnelActor) {
        return getDefaultRouteForRole(userStore.userRole);
      }
      // ผู้ดูแลระบบห้ามเข้าหน้าเช็คอินเข้าห้องสอบ แม้ router จะ bypass สิทธิ์ admin
      if (isRoomCheckInRoute(to.name) && !canAccessRoomCheckInPage(userStore.userRole)) {
        return getDefaultRouteForRole(userStore.userRole);
      }
      // multi-role: ผ่านถ้า user มี role อย่างน้อยหนึ่งตัวที่ route อนุญาต
      const hasPermission =
        isPrivileged ||
        roleRecords.every((record) =>
          (record.meta.roles as string[]).some((allowed) =>
            effectiveRoles.includes(allowed),
          ),
        );

      if (!hasPermission) {
        const redirectRoute = getDefaultRouteForRole(userStore.userRole);
        if (to.name === redirectRoute.name) {
          console.warn('Access denied even to default dashboard. Redirecting to login.');
          return { name: 'login' };
        }

        return redirectRoute;
      }
    }
    if (userStore.isLoggedIn && (to.name === 'login' || to.name === 'register')) {
      const safeRedirect = resolveSafeInAppRedirect(to.query.redirect);
      if (safeRedirect) {
        return safeRedirect;
      }
      return getDefaultRouteForRole(userStore.userRole);
    }

    return true;
  });

  return Router;
});
