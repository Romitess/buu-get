<template>
  <q-btn
    :icon="icon"
    unelevated
    dense
    :class="['action-btn', color ? `text-${color}` : '']"
    :disable="disable"
    @click="$emit('click')"
  >
    <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<style scoped lang="scss">
.action-btn {
  background-color: var(--badge-primary-bg); // Use token from app.scss
  color: var(--badge-primary-text); // Use token from app.scss
  width: 32px;
  height: 32px;
  border-radius: 6px;

  &:hover {
    background-color: var(--dialog-info-border);
  }
}
</style>

<script setup lang="ts">
defineProps<{
  icon: string;
  color?: string;
  tooltip?: string;
  disable?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();
</script>
