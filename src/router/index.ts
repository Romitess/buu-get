import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be direct; either use
 * synchronous code or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // --- ระบบดักหน้าประตู (Route Guard) ---
  Router.beforeEach((to) => {
    const userStore = useUserStore();

    // โหลดข้อมูลผู้ใช้เริ่มต้นถ้ายังไม่มี
    if (localStorage.getItem('isLoggedIn') === 'true' && !userStore.isLoggedIn) {
      userStore.initialize();
    }

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
    const allowedRoles = to.matched.find((record) => record.meta.roles)?.meta.roles;

    // 1. ถ้าต้อง Login แต่ยังไม่ได้ Login -> ไปหน้า Login
    if (requiresAuth && !userStore.isLoggedIn) {
      return { name: 'login' };
    }

    // 2. ถ้า Login แล้ว แต่กำลังจะเข้าหน้าที่จำกัดสิทธิ์ (Roles)
    if (userStore.isLoggedIn && allowedRoles) {
      const hasPermission = allowedRoles.includes(userStore.userRole || '');

      if (!hasPermission) {
        // ถ้าไม่มีสิทธิ์ -> ส่งไปหน้า Dashboard ตาม Role ตัวเอง
        return userStore.userRole === ROLES.CANDIDATE
          ? { name: 'exam-schedule' }
          : { name: 'admin-dashboard' };
      }
    }

    // 3. ถ้า Login อยู่แล้ว และพยายามเข้าหน้า Login/Register -> ส่งไปหน้าหลักของตัวเอง
    if (userStore.isLoggedIn && (to.name === 'login' || to.name === 'register')) {
      return userStore.userRole === ROLES.CANDIDATE
        ? { name: 'exam-schedule' }
        : { name: 'admin-dashboard' };
    }

    return true; // อนุญาตให้ผ่าน
  });

  return Router;
});

// นำเข้าข้อมูลที่จำเป็นสำหรับ Guard
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
