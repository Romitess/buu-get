<template>
  <div class="app-header-profile row items-center no-wrap">
    <!-- Trigger: Avatar + Name/Role (Desktop) -->
    <div class="app-header-profile__trigger row items-center no-wrap">
      <div class="app-header-profile__text text-right q-mr-sm" v-if="!$q.screen.lt.sm">
        <div class="app-header-profile__name">
          {{ displayName }}
        </div>
        <div class="app-header-profile__role">
          {{ displayRole }}
        </div>
      </div>
      <q-avatar size="36px" class="app-header-profile__avatar">
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
                <q-item-label class="profile-card__action-label">
                  {{ $t('profile.pageTitleEdit') }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-close-popup
              class="profile-card__action-item profile-card__action-item--logout"
              @click="onLogout"
            >
              <q-item-section avatar>
                <q-icon name="logout" size="20px" class="profile-card__logout-icon" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="profile-card__logout-label">
                  {{ $t('navigation.logout') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import { ROLE_LABELS } from 'src/constants/roles';

const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

/**
 * Display name — use Thai full name if available, else use username from email
 */
const displayName = computed(() => {
  const user = userStore.currentUser;
  if (!user) return '';

  if (user.fullNameTH) return user.fullNameTH;
  if (user.fullNameEN) return user.fullNameEN;

  if (user.email) {
    return user.email.split('@')[0];
  }

  return '';
});

/**
 * Display role — translate role key dynamically using active locale
 */
const displayRole = computed(() => {
  const role = userStore.userRole;
  if (!role) return '';
  return t(`roles.${role}`) || ROLE_LABELS[role] || role;
});

/**
 * Navigate to edit profile page
 */
const goToEditProfile = () => {
  // TODO: Connect to actual edit profile route later
  console.log('Navigate to edit profile — not connected yet');
};

/**
 * Logout handler
 */
const onLogout = async () => {
  userStore.logout();
  await router.push({ name: 'login' });
};
</script>

<style scoped lang="scss">
.app-header-profile {
  height: 100%;
}

.app-header-profile__trigger {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--neutral-50);
  }
}

.app-header-profile__name {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header-profile__role {
  font-size: 11px;
  font-weight: var(--font-weight-regular);
  color: var(--text-muted);
  line-height: 1.3;
}

.app-header-profile__avatar {
  border: 2px solid var(--neutral-200);
}
</style>

<style lang="scss">
// Unscoped styles for q-menu portal
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
