<template>
  <q-banner dense class="voucher-error-banner text-white q-pa-md q-mt-xl">
    <template v-slot:avatar>
      <q-icon name="error_outline" color="white" size="sm" />
    </template>
    <div class="text-body2 text-weight-medium">
      {{ translatedText }}
    </div>
  </q-banner>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { SUPPORT_CONTACT } from 'src/constants/support';

const { t } = useI18n();

const translatedText = computed(() => {
  return t('home.examRules.errorBanner', { email: SUPPORT_CONTACT.EMAIL });
});
</script>

<style scoped>
.voucher-error-banner {
  background: var(--q-negative);
  border-radius: 12px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 10px rgba(var(--q-negative), 0.2);
}
.voucher-error-banner :deep(a) {
  color: white;
  text-decoration: underline;
}
</style>
