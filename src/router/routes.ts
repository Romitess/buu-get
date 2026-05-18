import type { RouteRecordRaw } from 'vue-router';
import { ROLES } from 'src/constants/roles';
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    hideHeader?: boolean;
    hideDrawer?: boolean;
    footerVariant?: 'primary' | 'white';
    breadcrumb?: {
      label: string;
      icon?: string;
      to?: string;
    }[];
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
        meta: {
          requiresAuth: false,
          breadcrumb: [{ label: 'navigation.home', icon: 'home' }],
        },
      },
      {
        path: 'user/exam-schedule',
        name: 'exam-schedule',
        component: () => import('pages/user/exam-schedule-page.vue'),
        meta: {
          requiresAuth: false,
          breadcrumb: [
            { label: 'navigation.home', icon: 'home', to: '/' },
            { label: 'navigation.selectSession', icon: 'event' },
          ],
        },
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
          hideHeader: false,
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
            path: 'exam-history',
            name: 'exam-history',
            component: () => import('pages/user/exam-history-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.examHistory', icon: 'history' },
              ],
            },
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
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.dashboard', icon: 'dashboard' },
              ],
            },
          },
          {
            path: 'exam-management',
            name: 'admin-exam-management',
            component: () => import('pages/admin/exam-management-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageExams', icon: 'edit_document' },
              ],
            },
          },
          {
            path: 'create-exam',
            name: 'admin-create-exam',
            component: () => import('pages/admin/create-exam-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.createExam', icon: 'add_circle' },
              ],
            },
          },
          {
            path: 'edit-exam/:examId',
            name: 'admin-edit-exam',
            component: () => import('pages/admin/edit-exam-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.editExam', icon: 'edit' },
              ],
            },
          },
          {
            path: 'exam-management/:examId/seats',
            name: 'admin-exam-seat-management',
            component: () => import('pages/admin/exam-seat-management-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.manageSeats', icon: 'event_seat' },
              ],
            },
          },
          {
            path: 'exam-management/:examId/seats/candidates',
            name: 'admin-exam-seat-candidates',
            component: () => import('pages/admin/exam-seat-candidates-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageExams', icon: 'star', to: '/admin/exam-management' },
                {
                  label: 'navigation.manageSeats',
                  icon: 'event_seat',
                  to: '/admin/exam-management/:examId/seats',
                },
                { label: 'navigation.seatCandidates', icon: 'star' },
              ],
            },
          },
          {
            path: 'exam-management/:examId/registrants',
            name: 'admin-exam-registrants',
            component: () => import('pages/admin/exam-registrants-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.manageRegistrants', icon: 'group' },
              ],
            },
          },
          {
            path: 'exam-management/:examId/scores',
            name: 'admin-exam-scores',
            component: () => import('pages/admin/exam-scores-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.manageScores', icon: 'star' },
              ],
            },
          },
          {
            path: 'exam-management/:examId/registrants/:ermId',
            name: 'admin-exam-registrant-detail',
            component: () => import('pages/admin/exam-registrant-detail-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                {
                  label: 'navigation.manageRegistrants',
                  icon: 'group',
                  to: '/admin/exam-management/:examId/registrants',
                },
                { label: 'navigation.registrantDetail', icon: 'person' },
              ],
            },
          },
          {
            path: 'exam-management/:examId/attendance',
            name: 'admin-exam-attendance',
            component: () => import('pages/admin/exam-attendance-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.examAttendance', icon: 'format_list_bulleted' },
              ],
            },
          },
          {
            path: 'payment-import',
            name: 'admin-payment-import',
            component: () => import('pages/admin/payment-import-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.paymentImport', icon: 'upload_file' },
              ],
            },
          },
          {
            path: 'fin-check-transcript',
            name: 'admin-fin-check-transcript',
            component: () => import('pages/admin/fin-check-transcript-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.paymentImport',
                  icon: 'upload_file',
                  to: '/admin/payment-import',
                },
                { label: 'navigation.checkPayment', icon: 'fact_check' },
              ],
            },
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
