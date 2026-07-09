<template>
  <div class="room-preview-skeleton skeleton-root" :aria-busy="true" :aria-label="ariaLabel">
    <q-skeleton
      type="rect"
      height="320px"
      width="100%"
      animation="wave"
      class="room-preview-skeleton__map"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>

<style scoped lang="scss">
.room-preview-skeleton__map {
  border-radius: var(--radius-sm);
}
</style>
