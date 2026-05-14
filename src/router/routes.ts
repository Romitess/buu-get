import type { RouteRecordRaw } from 'vue-router';
import { ROLES } from 'src/constants/roles';
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    hideHeader?: boolean;
    hideDrawer?: boolean;
    footerVariant?: 'primary' | 'white';
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/main-layout.vue'),
    children: [
      // === Public Routes ===
      {
        path: '',
        name: 'home',
        component: () => import('pages/home-page.vue'),
        meta: { requiresAuth: false },
      },

      // === Auth Routes ===
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/auth/login-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: true,
          hideDrawer: true,
          footerVariant: 'white',
        },
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('pages/auth/register-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: true,
          hideDrawer: true,
          footerVariant: 'white',
        },
      },

      // === Candidate (User) Routes ===
      {
        path: 'user',
        meta: { requiresAuth: true, roles: [ROLES.CANDIDATE] },
        children: [
          {
            path: 'exam-schedule',
            name: 'exam-schedule',
            component: () => import('pages/user/exam-schedule-page.vue'),
          },
          {
            path: 'exam-history',
            name: 'exam-history',
            component: () => import('pages/user/exam-history-page.vue'),
          },
        ],
      },

      // === Staff (Admin) Routes ===
      {
        path: 'admin',
        meta: {
          requiresAuth: true,
          roles: [
            ROLES.ADMIN,
            ROLES.STAFF,
            ROLES.REGISTRATION_OFFICER,
            ROLES.FINANCE,
            ROLES.EXECUTIVE,
            ROLES.PROCTOR,
          ],
        },
        children: [
          {
            path: 'dashboard',
            name: 'admin-dashboard',
            component: () => import('pages/admin/dashboard-page.vue'),
          },
          {
            path: 'exam-management',
            name: 'admin-exam-management',
            component: () => import('pages/admin/exam-management-page.vue'),
          },
          {
            path: 'create-exam',
            name: 'admin-create-exam',
            component: () => import('pages/admin/create-exam-page.vue'),
          },
          {
            path: 'exam-management/:examId/registrants',
            name: 'admin-exam-registrants',
            component: () => import('pages/admin/exam-registrants-page.vue'),
          },
          {
            path: 'exam-management/:examId/seats',
            name: 'admin-exam-seat-management',
            component: () => import('pages/admin/exam-seat-management-page.vue'),
          },
          {
            path: 'exam-management/registrants/:ermId',
            name: 'admin-exam-registrant-detail',
            component: () => import('pages/admin/exam-registrant-detail-page.vue'),
          },
        ],
      },
    ],
  },

  // Always leave this as last one,
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/error-not-found.vue'),
  },
];

export default routes;
