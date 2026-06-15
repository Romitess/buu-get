<template>
  <div class="seat-split-divider" :style="{ width }">
    <span class="seat-split-divider__line"></span>
  </div>
</template>

<script setup lang="ts">
// Dashed vertical aisle line shown when a room is split in half.
// Shared by the seat preview (create/edit pages) and the seat-assignment map
// so the divider looks identical across all three screens.
withDefaults(
  defineProps<{
    /** Width of the aisle slot; accepts any CSS length (e.g. "48px"). */
    width?: string;
  }>(),
  { width: '48px' },
);
</script>

<style scoped lang="scss">
.seat-split-divider {
  position: relative;
  flex: 0 0 auto;
  align-self: stretch;
}

.seat-split-divider__line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 2px dashed var(--q-primary, #1976d2);
  opacity: 0.35;
}
</style>
