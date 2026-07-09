<template>
  <div class="banner-skeleton skeleton-root full-width" :aria-busy="true" :aria-label="ariaLabel">
    <q-skeleton type="rect" class="banner-skeleton__rect full-width" animation="wave" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>

<style scoped lang="scss">
.banner-skeleton {
  min-height: 120px;
}

.banner-skeleton__rect {
  aspect-ratio: 5 / 1;
  min-height: 120px;
  border-radius: var(--radius-md);
}
</style>
