<template>
  <q-page class="thaid-callback-page flex flex-center q-pa-lg">
    <q-card flat bordered class="thaid-callback-card q-pa-lg">
      <div class="column items-center text-center">
        <q-spinner v-if="isExchanging" color="primary" size="56px" />
        <q-icon v-else :name="iconName" :color="iconColor" size="56px" />
        <h1 class="text-h6 q-mt-md q-mb-sm">{{ title }}</h1>
        <p class="text-body2 text-grey-7 q-mb-lg">{{ body }}</p>
        <q-btn
          v-if="!isExchanging && !showReceivedDialog && showProfileReturn"
          unelevated
          no-caps
          color="primary"
          :to="{ name: 'user-profile' }"
          :label="t('auth.thaidCallback.backToProfile')"
        />
        <q-btn
          v-else-if="!isExchanging && !showReceivedDialog"
          unelevated
          no-caps
          color="primary"
          :to="{ name: 'login' }"
          :label="t('auth.thaidCallback.backToLogin')"
        />
      </div>
    </q-card>

    <q-dialog v-model="showReceivedDialog" persistent>
      <q-card class="received-dialog">
        <q-card-section>
          <div class="text-h6">{{ t('auth.thaidCallback.receivedTitle') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div v-for="row in receivedRows" :key="row.label" class="received-row">
            <span class="received-label">{{ row.label }}</span>
            <span class="received-value">{{ row.value }}</span>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn
            unelevated
            no-caps
            color="primary"
            :loading="isContinuing"
            :label="t('auth.thaidCallback.receivedContinue')"
            @click="continueAfterDialog"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  type ThaidPrefillFields,
  type ThaidSessionResult,
} from 'src/services/thaid.service';
import { useUserStore } from 'src/stores/user.store';
import { getDefaultRouteForRole } from 'src/utils/default-route';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const $q = useQuasar();
const userStore = useUserStore();

const isExchanging = ref(false);
const isContinuing = ref(false);
const showReceivedDialog = ref(false);
const pendingResult = ref<ThaidSessionResult | null>(null);
const status = ref<ThaidCallbackStatus>(parseThaidCallbackStatus(route.query.status));

const showProfileReturn = computed(
  () =>
    status.value === 'mismatch' ||
    ((status.value === 'denied' || status.value === 'error') && userStore.isLoggedIn),
);

const iconName = computed(() => {
  const icons: Record<ThaidCallbackStatus, string> = {
    success: 'check_circle',
    denied: 'highlight_off',
    error: 'error_outline',
    unknown: 'help_outline',
    mismatch: 'error_outline',
  };
  return icons[status.value];
});

const iconColor = computed(() => {
  const colors: Record<ThaidCallbackStatus, string> = {
    success: 'positive',
    denied: 'warning',
    error: 'negative',
    unknown: 'grey-7',
    mismatch: 'negative',
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

const receivedRows = computed(() => {
  const fields = receivedFields(pendingResult.value);
  const display = (value: string | undefined): string => {
    const trimmed = value?.trim() ?? '';
    return trimmed === '' ? t('auth.thaidCallback.receivedEmpty') : trimmed;
  };
  return [
    { label: t('auth.thaidCallback.receivedNationalId'), value: display(fields?.nationalId) },
    { label: t('auth.thaidCallback.receivedTitleTh'), value: display(fields?.titleTH) },
    { label: t('auth.thaidCallback.receivedTitleEn'), value: display(fields?.titleEN) },
    { label: t('auth.thaidCallback.receivedFullName'), value: display(fields?.fullName) },
    { label: t('auth.thaidCallback.receivedEnglishName'), value: display(fields?.englishName) },
    { label: t('auth.thaidCallback.receivedBirthdate'), value: display(fields?.birthdate) },
    { label: t('auth.thaidCallback.receivedAddress'), value: display(fields?.address) },
  ];
});

function receivedFields(result: ThaidSessionResult | null): ThaidPrefillFields | null {
  if (!result) {
    return null;
  }
  if (result.outcome === 'prefill') {
    return result.prefill;
  }
  if (result.outcome === 'updated') {
    return result.received;
  }
  return result.received ?? null;
}

async function continueAfterDialog(): Promise<void> {
  const result = pendingResult.value;
  if (!result || isContinuing.value) {
    return;
  }
  isContinuing.value = true;
  showReceivedDialog.value = false;
  try {
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

    if (result.outcome === 'updated') {
      await userStore.refreshProfile();
      $q.notify({
        type: 'positive',
        message: t('auth.thaidCallback.profileUpdated'),
        position: 'top',
      });
      await router.replace({ name: 'user-profile' });
      return;
    }

    storeThaidPrefill(result);
    await router.replace({ name: 'register' });
  } catch {
    isContinuing.value = false;
    showReceivedDialog.value = true;
    status.value = 'error';
  }
}

onMounted(async () => {
  const rawTicket = route.query.ticket;
  const ticket = Array.isArray(rawTicket) ? rawTicket[0] : rawTicket;
  if (typeof ticket !== 'string' || ticket.length === 0) {
    return;
  }

  isExchanging.value = true;
  try {
    const result = await exchangeThaidTicket(ticket);
    if (result.outcome === 'updated') {
      await userStore.refreshProfile();
      $q.notify({
        type: 'positive',
        message: t('auth.thaidCallback.profileUpdated'),
        position: 'top',
      });
      await router.replace({ name: 'user-profile' });
      return;
    }
    pendingResult.value = result;
    status.value = 'success';
    isExchanging.value = false;
    showReceivedDialog.value = true;
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

.received-dialog {
  width: 100%;
  max-width: 480px;
  border-radius: 16px;
}

.received-row {
  display: grid;
  grid-template-columns: minmax(120px, 148px) 1fr;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--q-grey-3);
}

@media (max-width: 480px) {
  .received-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}

.received-row:last-child {
  border-bottom: none;
}

.received-label {
  color: var(--q-grey-7);
  font-size: 14px;
}

.received-value {
  font-weight: 600;
  word-break: break-word;
}
</style>
