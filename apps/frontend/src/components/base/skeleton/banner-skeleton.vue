<template>
  <div
    class="banner-skeleton full-width full-height"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <q-skeleton
      type="rect"
      class="full-width full-height"
      animation="pulse"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>

<style scoped>
.banner-skeleton {
  min-height: 120px;
}
</style>
