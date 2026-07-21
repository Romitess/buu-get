<template>
  <q-card flat bordered class="chart-panel-skeleton skeleton-root">
    <q-card-section>
      <q-skeleton type="text" width="45%" height="20px" animation="wave" class="q-mb-md" />
      <q-skeleton
        type="rect"
        :height="height"
        animation="wave"
        class="chart-panel-skeleton__chart"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
interface Props {
  height?: string;
}

withDefaults(defineProps<Props>(), {
  height: '320px',
});
</script>

<style scoped lang="scss">
.chart-panel-skeleton {
  background: var(--surface-card);
  border-radius: var(--radius-md);
  border-color: var(--border-color);
}

.chart-panel-skeleton__chart {
  border-radius: var(--radius-sm);
}
</style>
