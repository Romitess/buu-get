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
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: false },
      },
      {
        path: 'exam-schedule',
        name: 'exam-schedule',
        component: () => import('pages/ExamSchedulePage.vue'),
        meta: { requiresAuth: false }, // Public page
      },
      {
        path: 'exam-history',
        name: 'exam-history',
        component: () => import('pages/ExamHistoryPage.vue'),
        meta: { requiresAuth: false }, // Protected
      },
      {
        path: 'staff-dashboard',
        name: 'staff-dashboard',
        component: () => import('pages/staff-dashboard-page.vue'),
        meta: { requiresAuth: false }, // Staff only
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('pages/RegisterPage.vue'),
    meta: { requiresAuth: false },
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
