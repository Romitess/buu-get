<template>
  <ScrollReveal :disabled="revealDisabled">
    <q-banner dense class="voucher-notice-banner rounded-borders q-pa-md q-mt-xl">
      <template v-slot:avatar>
        <q-icon name="info" class="voucher-notice-banner__icon" size="sm" />
      </template>
      <div class="text-body2 text-weight-medium">
        {{ translatedText }}
      </div>
    </q-banner>
  </ScrollReveal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import ScrollReveal from 'src/components/base/scroll-reveal.vue';
import { SUPPORT_CONTACT } from 'src/constants/support';

interface Props {
  previewMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false,
});

const revealDisabled = computed(() => props.previewMode);

const { t } = useI18n();

const translatedText = computed(() => {
  return t('home.examRules.errorBanner', { email: SUPPORT_CONTACT.EMAIL });
});
</script>

<style scoped>
.voucher-notice-banner {
  background-color: var(--badge-primary-bg);
  color: var(--badge-primary-text);
  border: 1px solid rgba(30, 137, 229, 0.25);
  border-radius: 12px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 12px rgba(30, 137, 229, 0.08);
}
.voucher-notice-banner__icon {
  color: var(--badge-primary-dot);
}
.voucher-notice-banner :deep(a) {
  color: var(--badge-primary-dot);
  text-decoration: underline;
}

@media (max-width: 1023px) {
  .voucher-notice-banner {
    width: 100%;
    margin-left: 0;
    margin-right: 0;
  }
}
</style>
