import type { RouteRecordRaw } from 'vue-router';

// Module augmentation for vue-router meta types
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[]; // e.g. ['user', 'staff']
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/main-layout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/index-page.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'exam-schedule',
        name: 'exam-schedule',
        component: () => import('pages/exam-schedule-page.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'exam-history',
        name: 'exam-history',
        component: () => import('pages/exam-history-page.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'staff-dashboard',
        name: 'staff-dashboard',
        component: () => import('pages/staff-dashboard-page.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('pages/login-page.vue'),
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
        component: () => import('pages/register-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: true,
          hideDrawer: true,
          footerVariant: 'white',
        },
      },
      {
        path: 'create-exam',
        name: 'create-exam',
        component: () => import('pages/create-exam-round-page.vue'),
        meta: {
          hideHeader: true,
          hideDrawer: true,
          footerVariant: 'white',
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/error-not-found.vue'),
  },
];

export default routes;
