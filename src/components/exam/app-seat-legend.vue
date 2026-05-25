<template>
  <div class="row items-center q-gutter-x-lg">
    <div v-for="(item, index) in items" :key="index" class="row items-center">
      <div
        class="legend-dot q-mr-sm"
        :class="item.dotClass"
        :style="{
          backgroundColor: item.color,
          border: item.border
            ? `1px solid ${item.borderColor || 'var(--seat-available-border)'}`
            : undefined,
        }"
      ></div>
      <span class="text-body2 text-dark font-weight-medium">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface LegendItem {
  label: string;
  dotClass?: string;
  color?: string;
  border?: boolean;
  borderColor?: string;
}

defineProps<{
  items: LegendItem[];
}>();
</script>

<style scoped lang="scss">
.legend-dot {
  width: 22px;
  height: 22px;
  border-radius: 6px;

  &.available {
    background-color: var(--surface-card);
    border: 1px solid var(--seat-available-border);
  }

  &.assigned {
    background-color: var(--primary-light);
  }

  &.broken {
    background-color: var(--seat-broken-bg); // Grey color for broken
  }
}
.font-weight-medium {
  font-weight: 500;
}
</style>
