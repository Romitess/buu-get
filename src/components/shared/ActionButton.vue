<template>
  <q-btn
    :icon="icon"
    unelevated
    dense
    class="action-btn"
    :disable="disable"
    @click="$emit('click')"
  >
    <q-tooltip v-if="tooltip">{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<style scoped lang="scss">
.action-btn {
  background-color: #bbdefb; // Light blue background
  color: #333; // Dark icon color
  width: 32px;
  height: 32px;
  border-radius: 6px;

  &:hover {
    background-color: #90caf9;
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
