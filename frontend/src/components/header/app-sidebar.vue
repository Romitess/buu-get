<template>
  <q-drawer
    v-model="leftDrawerOpen"
    show-if-above
    :mini="isMini"
    :mini-to-overlay="miniState"
    :width="260"
    :mini-width="72"
    bordered
    side="left"
    class="app-sidebar"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
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
              <q-item-section>
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

const { t } = useI18n();
const { userStore, leftDrawerOpen, miniState, isHovered, isMini } = useNavigation();

// Dynamic role-based navigation menu links
const menuLinks = computed(() => {
  const role = userStore.userRole;
  const links = [];

  // 1. หน้าหลัก (Always present)
  links.push({
    name: 'home',
    label: t('navigation.home') || 'หน้าหลัก',
    icon: 'home',
    path: '/',
  });

  // 2. Role-specific links
  // IF: Candidate
  if (role === ROLES.CANDIDATE) {
    links.push({
      name: 'exam-schedule',
      label: t('navigation.examSchedule') || 'ตารางสอบ',
      icon: 'event',
      path: '/user/exam-schedule',
    });
    links.push({
      name: 'exam-history',
      label: t('navigation.examHistory') || 'ประวัติการสอบ',
      icon: 'history',
      path: '/user/exam-history',
    });
  }
  // IF: Guest (not logged in)
  else if (!userStore.isLoggedIn) {
    links.push({
      name: 'exam-schedule-guest',
      label: t('navigation.viewSchedule') || 'ตารางสอบ',
      icon: 'event',
      path: '/user/exam-schedule',
    });
  }
  // IF: Registration Officer or Admin
  else if (role === ROLES.REGISTRATION_OFFICER || role === ROLES.ADMIN) {
    links.push({
      name: 'location-management',
      label: t('navigation.manageLocations') || 'จัดการห้องสอบ',
      icon: 'corporate_fare',
      path: '/admin/location-management',
    });
    links.push({
      name: 'exam-management',
      label: t('navigation.manageExams') || 'จัดการรอบสอบ',
      icon: 'assignment',
      path: '/admin/exam-management',
    });
    links.push({
      name: 'page-builder',
      label: t('navigation.manageHomeContent') || 'จัดการเนื้อหาหน้าหลัก',
      icon: 'edit',
      path: '/admin/page-builder',
    });
  }
  // IF: Exam Operations Officer or Staff
  else if (role === ROLES.EXAM_OPERATIONS_OFFICER || role === ROLES.STAFF) {
    links.push({
      name: 'exam-management',
      label: t('navigation.manageExams') || 'จัดการรอบสอบ',
      icon: 'assignment',
      path: '/admin/exam-management',
    });
    links.push({
      name: 'documents-group',
      label: 'จัดการเอกสาร',
      icon: 'description',
      isGroup: true,
      children: [
        {
          name: 'test-voucher-management',
          label: t('navigation.manageTestVoucher') || 'จัดการ Test Voucher',
          icon: 'contact_page',
          path: '/admin/test-voucher-management',
        },
        {
          name: 'score-criteria-management',
          label: 'จัดการ Certificate',
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
      label: t('navigation.paymentImport') || 'นำเข้าไฟล์การชำระเงิน',
      icon: 'payments',
      path: '/admin/payment-import',
    });
    links.push({
      name: 'fund-source-management',
      label: t('navigation.fundSourceManagement') || 'จัดการผังแหล่งเงิน',
      icon: 'account_balance',
      path: '/admin/fund-source-management',
    });
    links.push({
      name: 'reports-group',
      label: t('navigation.reports') || 'รายงาน',
      icon: 'bar_chart',
      isGroup: true,
      children: [
        {
          name: 'daily-revenue-report',
          label: t('navigation.dailyRevenueReport') || 'สรุปการรับเงินประจำวัน',
          icon: 'request_quote',
          path: '/admin/daily-revenue-report',
        },
        {
          name: 'receipt-usage-report',
          label: t('navigation.receiptUsageReport') || 'การใช้ใบเสร็จรับเงิน',
          icon: 'receipt',
          path: '/admin/receipt-usage-report',
        },
        {
          name: 'application-fee-report',
          label: t('navigation.applicationFeeReport') || 'สรุปการรับเงินค่าสมัครสอบ',
          icon: 'summarize',
          path: '/admin/application-fee-report',
        },
      ],
    });
  }
  // IF: Executive
  else if (role === ROLES.EXECUTIVE) {
    links.push({
      name: 'exam-report',
      label: t('navigation.examReport') || 'รายงานการสอบ',
      icon: 'assessment',
      path: '/admin/exam-report',
    });
    links.push({
      name: 'executive-test-takers',
      label: 'ข้อมูลผู้เข้าสอบ',
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
  transition: all 0.3s ease;
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
  transition: all 0.2s ease;

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

.sidebar-item__avatar {
  min-width: 40px !important;
}

// Mini mode — ต้องใช้ :deep ทั้งหมด
:deep(.q-drawer--mini) {
  .q-drawer__content {
    overflow-x: hidden;
  }

  .q-list {
    padding: 8px 0 !important;
  }

  .q-item {
    width: 48px !important;
    height: 48px !important;
    min-height: 48px !important;
    padding: 0 !important;
    margin: 0 auto 6px auto !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .q-item__section--avatar {
    min-width: 0 !important;
    padding-right: 0 !important;
    width: auto !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }

  .q-item__section--main {
    display: none !important;
  }
}
</style>
