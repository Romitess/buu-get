<template>
  <q-input
    v-model="model"
    outlined
    rounded
    dense
    placeholder="ค้นหา"
    bg-color="grey-1"
    class="search-bar"
    @update:model-value="$emit('search', $event)"
  >
    <template v-slot:append>
      <q-icon name="search" />
    </template>
  </q-input>
</template>

<script setup lang="ts">
const model = defineModel<string>();

defineEmits<{
  (e: 'search', value: string | number | null): void;
}>();
</script>

<style scoped lang="scss">
.search-bar {
  width: 100%;
  max-width: 450px;

  :deep(.q-field__control) {
    background-color: var(--surface-page) !important;
    border: 1px solid var(--neutral-gray-light);

    &:before {
      border: none;
    }
  }

  :deep(.q-icon) {
    color: var(--text-secondary);
  }
}
</style>
