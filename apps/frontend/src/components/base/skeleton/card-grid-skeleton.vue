<template>
  <div
    class="card-grid-skeleton"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <div
      v-for="section in sections"
      :key="`section-${section}`"
      class="q-mb-xl"
    >
      <div class="row items-center q-mb-md">
        <q-skeleton type="rect" width="28px" height="28px" animation="pulse" class="q-mr-sm" />
        <q-skeleton type="text" width="200px" animation="wave" />
      </div>
      <q-skeleton type="rect" height="1px" animation="pulse" class="q-mb-md" />
      <div class="row q-col-gutter-lg">
        <div
          v-for="item in count"
          :key="`card-${section}-${item}`"
          :class="colClass"
        >
          <CardSkeleton />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CardSkeleton from './card-skeleton.vue';

interface Props {
  count?: number;
  sections?: number;
  cols?: string;
}

const props = withDefaults(defineProps<Props>(), {
  count: 3,
  sections: 3,
  cols: 'col-12 col-md-4',
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
const colClass = computed(() => props.cols);
</script>
