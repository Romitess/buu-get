<template>
  <q-footer v-if="isVisible" class="candidate-bottom-nav">
    <div class="bottom-nav-privacy">
      <router-link :to="{ name: 'privacy-notice' }" class="privacy-notice-link">
        {{ t('privacyNotice.button') }}
      </router-link>
    </div>
    <div class="bottom-nav-glass">
      <q-tabs
        v-model="activeTab"
        dense
        active-color="primary"
        indicator-color="transparent"
        class="bottom-tabs"
      >
        <q-route-tab
          name="home"
          icon="home"
          :label="$t('navigation.home')"
          to="/"
          exact
          class="bottom-tab"
        />
        <q-route-tab
          name="exam-schedule"
          icon="list_alt"
          :label="t('navigation.examScheduleShort')"
          to="/user/exam-schedule"
          class="bottom-tab"
        />
        <q-route-tab
          v-if="isCandidate"
          name="exam-history"
          icon="history"
          :label="t('navigation.examHistoryShort')"
          to="/user/exam-history"
          class="bottom-tab"
        />
        <q-route-tab
          v-if="isCandidate"
          name="profile"
          icon="person"
          :label="t('navigation.profileShort')"
          to="/user/profile"
          class="bottom-tab"
        />
        <q-route-tab
          v-if="!isCandidate"
          name="login"
          icon="login"
          :label="$t('auth.login')"
          to="/login"
          class="bottom-tab"
        />
      </q-tabs>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import { useNavigation } from 'src/composables/use-navigation';

const $q = useQuasar();
const route = useRoute();
const { t } = useI18n();
const userStore = useUserStore();
const { showAdminDrawer } = useNavigation();

const activeTab = ref('home');

const isCandidate = computed(() => {
  return userStore.isLoggedIn && userStore.userRole === ROLES.CANDIDATE;
});

const isVisible = computed(() => {
  return (
    $q.screen.lt.md &&
    !showAdminDrawer.value &&
    !route.meta.hideHeader &&
    !route.meta.hideDrawer
  );
});
</script>

<style scoped lang="scss">
.candidate-bottom-nav {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 12px calc(10px + env(safe-area-inset-bottom, 0px));
}

.bottom-nav-privacy {
  display: flex;
  justify-content: center;
  padding-bottom: 6px;
}

.privacy-notice-link {
  color: var(--text-secondary, #5c6b7a);
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.4;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}

.bottom-nav-glass {
  border-radius: 22px;
  background: rgba(245, 249, 255, 0.62);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border: 1px solid rgba(13, 71, 161, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 8px 28px rgba(13, 71, 161, 0.14);
  overflow: hidden;
}

.bottom-tabs {
  min-height: 56px;
  background: transparent;
  color: var(--text-muted, #9a9a9a);
}

.bottom-tab {
  min-height: 48px;
  font-size: 11px !important;
  text-transform: none;
  color: var(--text-muted, #9a9a9a) !important;
  opacity: 0.55;
  border-radius: 14px;
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
    background 220ms cubic-bezier(0.16, 1, 0.3, 1),
    color 220ms cubic-bezier(0.16, 1, 0.3, 1);

  :deep(.q-tab__icon),
  :deep(.q-tab__label),
  :deep(.q-icon) {
    color: inherit;
  }

  :deep(.q-tab__icon) {
    font-size: 22px;
  }

  :deep(.q-tab__label) {
    font-size: 11px;
    line-height: 1.2;
    margin-top: 2px;
    font-weight: 500;
  }

  :deep(.q-tab__indicator) {
    display: none;
  }

  &:active {
    transform: scale(0.98);
  }

  &.q-tab--active,
  &.q-router-link--active {
    opacity: 1;
    color: var(--primary, #0d47a1) !important;
    background: rgba(13, 71, 161, 0.12);

    :deep(.q-tab__label) {
      font-weight: 600;
    }
  }
}

@media (prefers-reduced-transparency: reduce) {
  .bottom-nav-glass {
    background: rgba(245, 249, 255, 0.96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-tab {
    transition: none;

    &:active {
      transform: none;
    }
  }
}
</style>
