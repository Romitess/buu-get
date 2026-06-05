<template>
  <header class="app-header">
    <div class="app-header__inner">
      <!-- Left: Logo -->
      <router-link to="/" class="app-header__logo-link">
        <img :src="logoSrc" alt="BUU-GET Logo" class="app-header__logo" />
      </router-link>

      <!-- Center: Navigation Links (Desktop) -->
      <q-space />
      <nav class="app-header__nav" v-if="!$q.screen.lt.md">
        <router-link
          v-for="link in navLinks"
          :key="link.name"
          :to="link.path"
          class="app-header__nav-link"
          :class="{ 'app-header__nav-link--active': isActiveRoute(link) }"
        >
          {{ link.label }}
        </router-link>
      </nav>
      <q-space />

      <!-- Right: Auth Actions -->
      <div class="app-header__actions">
        <!-- Desktop Language Switcher -->
        <LanguageSwitcher v-if="!$q.screen.lt.md" />

        <!-- Logged In State -->
        <template v-if="userStore.isLoggedIn">
          <AppHeaderProfile />
        </template>

        <!-- Not Logged In State -->
        <template v-else>
          <router-link to="/login" class="app-header__login-link">
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

      <!-- Mobile: Hamburger Menu -->
      <q-btn
        v-if="$q.screen.lt.md"
        flat
        dense
        round
        icon="menu"
        class="app-header__hamburger"
        @click="mobileMenuOpen = !mobileMenuOpen"
      />
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
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import type { NavigationItem } from 'src/types/navigation';
import headerLogo from 'src/assets/img/header-buu-get-logo.png';

// Components
import AppHeaderProfile from './app-header-profile.vue';
import LanguageSwitcher from './language-switcher.vue';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

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
      if (role === ROLES.EXAM_OPERATIONS_OFFICER || role === ROLES.ADMIN) {
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
    }

    // === Staff-specific: Dashboard ===
    if (role === ROLES.ADMIN || role === ROLES.STAFF) {
      links.push({
        name: 'admin-dashboard',
        label: t('navigation.dashboard'),
        icon: 'dashboard',
        path: '/admin/dashboard',
      });
    }

    // === Finance-specific: Payment Import ===
    if (role === ROLES.ADMIN || role === ROLES.FINANCE) {
      links.push({
        name: 'admin-payment-import',
        label: t('navigation.paymentImport'),
        icon: 'payments',
        path: '/admin/payment-import',
      });
    }
  } else {
    // === Guest Navigation ===
    links.push({
      name: 'exam-info',
      label: t('navigation.examSchedule'),
      icon: 'quiz',
      path: '/user/exam-schedule',
      children: [
        {
          name: 'exam-schedule-guest',
          label: t('navigation.viewSchedule'),
          icon: 'event',
          path: '/user/exam-schedule',
        },
      ],
    });
  }

  return links;
});

/**
 * Check if a nav link is currently active
 */
const isActiveRoute = (link: NavigationItem): boolean => {
  if (link.path === '/' && route.path === '/') return true;
  if (link.path !== '/' && route.path.startsWith(link.path)) return true;

  // Check children too
  if (link.children) {
    return link.children.some((child) => route.path.startsWith(child.path));
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
  position: sticky;
  top: 0;
  background-color: var(--surface-header);
  z-index: 2000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.app-header__inner {
  display: flex;
  align-items: center;
  height: var(--header-height);
  padding: 0 32px;
  gap: 8px;
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
}

.app-header__nav-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  font-size: var(--font-size-sm);
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
  gap: 16px;
  flex-shrink: 0;
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
}

// === Mobile Drawer ===
.app-header__hamburger {
  color: var(--text-primary);
  margin-left: 8px;
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
