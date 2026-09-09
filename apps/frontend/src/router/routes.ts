import type { RouteRecordRaw } from 'vue-router';
import { ROLES } from 'src/constants/roles';
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    hideHeader?: boolean;
    hideDrawer?: boolean;
    hideFooter?: boolean;
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
      {
        path: 'verify',
        name: 'verify',
        component: () => import('pages/verify/verify-page.vue'),
        meta: {
          requiresAuth: false,
          breadcrumb: [
            { label: 'navigation.home', icon: 'home', to: '/' },
            { label: 'verify.title', icon: 'verified' },
          ],
        },
      },
      {
        path: 'verify/certificate/:code',
        name: 'verify-certificate',
        component: () => import('pages/verify/verify-certificate-page.vue'),
        meta: {
          requiresAuth: false,
          breadcrumb: [
            { label: 'navigation.home', icon: 'home', to: '/' },
            { label: 'verify.certificate.title', icon: 'verified' },
          ],
        },
      },
      {
        path: 'verify/receipt/:code',
        name: 'verify-receipt',
        component: () => import('pages/verify/verify-receipt-page.vue'),
        meta: {
          requiresAuth: false,
          breadcrumb: [
            { label: 'navigation.home', icon: 'home', to: '/' },
            { label: 'verify.receipt.title', icon: 'receipt_long' },
          ],
        },
      },
      {
        path: 'v/c/:code',
        name: 'verify-certificate-short',
        component: () => import('pages/verify/verify-certificate-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: true,
          hideDrawer: true,
        },
      },
      {
        path: 'v/r/:code',
        name: 'verify-receipt-short',
        component: () => import('pages/verify/verify-receipt-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: true,
          hideDrawer: true,
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
        component: () => import('pages/auth/login-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: false,
          hideDrawer: true,
          footerVariant: 'white',
        },
      },
      {
        path: 'thaid/callback',
        name: 'thaid-callback',
        component: () => import('pages/auth/thaid-callback-page.vue'),
        meta: {
          requiresAuth: false,
          hideHeader: true,
          hideDrawer: true,
          footerVariant: 'white',
        },
      },

      // === Common Authenticated Routes ===
      {
        path: 'user/profile',
        name: 'user-profile',
        component: () => import('pages/user/profile-page.vue'),
        meta: {
          requiresAuth: true,
          breadcrumb: [
            { label: 'navigation.home', icon: 'home', to: '/' },
            { label: 'profile.pageTitleEdit', icon: 'person' },
          ],
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
          {
            path: 'exam-simulation',
            name: 'exam-simulation',
            component: () => import('pages/user/exam-simulation-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.examSimulation', icon: 'monitor' },
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
            ROLES.EXAM_OPERATIONS_OFFICER,
          ],
        },
        children: [
          {
            path: 'dashboard',
            name: 'admin-dashboard',
            component: () => import('pages/admin/dashboard-page.vue'),
            meta: {
              roles: [
                ROLES.ADMIN,
                ROLES.STAFF,
                ROLES.REGISTRATION_OFFICER,
                ROLES.EXECUTIVE,
                ROLES.PROCTOR,
                ROLES.EXAM_OPERATIONS_OFFICER,
              ],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.dashboard', icon: 'dashboard' },
              ],
            },
          },
          {
            path: 'location-management',
            name: 'admin-location-management',
            component: () => import('pages/admin/location-management-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageLocations', icon: 'room' },
              ],
            },
          },
          {
            path: 'fund-source-management',
            name: 'admin-fund-source-management',
            component: () => import('pages/admin/fin-fund-source-mananagement-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.fundSourceManagement', icon: 'account_balance' },
              ],
            },
          },
          {
            path: 'create-location',
            name: 'admin-create-location',
            component: () => import('pages/admin/location-create-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageLocations',
                  icon: 'room',
                  to: '/admin/location-management',
                },
                { label: 'navigation.createLocation', icon: 'add_circle' },
              ],
            },
          },
          {
            path: 'edit-location/:locationId',
            name: 'admin-edit-location',
            component: () => import('pages/admin/location-edit-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageLocations',
                  icon: 'room',
                  to: '/admin/location-management',
                },
                { label: 'navigation.editLocation', icon: 'edit' },
              ],
            },
          },
          {
            path: 'applicant-audit',
            name: 'admin-applicant-audit',
            component: () => import('pages/admin/applicant-audit-page.vue'),
            meta: {
              roles: [ROLES.ADMIN],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.applicantAudit', icon: 'manage_search' },
              ],
            },
          },
          {
            path: 'audit-logs',
            name: 'admin-audit-logs',
            component: () => import('pages/admin/audit-logs-page.vue'),
            meta: {
              roles: [ROLES.ADMIN],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.auditLogs', icon: 'policy' },
              ],
            },
          },
          {
            path: 'system-settings',
            name: 'admin-system-settings',
            component: () => import('pages/admin/system-settings-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.systemSettings', icon: 'settings' },
              ],
            },
          },
          {
            path: 'applicant-audit/:userId',
            name: 'admin-applicant-audit-detail',
            component: () => import('pages/admin/applicant-audit-detail-page.vue'),
            meta: {
              roles: [ROLES.ADMIN],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.applicantAudit',
                  icon: 'manage_search',
                  to: '/admin/applicant-audit',
                },
                { label: 'navigation.applicantAuditDetail', icon: 'history' },
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
            path: 'passcode-history',
            name: 'admin-passcode-history',
            component: () => import('pages/admin/passcode-history-page.vue'),
            meta: {
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.manageExams',
                  icon: 'edit_document',
                  to: '/admin/exam-management',
                },
                { label: 'navigation.passcodeHistory', icon: 'how_to_reg' },
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
            path: 'exam-management/:examId/registrants/:ermId/history',
            name: 'admin-exam-registrant-history',
            component: () => import('pages/admin/exam-registrant-history-page.vue'),
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
                { label: 'profileEditHistory.pageTitle', icon: 'history' },
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
            path: 'check-in/rooms',
            name: 'admin-check-in-rooms',
            component: () => import('pages/admin/check-in-rooms-page.vue'),
            meta: {
              roles: [
                ROLES.ADMIN,
                ROLES.STAFF,
                ROLES.REGISTRATION_OFFICER,
                ROLES.EXAM_OPERATIONS_OFFICER,
                ROLES.PROCTOR,
              ],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.roomCheckIn', icon: 'qr_code_scanner' },
              ],
            },
          },
          {
            path: 'check-in/rooms/:casId/scan',
            name: 'admin-room-check-in-scanner',
            component: () => import('pages/admin/room-check-in-scanner-page.vue'),
            meta: {
              hideHeader: true,
              hideDrawer: true,
              hideFooter: true,
              roles: [
                ROLES.ADMIN,
                ROLES.STAFF,
                ROLES.REGISTRATION_OFFICER,
                ROLES.EXAM_OPERATIONS_OFFICER,
                ROLES.PROCTOR,
              ],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.roomCheckIn', icon: 'qr_code_scanner' },
              ],
            },
          },
          {
            path: 'check-in-assist/:joinToken',
            name: 'admin-check-in-assist-scanner',
            component: () => import('pages/admin/check-in-assist-scanner-page.vue'),
            meta: {
              hideHeader: true,
              hideDrawer: true,
              roles: [
                ROLES.ADMIN,
                ROLES.STAFF,
                ROLES.REGISTRATION_OFFICER,
                ROLES.EXAM_OPERATIONS_OFFICER,
              ],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.examAttendance', icon: 'qr_code_scanner' },
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
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.paymentImport', icon: 'upload_file' },
              ],
            },
          },
          {
            path: 'receipt-void-refund',
            name: 'admin-receipt-void-refund',
            component: () => import('pages/admin/receipt-void-refund-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.receiptVoidRefund', icon: 'receipt_long' },
              ],
            },
          },
          {
            path: 'payment-import-test-export',
            name: 'admin-payment-import-test-export',
            component: () => import('pages/admin/payment-import-test-export-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.paymentImport',
                  icon: 'upload_file',
                  to: '/admin/payment-import',
                },
                {
                  label: 'navigation.paymentImportTestExport',
                  icon: 'download',
                },
              ],
            },
          },
          {
            path: 'fin-check-transcript',
            name: 'admin-fin-check-transcript',
            component: () => import('pages/admin/fin-check-transcript-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
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
          {
            path: 'test-voucher-management',
            name: 'admin-test-voucher-management',
            component: () => import('pages/admin/test-voucher-management-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.EXAM_OPERATIONS_OFFICER],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageTestVoucher', icon: 'star' },
              ],
            },
          },
          {
            path: 'score-rubric-management',
            name: 'admin-score-rubric-management',
            component: () => import('pages/admin/score-rubric-management-page.vue'),
            meta: {
              roles: [
                ROLES.ADMIN,
                ROLES.STAFF,
                ROLES.EXAM_OPERATIONS_OFFICER,
                ROLES.REGISTRATION_OFFICER,
              ],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageScoreRubrics', icon: 'star' },
              ],
            },
          },
          {
            path: 'score-criteria-management',
            name: 'admin-score-criteria-management',
            component: () => import('pages/admin/score-criteria-management-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.EXAM_OPERATIONS_OFFICER],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageBandCertificate', icon: 'star' },
              ],
            },
          },
          {
            path: 'daily-revenue-report',
            name: 'admin-daily-revenue-report',
            component: () => import('pages/admin/daily-revenue-report-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.dailyRevenueReport', icon: 'star' },
              ],
            },
          },
          {
            path: 'receipt-usage-report',
            name: 'admin-receipt-usage-report',
            component: () => import('pages/admin/receipt-usage-report-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.receiptUsageReport', icon: 'receipt' },
              ],
            },
          },
          {
            path: 'application-fee-report',
            name: 'admin-application-fee-report',
            component: () => import('pages/admin/application-fee-report-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.FINANCE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.applicationFeeReport', icon: 'paid' },
              ],
            },
          },

          {
            path: 'executive/test-takers',
            name: 'admin-executive-test-takers',
            component: () => import('pages/admin/exam-information-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.EXECUTIVE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.examCandidatesInfo', icon: 'star' },
              ],
            },
          },
          {
            path: 'executive/test-takers/:examId/:ermId/history',
            name: 'admin-executive-test-taker-history',
            component: () => import('pages/admin/executive-exam-history-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.EXECUTIVE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.examCandidatesInfo', icon: 'star', to: '/admin/executive/test-takers' },
                { label: 'navigation.examHistory', icon: 'star' },
              ],
            },
          },
          {
            path: 'exam-information/:year?',
            name: 'admin-exam-information',
            component: () => import('pages/admin/exam-information-yearly-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.EXECUTIVE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.examReport',
                  icon: 'assessment',
                  to: '/admin/dashboard',
                },
                { label: 'navigation.examInformation', icon: 'info' },
              ],
            },
          },
          {
            path: 'exam-information/:year/candidates',
            name: 'admin-exam-candidates-info',
            component: () => import('pages/admin/exam-candidates-info-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.EXECUTIVE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.examReport',
                  icon: 'assessment',
                  to: '/admin/dashboard',
                },
                {
                  label: 'navigation.examInformation',
                  icon: 'info',
                  to: '/admin/exam-information/:year',
                },
                { label: 'navigation.examCandidatesInfo', icon: 'people_outline' },
              ],
            },
          },
          {
            path: 'exam-information/:year/candidates/:ermId/history',
            name: 'admin-executive-exam-history',
            component: () => import('pages/admin/executive-exam-history-page.vue'),
            meta: {
              roles: [ROLES.ADMIN, ROLES.EXECUTIVE],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                {
                  label: 'navigation.examReport',
                  icon: 'assessment',
                  to: '/admin/dashboard',
                },
                {
                  label: 'navigation.examInformation',
                  icon: 'info',
                  to: '/admin/exam-information/:year',
                },
                {
                  label: 'navigation.examCandidatesInfo',
                  icon: 'people_outline',
                  to: '/admin/exam-information/:year/candidates?round=:round',
                },
                { label: 'navigation.examHistory', icon: 'history' },
              ],
            },
          },
          {
            path: 'page-builder',
            name: 'admin-page-builder',
            component: () => import('pages/admin/page-builder-page.vue'),
            meta: {
              roles: [
                ROLES.ADMIN,
                ROLES.STAFF,
                ROLES.REGISTRATION_OFFICER,
                ROLES.EXAM_OPERATIONS_OFFICER,
              ],
              breadcrumb: [
                { label: 'navigation.home', icon: 'home', to: '/' },
                { label: 'navigation.manageHomeContent', icon: 'star' },
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
