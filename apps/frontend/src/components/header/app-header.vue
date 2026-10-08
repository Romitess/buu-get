<template>
  <q-header class="app-header bg-white text-black">
    <div class="app-header__inner">
      <!-- Left: Hamburger & Logo -->
      <div
        class="row items-center no-wrap app-header__left"
        :class="{ 'app-header__left--admin': showAdminDrawer && !$q.screen.lt.md }"
      >
        <div v-if="showAdminDrawer && !$q.screen.lt.md" class="app-header__hamburger-container">
          <q-btn
            flat
            dense
            round
            icon="menu"
            class="app-header__hamburger-btn"
            @click="handleHamburgerClick"
          />
        </div>
        <!-- Mobile staff only: toggle left sidebar. Candidates/guests use bottom nav. -->
        <q-btn
          v-else-if="showAdminDrawer && $q.screen.lt.md"
          flat
          dense
          round
          icon="menu"
          class="app-header__hamburger q-mr-sm"
          @click="handleHamburgerClick"
        />
        <router-link to="/" class="app-header__logo-link">
          <img :src="logoSrc" alt="BUU-GET Logo" class="app-header__logo" />
        </router-link>
      </div>

      <!-- Center: Navigation Links (Desktop) -->
      <nav class="app-header__nav" v-if="!$q.screen.lt.md && !showAdminDrawer">
        <template v-for="link in navLinks" :key="link.name">
          <!-- Dropdown link if has children -->
          <div
            v-if="link.children && link.children.length > 0"
            class="app-header__nav-link app-header__nav-link--dropdown"
            :class="{
              'app-header__nav-link--active': isActiveRoute(link),
              [`app-header__nav-link--${link.name}`]: true,
            }"
          >
            <span>{{ link.label }}</span>
            <q-icon name="expand_more" size="16px" class="q-ml-xs" />

            <q-menu
              auto-close
              anchor="bottom left"
              self="top left"
              :offset="[0, 8]"
              class="nav-dropdown"
            >
              <q-list style="min-width: 220px">
                <q-item
                  v-for="child in link.children"
                  :key="child.name"
                  clickable
                  :to="child.path"
                  class="nav-dropdown__item"
                  :active="route.path === child.path"
                  active-class="nav-dropdown__item--active"
                >
                  <q-item-section>{{ child.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>

          <!-- Normal link if no children -->
          <router-link
            v-else
            :to="link.path ?? '/'"
            class="app-header__nav-link"
            :class="{
              'app-header__nav-link--active': isActiveRoute(link),
              [`app-header__nav-link--${link.name}`]: true,
            }"
          >
            {{ link.label }}
          </router-link>
        </template>
      </nav>

      <!-- Right: Auth Actions -->
      <div class="app-header__actions">
        <LanguageSwitcher />

        <!-- Logged In State -->
        <template v-if="userStore.isLoggedIn">
          <AppHeaderNotifications v-if="isFinanceOfficer" />
          <AppHeaderProfile />
        </template>

        <!-- Not Logged In State -->
        <template v-else>
          <router-link
            v-if="!$q.screen.lt.md"
            to="/login"
            class="app-header__login-link"
          >
            {{ $t('auth.login') }}
          </router-link>
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="$t('profile.register')"
            to="/register"
            class="app-header__register-btn"
          />
        </template>
      </div>

      <!-- Mobile: Hamburger Menu removed, moved to the left -->
    </div>

    <!-- Subtle shadow bottom border -->

    <!-- Mobile Navigation Drawer -->
    <q-drawer
      v-model="mobileMenuOpen"
      side="right"
      overlay
      behavior="mobile"
      bordered
      class="app-header__mobile-drawer"
    >
      <q-list>
        <q-item-label header class="text-weight-bold text-body1">{{
          $t('navigation.menu')
        }}</q-item-label>
        <q-separator />

        <q-item
          v-for="link in navLinks"
          :key="link.name"
          clickable
          :to="link.path"
          @click="mobileMenuOpen = false"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section>{{ link.label }}</q-item-section>
        </q-item>

        <!-- Mobile: show children flat -->
        <template v-for="link in navLinks" :key="`children-${link.name}`">
          <q-item
            v-for="child in link.children || []"
            :key="child.name"
            clickable
            :to="child.path"
            class="q-pl-xl"
            @click="mobileMenuOpen = false"
          >
            <q-item-section avatar>
              <q-icon :name="child.icon" />
            </q-item-section>
            <q-item-section>{{ child.label }}</q-item-section>
          </q-item>
        </template>

        <q-separator class="q-my-sm" />

        <!-- Mobile Language Selector -->
        <q-item clickable @click="toggleLanguage">
          <q-item-section avatar>
            <q-icon name="language" />
          </q-item-section>
          <q-item-section>
            <div class="row items-center justify-between">
              <span>{{ $t('navigation.language') }}</span>
              <q-badge outline color="primary" class="q-ml-sm text-weight-bold">
                {{ locale === 'th' ? 'TH' : 'EN' }}
              </q-badge>
            </div>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-sm" />

        <!-- Mobile Auth -->
        <template v-if="userStore.isLoggedIn">
          <q-item clickable @click="logout">
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>{{ $t('navigation.logout') }}</q-item-section>
          </q-item>
        </template>
        <template v-else>
          <q-item clickable to="/login" @click="mobileMenuOpen = false">
            <q-item-section avatar>
              <q-icon name="login" />
            </q-item-section>
            <q-item-section>{{ $t('auth.login') }}</q-item-section>
          </q-item>
          <q-item clickable to="/register" @click="mobileMenuOpen = false">
            <q-item-section avatar>
              <q-icon name="person_add" color="primary" />
            </q-item-section>
            <q-item-section class="text-primary text-weight-bold">{{
              $t('profile.register')
            }}</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>
  </q-header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import type { NavigationItem } from 'src/types/navigation';
import headerLogo from 'src/assets/img/header-buu-get-logo.png';
import { useNavigation } from 'src/composables/use-navigation';

// Components
import AppHeaderProfile from './app-header-profile.vue';
import AppHeaderNotifications from './app-header-notifications.vue';
import LanguageSwitcher from './language-switcher.vue';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { showAdminDrawer, toggleLeftDrawer } = useNavigation();

const isFinanceOfficer = computed(() => userStore.hasEffectiveRole(ROLES.FINANCE));

const handleHamburgerClick = () => {
  if (showAdminDrawer.value) {
    toggleLeftDrawer();
  } else {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  }
};

const toggleLanguage = (): void => {
  const nextLocale = locale.value === 'th' ? 'en-US' : 'th';
  locale.value = nextLocale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('user-locale', nextLocale);
  }
};

