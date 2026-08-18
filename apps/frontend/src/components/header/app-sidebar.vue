<template>
  <q-drawer
    v-model="leftDrawerOpen"
    show-if-above
    :mini="isMini"
    :mini-to-overlay="miniState"
    :width="290"
    :mini-width="72"
    bordered
    side="left"
    class="app-sidebar"
    :class="{ 'app-sidebar--expanding': isHovered && miniState }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Sidebar List -->
    <q-list class="sidebar-list">
      <template v-for="link in menuLinks" :key="link.name">
        <!-- Expanded Group (isGroup = true) -->
        <q-expansion-item
          v-if="link.isGroup"
          :default-opened="true"
          class="sidebar-group"
          header-class="sidebar-item"
          active-class="sidebar-item--active"
        >
          <template v-slot:header>
            <q-item-section avatar class="sidebar-item__avatar">
              <q-icon :name="link.icon" size="24px" class="sidebar-item__icon" />
            </q-item-section>
            <q-item-section class="sidebar-item__text">
              <q-item-label class="text-weight-bold">{{ link.label }}</q-item-label>
            </q-item-section>
          </template>

          <q-list class="sidebar-child-list">
            <q-item
              v-for="child in link.children"
              :key="child.name"
              clickable
              :to="child.path"
              class="sidebar-item sidebar-child-item"
              active-class="sidebar-item--active"
              exact
            >
              <q-item-section avatar class="sidebar-item__avatar">
                <q-icon :name="child.icon" size="20px" class="sidebar-item__icon" />
              </q-item-section>
              <q-item-section class="sidebar-item__text">
                <q-item-label class="text-weight-medium">{{ child.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>

        <!-- Normal Item -->
        <q-item
          v-else
          clickable
          :to="link.path"
          class="sidebar-item"
          active-class="sidebar-item--active"
          exact
        >
          <q-item-section avatar class="sidebar-item__avatar">
            <q-icon :name="link.icon" size="24px" class="sidebar-item__icon" />
          </q-item-section>
          <q-item-section class="sidebar-item__text">
            <q-item-label class="text-weight-bold">{{ link.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNavigation } from 'src/composables/use-navigation';
import { ROLES } from 'src/constants/roles';

const { t, locale } = useI18n();
const { userStore, leftDrawerOpen, miniState, isHovered, isMini } = useNavigation();

let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const onMouseEnter = (): void => {
  if (hoverTimer) clearTimeout(hoverTimer);
  isHovered.value = true;
};

const onMouseLeave = (): void => {
  hoverTimer = setTimeout(() => {
    isHovered.value = false;
  }, 80);
};

// Dynamic role-based navigation menu links
const menuLinks = computed(() => {
  void locale.value;
  const role = userStore.userRole;
  const links = [];

  // 1. หน้าหลัก (Always present)
  links.push({
    name: 'home',
    label: t('navigation.home'),
    icon: 'home',
    path: '/',
  });

  // 2. Role-specific links
  // IF: Candidate
  if (role === ROLES.CANDIDATE) {
    links.push({
      name: 'exam-schedule',
      label: t('navigation.examSchedule'),
      icon: 'list_alt',
      path: '/user/exam-schedule',
    });
    links.push({
      name: 'exam-simulation',
      label: t('navigation.examSimulation'),
      icon: 'monitor',
      path: '/user/exam-simulation',
    });
    links.push({
      name: 'exam-history',
      label: t('navigation.examHistory'),
      icon: 'history',
      path: '/user/exam-history',
    });
    links.push({
      name: 'user-profile',
      label: t('navigation.personalProfile'),
      icon: 'person',
      path: '/user/profile',
    });
  }
  // IF: Guest (not logged in)
  else if (!userStore.isLoggedIn) {
    links.push({
      name: 'exam-schedule-guest',
      label: t('navigation.viewSchedule'),
      icon: 'event',
      path: '/user/exam-schedule',
    });
  }
  // IF: Registration Officer or Admin
  else if (role === ROLES.REGISTRATION_OFFICER || role === ROLES.ADMIN) {
    links.push({
      name: 'location-management',
      label: t('navigation.manageLocations'),
      icon: 'corporate_fare',
      path: '/admin/location-management',
    });
    links.push({
      name: 'exam-management',
      label: t('navigation.manageExams'),
      icon: 'assignment',
      path: '/admin/exam-management',
    });
    links.push({
      name: 'score-rubric-management',
      label: t('navigation.manageScoreRubrics'),
      icon: 'grading',
      path: '/admin/score-rubric-management',
    });
    links.push({
      name: 'page-builder',
      label: t('navigation.manageHomeContent'),
      icon: 'edit',
      path: '/admin/page-builder',
    });
  }
  // IF: Exam Operations Officer or Staff
  else if (role === ROLES.EXAM_OPERATIONS_OFFICER || role === ROLES.STAFF) {
    links.push({
      name: 'exam-management',
      label: t('navigation.manageExams'),
      icon: 'assignment',
      path: '/admin/exam-management',
    });
    links.push({
      name: 'documents-group',
      label: t('navigation.manageDocuments'),
      icon: 'description',
      isGroup: true,
      children: [
        {
          name: 'test-voucher-management',
          label: t('navigation.manageTestVoucher'),
          icon: 'contact_page',
          path: '/admin/test-voucher-management',
        },
        {
          name: 'score-rubric-management',
          label: t('navigation.manageScoreRubrics'),
          icon: 'grading',
          path: '/admin/score-rubric-management',
        },
        {
          name: 'score-criteria-management',
          label: t('navigation.manageBandCertificate'),
          icon: 'workspace_premium',
          path: '/admin/score-criteria-management',
        },
      ],
    });
  }
  // IF: Finance
  else if (role === ROLES.FINANCE) {
    links.push({
      name: 'payment-import',
      label: t('navigation.paymentImport'),
      icon: 'payments',
      path: '/admin/payment-import',
    });
    links.push({
      name: 'payment-import-test-export',
      label: t('navigation.paymentImportTestExport'),
      icon: 'download',
      path: '/admin/payment-import-test-export',
    });
    links.push({
      name: 'fund-source-management',
      label: t('navigation.fundSourceManagement'),
      icon: 'account_balance',
      path: '/admin/fund-source-management',
    });
    links.push({
      name: 'reports-group',
      label: t('navigation.reports'),
      icon: 'bar_chart',
      isGroup: true,
      children: [
        {
          name: 'daily-revenue-report',
          label: t('navigation.dailyRevenueReport'),
          icon: 'request_quote',
          path: '/admin/daily-revenue-report',
        },
        {
          name: 'receipt-usage-report',
          label: t('navigation.receiptUsageReport'),
          icon: 'receipt',
          path: '/admin/receipt-usage-report',
        },
        {
          name: 'application-fee-report',
          label: t('navigation.applicationFeeReport'),
          icon: 'summarize',
          path: '/admin/application-fee-report',
        },
      ],
    });
  }
  // IF: Executive
  else if (role === ROLES.EXECUTIVE) {
    links.push({
      name: 'admin-dashboard',
      label: t('navigation.dashboard'),
      icon: 'dashboard',
      path: '/admin/dashboard',
    });
    links.push({
      name: 'admin-executive-test-takers',
      label: t('navigation.examInformation'),
      icon: 'groups',
      path: '/admin/executive/test-takers',
    });
  }

  return links;
});
</script>

<style scoped lang="scss">
.app-sidebar {
  background-color: var(--surface-card) !important;
  overflow-x: hidden;
  will-change: width;
}

// Smooth the overlay transition on the Quasar drawer itself
:deep(.q-drawer__content) {
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-x: hidden;
}

.sidebar-list {
  padding: 8px 12px;
}

.sidebar-item {
  border-radius: 8px;
  margin-bottom: 6px;
  color: var(--text-primary);
  min-height: 48px;
  padding: 8px 12px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  .sidebar-item__icon {
    color: var(--text-primary);
    transition: color 0.2s ease;
  }

  &--active {
    color: var(--primary) !important;
    background-color: #ebf1fa !important;

    .sidebar-item__icon {
      color: var(--primary) !important;
    }
  }

  &:hover:not(.sidebar-item--active) {
    background-color: var(--badge-primary-bg);
    color: var(--primary);

    .sidebar-item__icon {
      color: var(--primary);
    }
  }
}

.sidebar-child-list {
  margin-top: 4px;
}

.sidebar-child-item {
  margin-left: 8px;
  min-height: 40px;
  padding: 4px 12px;
}

.sidebar-group {
  margin-bottom: 6px;

  :deep(.q-item) {
    border-radius: 8px;
    min-height: 48px;
  }
}

// Make q-expansion-item body transitions faster so they don't lag behind the drawer
:deep(.sidebar-group .q-expansion-item__content) {
  transition: none;
}

.sidebar-item__avatar {
  min-width: 24px !important;
  margin-right: 12px;
}

// Smooth the text/label appearance during hover expand
.sidebar-item__text {
  opacity: 1;
  transition: opacity 0.15s ease 0.05s;
  white-space: nowrap;
  overflow: hidden;
}

// Mini mode
:deep(.q-drawer--mini) {
  .q-drawer__content {
    overflow-x: hidden;
  }

  .q-list {
    padding: 8px 12px !important;
  }

  .q-item {
    width: 48px !important;
    height: 48px !important;
    min-height: 48px !important;
    padding: 8px 12px !important;
    margin: 0 auto 6px auto !important;
    display: flex !important;
    justify-content: flex-start !important;
    align-items: center !important;
  }

  .q-item__section--avatar {
    min-width: 24px !important;
    padding-right: 0 !important;
    width: 24px !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .q-item__section--main {
    display: none !important;
  }

  // Hide expansion content when mini to avoid flash
  .q-expansion-item__content {
    display: none !important;
  }

  // Hide the expansion toggle icon when mini
  .q-expansion-item__toggle-icon {
    display: none !important;
  }
}

// When expanding from mini on hover, animate content in
.app-sidebar--expanding {
  :deep(.q-item__section--main) {
    animation: fadeInText 0.2s ease-out forwards;
  }
}

@keyframes fadeInText {
  from {
    opacity: 0;
    transform: translateX(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
