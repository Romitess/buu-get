<template>
  <div class="page-skeleton skeleton-root" :aria-busy="true" :aria-label="ariaLabel">
    <div v-if="showHeader" class="q-mb-lg">
      <q-skeleton type="text" width="240px" height="28px" animation="wave" class="q-mb-sm" />
      <q-skeleton type="text" width="55%" height="16px" animation="wave" />
    </div>
    <slot>
      <FormSkeleton :fields="fields" :columns="columns" />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FormSkeleton from './form-skeleton.vue';

interface Props {
  showHeader?: boolean;
  fields?: number;
  columns?: number;
}

withDefaults(defineProps<Props>(), {
  showHeader: true,
  fields: 8,
  columns: 2,
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>
