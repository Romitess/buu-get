<template>
  <q-page class="thaid-callback-page flex flex-center q-pa-lg">
    <q-card flat bordered class="thaid-callback-card q-pa-lg">
      <div class="column items-center text-center">
        <q-spinner v-if="isExchanging" color="primary" size="56px" />
        <q-icon v-else :name="iconName" :color="iconColor" size="56px" />
        <h1 class="text-h6 q-mt-md q-mb-sm">{{ title }}</h1>
        <p class="text-body2 text-grey-7 q-mb-lg">{{ body }}</p>
        <q-btn
          v-if="!isExchanging"
          unelevated
          no-caps
          color="primary"
          :to="{ name: 'login' }"
          :label="t('auth.thaidCallback.backToLogin')"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import {
  parseThaidCallbackStatus,
  type ThaidCallbackStatus,
} from 'src/utils/thaid-callback-status';
import {
  exchangeThaidTicket,
  storeThaidPrefill,
} from 'src/services/thaid.service';
import { useUserStore } from 'src/stores/user.store';
import { getDefaultRouteForRole } from 'src/utils/default-route';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();
const userStore = useUserStore();

const isExchanging = ref(false);
const status = ref<ThaidCallbackStatus>(parseThaidCallbackStatus(route.query.status));

const iconName = computed(() => {
  const icons: Record<ThaidCallbackStatus, string> = {
    success: 'check_circle',
    denied: 'highlight_off',
    error: 'error_outline',
    unknown: 'help_outline',
  };
  return icons[status.value];
});

const iconColor = computed(() => {
  const colors: Record<ThaidCallbackStatus, string> = {
    success: 'positive',
    denied: 'warning',
    error: 'negative',
    unknown: 'grey-7',
  };
  return colors[status.value];
});

const title = computed(() =>
  isExchanging.value
    ? t('auth.thaidCallback.exchangingTitle')
    : t(`auth.thaidCallback.${status.value}Title`),
);
const body = computed(() =>
  isExchanging.value
    ? t('auth.thaidCallback.exchangingBody')
    : t(`auth.thaidCallback.${status.value}Body`),
);

onMounted(async () => {
  const rawTicket = route.query.ticket;
  const ticket = Array.isArray(rawTicket) ? rawTicket[0] : rawTicket;
  if (typeof ticket !== 'string' || ticket.length === 0) {
    return;
  }

  isExchanging.value = true;
  try {
    const result = await exchangeThaidTicket(ticket);
    if (result.outcome === 'login') {
      await userStore.hydrateFromLogin(result.login);
      const noticeKey =
        result.notice === 'existing_account'
          ? 'auth.thaidCallback.existingAccount'
          : 'auth.thaidCallback.signedIn';
      $q.notify({ type: 'positive', message: t(noticeKey), position: 'top' });
      await router.replace(getDefaultRouteForRole(userStore.userRole));
      return;
    }

    storeThaidPrefill(result);
    await router.replace({ name: 'register' });
  } catch {
    status.value = 'error';
    isExchanging.value = false;
  }
});
</script>

<style scoped lang="scss">
.thaid-callback-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}
</style>
