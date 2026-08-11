<template>
  <q-footer
    v-if="isVisible"
    class="candidate-bottom-nav bg-white text-dark"
    elevated
  >
    <q-tabs
      v-model="activeTab"
      dense
      active-color="primary"
      indicator-color="primary"
      class="bottom-tabs text-grey-7"
      narrow-indicator
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
  /* Override Quasar footer default (primary bg + white text) */
  background: #fff !important;
  color: var(--text-secondary, #616161) !important;
  border-top: 1px solid var(--border-color);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-tabs {
  min-height: 56px;
  background: #fff;
  color: var(--text-secondary, #616161);
}

.bottom-tab {
  min-height: 48px;
  font-size: 10px !important;
  text-transform: none;
  color: var(--text-secondary, #616161) !important;

  :deep(.q-tab__icon),
  :deep(.q-tab__label),
  :deep(.q-icon) {
    color: inherit;
  }

  :deep(.q-tab__icon) {
    font-size: 22px;
  }

  :deep(.q-tab__label) {
    font-size: 10px;
    line-height: 1.2;
    margin-top: 2px;
  }

  &.q-tab--active,
  &.q-router-link--active {
    color: var(--primary, #0d47a1) !important;
  }
}
</style>