// Logo source — dynamic import, no hardcoding
const logoSrc = headerLogo;

// Mobile menu state
const mobileMenuOpen = ref(false);

/**
 * Navigation links — role-based, derived from routes.ts structure
 */
const navLinks = computed<NavigationItem[]>(() => {
  const links: NavigationItem[] = [];

  // Always show "หน้าหลัก"
  links.push({
    name: 'home',
    label: t('navigation.home'),
    icon: 'home',
    path: '/',
  });

  if (userStore.isLoggedIn && userStore.userRole) {
    const role = userStore.userRole;

    if (
      userStore.userRoles.includes(ROLES.SUPER_ADMIN) &&
      (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN)
    ) {
      links.push({
        name: 'admin-candidate-accounts',
        label: t('navigation.candidateAccounts'),
        icon: 'manage_accounts',
        path: '/admin/candidate-accounts',
      });
    }

    // === Candidate Navigation ===
    if (role === ROLES.CANDIDATE) {
      links.push({
        name: 'exam-menu',
        label: t('navigation.examSchedule'),
        icon: 'quiz',
        path: '/user/exam-schedule',
      });
      links.push({
        name: 'exam-history',
        label: t('navigation.examHistory'),
        icon: 'history',
        path: '/user/exam-history',
      });
    }

    // === Admin / Staff / Registration Officer Navigation ===
    if (
      role === ROLES.ADMIN ||
      role === ROLES.STAFF ||
      role === ROLES.REGISTRATION_OFFICER ||
      role === ROLES.EXAM_OPERATIONS_OFFICER
    ) {
      if (role === ROLES.REGISTRATION_OFFICER || role === ROLES.ADMIN) {
        links.push({
          name: 'admin-location-management',
          label: t('navigation.manageLocations'),
          icon: 'room',
          path: '/admin/location-management',
        });
      }
      links.push({
        name: 'admin-exam-management',
        label: t('navigation.manageExams'),
        icon: 'edit_document',
        path: '/admin/exam-management',
      });
      if (role === ROLES.ADMIN || role === ROLES.STAFF || role === ROLES.EXAM_OPERATIONS_OFFICER) {
        links.push({
          name: 'admin-test-voucher-management',
          label: t('navigation.manageTestVoucher'),
          icon: 'confirmation_number',
          path: '/admin/test-voucher-management',
        });
      }
      if (role === ROLES.ADMIN || role === ROLES.STAFF || role === ROLES.EXAM_OPERATIONS_OFFICER) {
        links.push(
          {
            name: 'admin-score-rubric-management',
            label: t('navigation.manageScoreRubrics'),
            icon: 'fact_check',
            path: '/admin/score-rubric-management',
          },
          {
            name: 'admin-score-criteria-management',
            label: t('navigation.manageBandCertificate'),
            icon: 'grade',
            path: '/admin/score-criteria-management',
          },
        );
      }
    }

    // === Staff/Executive-specific: Dashboard ===
    if (role === ROLES.ADMIN || role === ROLES.STAFF || role === ROLES.EXECUTIVE) {
      links.push({
        name: 'admin-dashboard',
        label: t('navigation.dashboard'),
        icon: 'dashboard',
        path: '/admin/dashboard',
      });
    }

    // === Finance-specific: Payment Import & Reports ===
    if (role === ROLES.ADMIN || role === ROLES.FINANCE) {
      links.push(
        {
          name: 'admin-payment-import',
          label: t('navigation.paymentImport'),
          icon: 'payments',
          path: '/admin/payment-import',
        },
        {
          name: 'admin-payment-import-test-export',
          label: t('navigation.paymentImportTestExport'),
          icon: 'download',
          path: '/admin/payment-import-test-export',
        },
        {
          name: 'admin-fund-source-management',
          label: t('navigation.fundSourceManagement'),
          icon: 'account_balance',
          path: '/admin/fund-source-management',
        },
      );
      links.push({
        name: 'admin-reports',
        label: t('navigation.reports'),
        icon: 'bar_chart',
        path: '',
        children: [
          {
            name: 'admin-daily-revenue-report',
            label: t('navigation.dailyRevenueReport'),
            icon: 'request_quote',
            path: '/admin/daily-revenue-report',
          },
          {
            name: 'admin-receipt-usage-report',
            label: t('navigation.receiptUsageReport'),
            icon: 'receipt',
            path: '/admin/receipt-usage-report',
          },
          {
            name: 'admin-application-fee-report',
            label: t('navigation.applicationFeeReport'),
            icon: 'summarize',
            path: '/admin/application-fee-report',
          },
        ],
      });
    }
  } else {
    // === Guest Navigation ===
    links.push({
      name: 'exam-schedule-guest',
      label: t('navigation.viewSchedule'),
      icon: 'event',
      path: '/user/exam-schedule',
    });
  }

  return links;
});

