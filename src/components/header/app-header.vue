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
          <!-- Dropdown arrow for items with children -->
          <q-icon
            v-if="link.children && link.children.length > 0"
            name="expand_more"
            size="18px"
            class="q-ml-xs"
          />

          <!-- Dropdown menu for items with children -->
          <q-menu v-if="link.children && link.children.length > 0" auto-close>
            <q-list style="min-width: 200px">
              <q-item
                v-for="child in link.children"
                :key="child.name"
                clickable
                :to="child.path"
                class="app-header__dropdown-item"
              >
                <q-item-section>{{ child.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </router-link>
      </nav>
      <q-space />

      <!-- Right: Auth Actions -->
      <div class="app-header__actions">
        <!-- Logged In State -->
        <template v-if="userStore.isLoggedIn">
          <div class="app-header__user-info row items-center no-wrap">
            <div class="app-header__user-text text-right q-mr-sm">
              <div class="app-header__user-name">
                {{ displayName }}
              </div>
              <div class="app-header__user-role">
                {{ displayRole }}
              </div>
            </div>
            <q-avatar size="36px" class="app-header__avatar">
              <q-icon name="account_circle" size="36px" color="grey-5" />
            </q-avatar>

            <!-- Profile Dropdown Card -->
            <q-menu anchor="bottom end" self="top end" :offset="[0, 8]" class="profile-dropdown">
              <div class="profile-card">
                <!-- Profile Header: Centered Avatar + Name + Role -->
                <div class="profile-card__header">
                  <q-avatar size="72px" class="profile-card__avatar">
                    <q-icon name="account_circle" size="72px" color="grey-4" />
                  </q-avatar>
                  <div class="profile-card__name">{{ displayName }}</div>
                  <div class="profile-card__role">{{ displayRole }}</div>
                </div>

                <q-separator />

                <!-- Actions -->
                <q-list class="profile-card__actions">
                  <q-item
                    clickable
                    v-close-popup
                    class="profile-card__action-item"
                    @click="goToEditProfile"
                  >
                    <q-item-section avatar>
                      <q-icon name="edit" size="20px" class="profile-card__action-icon" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="profile-card__action-label">{{
                        $t('profile.pageTitleEdit')
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    v-close-popup
                    class="profile-card__action-item profile-card__action-item--logout"
                    @click="logout"
                  >
                    <q-item-section avatar>
                      <q-icon name="logout" size="20px" class="profile-card__logout-icon" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="profile-card__logout-label">{{
                        $t('navigation.logout')
                      }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </q-menu>
          </div>
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
          $t('navigation.menu') || 'เมนู'
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
import { ROLES, ROLE_LABELS } from 'src/constants/roles';
import type { NavigationItem } from 'src/types/navigation';
import headerLogo from 'src/assets/img/header-buu-get-logo.png';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

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
        children: [
          {
            name: 'exam-schedule',
            label: t('navigation.selectSession'),
            icon: 'event',
            path: '/user/exam-schedule',
          },
          {
            name: 'exam-history',
            label: t('navigation.examHistory'),
            icon: 'history',
            path: '/user/exam-history',
          },
        ],
      });
    }

    // === Admin / Staff / Registration Officer Navigation ===
    if (role === ROLES.ADMIN || role === ROLES.STAFF || role === ROLES.REGISTRATION_OFFICER) {
      links.push({
        name: 'admin-exam-management',
        label: t('navigation.manageExams'),
        icon: 'edit_document',
        path: '/admin/exam-management',
      });
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
 * Display name — use Thai full name if available, else use username from email
 */
const displayName = computed(() => {
  const user = userStore.currentUser;
  if (!user) return '';

  if (user.fullNameTH) return user.fullNameTH;
  if (user.fullNameEN) return user.fullNameEN;

  if (user.email) {
    // Show just the username part instead of the full email
    return user.email.split('@')[0];
  }

  return '';
});

/**
 * Display role — translate role key to Thai label
 */
const displayRole = computed(() => {
  const role = userStore.userRole;
  if (!role) return '';
  return ROLE_LABELS[role] || role;
});

/**
 * Navigate to edit profile page (placeholder — not connected yet)
 */
const goToEditProfile = () => {
  // TODO: Connect to actual edit profile route later
  console.log('Navigate to edit profile — not connected yet');
};

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

// --- Logged-in User Info ---
.app-header__user-info {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--neutral-50);
  }
}

.app-header__user-name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__user-role {
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  color: var(--text-muted);
  line-height: 1.3;
}

.app-header__avatar {
  border: 2px solid var(--neutral-200);
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

  .app-header__user-text {
    display: none;
  }
}
</style>

<!-- Unscoped styles for q-menu portal content (rendered outside component DOM) -->
<style lang="scss">
// ============================================================
// Profile Dropdown Card (Unscoped — q-menu renders in portal)
// ============================================================
.profile-dropdown {
  border-radius: var(--radius-md) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--neutral-200);
  overflow: hidden;
}

.profile-card {
  width: 280px;
  background: var(--surface-card);
  overflow: hidden;
}

.profile-card__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 20px;
  background: var(--surface-card);
}

.profile-card__avatar {
  border: 3px solid var(--neutral-200);
  background: #ffffff;
  margin-bottom: 12px;
}

.profile-card__name {
  font-size: 16px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1.3;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-card__role {
  font-size: 13px;
  font-weight: var(--font-weight-regular);
  color: var(--text-secondary);
  margin-top: 2px;
  text-align: center;
}

// --- Actions Section ---
.profile-card__actions {
  padding: 4px 8px 8px;
}

.profile-card__action-item {
  border-radius: var(--radius-sm);
  min-height: 46px;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--neutral-50);
  }
}

.profile-card__action-icon {
  color: var(--neutral-600);
}

.profile-card__action-label {
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.profile-card__action-item--logout {
  &:hover {
    background-color: #fef2f2;
  }
}

.profile-card__logout-icon {
  color: #ef4444;
}

.profile-card__logout-label {
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: #ef4444;
}
</style>
