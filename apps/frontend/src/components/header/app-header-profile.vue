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
      <q-avatar size="48px" class="app-header-profile__avatar">
        <ImageDisplay
          :image-path="userStore.currentUser?.userImagePath"
          width="100%"
          height="100%"
          border-radius="50%"
        />
      </q-avatar>

      <!-- Profile Dropdown Card -->
      <q-menu anchor="bottom end" self="top end" :offset="[0, 8]" class="profile-dropdown">
        <div class="profile-card">
          <!-- Profile Header: Centered Avatar + Name + Role -->
          <div class="profile-card__header">
            <q-avatar size="84px" class="profile-card__avatar q-mb-sm">
              <ImageDisplay
                :image-path="userStore.currentUser?.userImagePath"
                width="100%"
                height="100%"
                border-radius="50%"
              />
            </q-avatar>
            <div class="profile-card__name">{{ displayName }}</div>
            <div class="profile-card__role">{{ displayRole }}</div>
          </div>

          <q-separator />

          <!-- Role Switcher: มากกว่า 1 บทบาท หรือชุดพรีวิวของ admin -->
          <template v-if="userStore.canSwitchRole">
            <div class="profile-card__switch-label">{{ $t('profile.switchRole') }}</div>
            <div class="profile-card__switch-select" @click.stop>
              <AppSelect
                :model-value="userStore.userRole"
                :options="roleOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                dense
                outlined
                dropdown-icon="keyboard_arrow_down"
                class="profile-card__role-select"
                popup-content-class="profile-role-select-menu"
                @update:model-value="onSwitchRole($event as UserRole)"
              />
            </div>
            <q-separator />
          </template>

          <!-- Actions -->
          <q-list class="profile-card__actions">
            <q-item
              v-if="canEditProfile"
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
import ImageDisplay from 'src/components/base/image-display.vue';
import AppSelect from 'src/components/base/app-select.vue';
import { getDefaultRouteForRole } from 'src/utils/default-route';
import { ROLES } from 'src/constants/roles';
import type { UserRole } from 'src/types/user';

const userStore = useUserStore();
const router = useRouter();
const i18n = useI18n();

/** ผู้สมัครเท่านั้นที่แก้ข้อมูลส่วนตัวได้ — บุคลากร (loginBuu) ไม่มีเมนูนี้ */
const canEditProfile = computed(
  () => !userStore.isPersonnelActor && userStore.effectiveRoles.includes(ROLES.CANDIDATE),
);

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

const displayRole = computed(() => {
  void i18n.locale.value;
  const role = userStore.userRole;
  if (!role) return '';
  const roleKey = `roles.${role}`;
  return i18n.te(roleKey) ? i18n.t(roleKey) : role;
});

const roleOptions = computed(() => {
  void i18n.locale.value;
  return userStore.switchableRoles.map((role) => {
    const roleKey = `roles.${role}`;
    return {
      label: i18n.te(roleKey) ? String(i18n.t(roleKey)) : role,
      value: role,
    };
  });
});

const goToEditProfile = async (): Promise<void> => {
  await router.push({ name: 'user-profile' });
};

const onSwitchRole = async (role: UserRole): Promise<void> => {
  await userStore.switchActiveRole(role);
  const route = getDefaultRouteForRole(role);
  await router.push(route);
};

const onLogout = async (): Promise<void> => {
  userStore.logout();
  await router.push({ name: 'login' });
};
</script>

<style scoped lang="scss">
.app-header-profile__avatar,
.profile-card__avatar {
  img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    display: block;
  }
}

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

.app-header-profile__text {
  min-width: 150px;
}

.app-header-profile__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header-profile__role {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-regular);
  color: var(--text-muted);
  line-height: 1.3;
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

.profile-card__name {
  font-size: var(--font-size-md);
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
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  color: var(--text-secondary);
  margin-top: 2px;
  text-align: center;
}

.profile-card__switch-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 16px 4px;
}

.profile-card__switch-select {
  padding: 4px 16px 12px;
}

.profile-card__role-select {
  width: 100%;
}

/* ยกเลิกเพดาน 200px ของ AppSelect — บทบาทที่ถือจริงต้องเห็นครบโดยไม่ถูกตัด */
.app-select-menu.profile-role-select-menu {
  max-height: 480px !important;
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
  font-size: var(--font-size-md);
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
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: #ef4444;
}
</style>