/**
 * Check if a nav link is currently active
 */
const isActiveRoute = (link: NavigationItem): boolean => {
  if (link.path === '/' && route.path === '/') return true;
  if (link.path && link.path !== '/' && route.path.startsWith(link.path)) return true;

  // Check children too
  if (link.children) {
    return link.children.some((child) => child.path && route.path.startsWith(child.path));
  }
  return false;
};

/**
 * Logout handler
 */
const logout = async () => {
  userStore.logout();
  mobileMenuOpen.value = false;
  await router.push({ name: 'login' });
};
</script>

<style scoped lang="scss">
.app-header {
  background-color: var(--surface-header);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.app-header__inner {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 32px;
  gap: 8px;
  position: relative;
}

// === Logo ===
.app-header__logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
}

.app-header__logo {
  height: 36px;
  width: auto;
  object-fit: contain;
}

// === Navigation ===
.app-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.app-header__nav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px 16px;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: var(--primary);
    background-color: var(--neutral-50);
  }

  &--active {
    color: var(--primary);
    font-weight: var(--font-weight-semibold);
  }

  // Stable min-widths for each menu item to prevent layout shift on translation
  &--home {
    min-width: 80px;
  }
  &--exam-menu {
    min-width: 140px;
  }
  &--exam-history {
    min-width: 140px;
  }
  &--admin-location-management {
    min-width: 160px;
  }
  &--admin-exam-management {
    min-width: 140px;
  }
  &--admin-test-voucher-management {
    min-width: 190px;
  }
  &--admin-score-criteria-management {
    min-width: 200px;
  }
  &--admin-dashboard {
    min-width: 120px;
  }
  &--admin-payment-import {
    min-width: 180px;
  }
  &--admin-fund-source-management {
    min-width: 210px;
  }
  &--admin-reports {
    min-width: 100px;
  }
  &--exam-schedule-guest {
    min-width: 130px;
  }
}

