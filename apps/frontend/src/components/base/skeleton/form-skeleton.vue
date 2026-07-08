<template>
  <div
    class="form-skeleton"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <div class="row q-col-gutter-md">
      <div
        v-for="field in fields"
        :key="`field-${field}`"
        :class="columnClass"
      >
        <q-skeleton type="text" width="40%" animation="wave" class="q-mb-xs" />
        <q-skeleton type="rect" height="40px" animation="pulse" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  fields?: number;
  columns?: number;
}

const props = withDefaults(defineProps<Props>(), {
  fields: 6,
  columns: 2,
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));

const columnClass = computed(() => {
  if (props.columns === 1) return 'col-12';
  if (props.columns === 3) return 'col-12 col-md-4';
  return 'col-12 col-md-6';
});
</script>
