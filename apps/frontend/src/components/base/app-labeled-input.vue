<template>
  <div class="app-labeled-input">
    <div v-if="label || $slots.label" class="custom-label q-mb-xs">
      <slot name="label">{{ label }}</slot>
    </div>

    <q-input
      v-bind="$attrs"
      :model-value="modelValue"
      outlined
      dense
      class="custom-input"
      @update:model-value="(val) => $emit('update:modelValue', val)"
    >
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData || {}" />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label?: string;
  modelValue?: string | number | null;
}

defineProps<Props>();
defineEmits(['update:modelValue']);
</script>

<style scoped lang="scss">
.custom-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #616161;
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 8px;
    background-color: #ffffff;
    transition: all 0.3s ease;

    &:before {
      border: 1px solid #eeeeee !important;
      border-style: solid !important;
    }

    &:hover:before {
      border-color: #bdbdbd !important;
    }
  }

  :deep(.q-field__native) {
    font-weight: 500;
    color: #424242;
  }
}
</style>