.app-header__dropdown-item {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  color: var(--text-primary);

  &:hover {
    background-color: var(--neutral-50);
  }
}

// === Right side: Auth actions ===
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

// --- Not Logged-in ---
.app-header__login-link {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
  min-width: 80px;
  text-align: center;
  display: inline-flex;
  justify-content: center;
  align-items: center;

  &:hover {
    color: var(--primary);
    background-color: var(--neutral-50);
  }
}

.app-header__register-btn {
  font-size: var(--font-size-sm) !important;
  font-weight: var(--font-weight-semibold) !important;
  border-radius: var(--radius-sm) !important;
  padding: 6px 20px !important;
  letter-spacing: 0;
  min-width: 120px;
}

// === Mobile Drawer & Hamburger Button Alignment ===
.app-header__left {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  position: relative;
  height: 100%;

  &--admin {
    margin-left: -32px; // Offset the header padding to start at 0px
    padding-left: 72px; // Make space for the absolute hamburger container
  }
}

.app-header__hamburger-container {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 72px; // Matches the mini-drawer width exactly
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.app-header__logo-link {
  margin-left: 24px;
}

.app-header__hamburger {
  color: var(--text-primary);
  margin-left: 8px;
}

.app-header__hamburger-btn {
  color: var(--text-primary);
}

// === Mobile Drawer ===
.app-header__mobile-drawer {
  :deep(.q-drawer__content) {
    background: var(--surface-card);
  }
}

// === Responsive ===
@media (max-width: 599px) {
  .app-header__inner {
    padding: 0 16px;
  }

  .app-header__logo {
    height: 28px;
  }
}
</style>

<style lang="scss">
.nav-dropdown {
  border-radius: var(--radius-md) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--neutral-200);
  overflow: hidden;
}

.nav-dropdown__item {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  color: var(--text-primary);
  min-height: 40px;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background-color: var(--neutral-50);
    color: var(--primary);
  }

  &--active {
    color: var(--primary);
    font-weight: var(--font-weight-semibold);
    background-color: var(--neutral-50);
  }
}
</style>
