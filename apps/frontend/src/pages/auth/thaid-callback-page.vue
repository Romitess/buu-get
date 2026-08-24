<template>
  <q-page class="thaid-callback-page flex flex-center q-pa-lg">
    <q-card flat bordered class="thaid-callback-card q-pa-lg">
      <div class="column items-center text-center">
        <q-icon :name="iconName" :color="iconColor" size="56px" />
        <h1 class="text-h6 q-mt-md q-mb-sm">{{ title }}</h1>
        <p class="text-body2 text-grey-7 q-mb-lg">{{ body }}</p>
        <q-btn
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
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  parseThaidCallbackStatus,
  type ThaidCallbackStatus,
} from 'src/utils/thaid-callback-status';

const route = useRoute();
const { t } = useI18n();

const status = computed(() => parseThaidCallbackStatus(route.query.status));

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

const title = computed(() => t(`auth.thaidCallback.${status.value}Title`));
const body = computed(() => t(`auth.thaidCallback.${status.value}Body`));
</script>

<style scoped lang="scss">
.thaid-callback-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
}
</style>
