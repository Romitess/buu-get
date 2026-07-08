<template>
  <div
    class="card-skeleton"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <q-skeleton
      type="rect"
      :height="height"
      animation="pulse"
      class="q-mb-sm"
    />
    <q-skeleton
      v-for="line in lines"
      :key="line"
      type="text"
      :width="line === lines ? '60%' : '90%'"
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

withDefaults(defineProps<Props>(), {
  height: '120px',
  lines: 2,
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>
