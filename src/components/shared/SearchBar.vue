<template>
  <q-input
    v-model="model"
    outlined
    rounded
    dense
    placeholder="ค้นหา"
    bg-color="grey-1"
    class="search-bar"
    :class="{ 'full-width': fullWidth }"
    @update:model-value="$emit('search', $event)"
  >
    <template v-slot:append>
      <q-icon name="search" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
defineProps<{
  fullWidth?: boolean;
}>();

const model = defineModel<string>();

defineEmits<{
  (e: 'search', value: string | number | null): void;
}>();
</script>

<style scoped lang="scss">
.search-bar {
  width: 100%;
  max-width: 450px;

  &.full-width {
    max-width: none !important;
  }

  :deep(.q-field__control) {
    background-color: var(--surface-page) !important;
    border: 1px solid var(--neutral-gray-light);
    border-radius: var(--radius-10) !important;

    &:before {
      border: none;
      border-radius: var(--radius-10) !important;
    }
  }

  :deep(.q-icon) {
    color: var(--text-secondary);
  }
}
</style>
