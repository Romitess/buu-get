<template>
  <div class="card-skeleton skeleton-root" :aria-busy="true" :aria-label="ariaLabel">
    <q-skeleton
      type="rect"
      :height="height"
      animation="wave"
      class="card-skeleton__media q-mb-md"
    />
    <q-skeleton
      v-for="line in lines"
      :key="line"
      type="text"
      :width="getLineWidth(line)"
      animation="wave"
      class="q-mb-xs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  height?: string;
  lines?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: '120px',
  lines: 3,
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));

const getLineWidth = (line: number): string => {
  if (line === 1) return '45%';
  if (line === props.lines) return '60%';
  return '85%';
};
</script>

<style scoped lang="scss">
.card-skeleton {
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}

.card-skeleton__media {
  border-radius: var(--radius-sm);
}
</style>
