<template>
  <div
    class="banner-skeleton skeleton-root full-width"
    :class="{ 'banner-skeleton--fill': fill }"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <q-skeleton type="rect" class="banner-skeleton__rect full-width" animation="wave" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  /** Fill parent container (e.g. q-img #loading slot) instead of fixed aspect ratio */
  fill?: boolean;
}

withDefaults(defineProps<Props>(), {
  fill: false,
});

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

.banner-skeleton--fill {
  min-height: 0;
  height: 100%;
}

.banner-skeleton--fill .banner-skeleton__rect {
  aspect-ratio: unset;
  min-height: 0;
  height: 100%;
  border-radius: 0;
}
</style>
