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

const { t } = useI18n();

const translatedText = computed(() => {
  return t('home.examRules.errorBanner', { email: 'li@go.buu.ac.th' });
});
</script>

<style scoped>
.voucher-error-banner {
  background: var(--q-negative);
  border-radius: 12px;
}
.voucher-error-banner :deep(a) {
  color: white;
  text-decoration: underline;
}
</style>
