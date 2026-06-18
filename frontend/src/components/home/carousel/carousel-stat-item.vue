<template>
  <div class="stat-item column justify-start">
    <div class="stat-line q-mb-md bg-primary"></div>
    <div class="text-caption text-grey-7 q-mb-xs text-weight-bold">
      {{ label }}
    </div>
    <div class="text-h6 text-weight-medium text-dark line-height-1 q-mb-xs">
      {{ value }}
    </div>
    <div class="text-caption text-grey-6 text-size-xs text-weight-regular">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  description: string;
}>();
</script>

<style scoped lang="scss">
.stat-line {
  width: 24px;
  height: 2px;
  background-color: $dark !important;
}
.line-height-1 {
  line-height: 1.1;
}
.text-size-xs {
  font-size: 0.75rem;
}
</style>
