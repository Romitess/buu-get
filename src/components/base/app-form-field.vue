<template>
  <div>
    <div class="text-body2 text-weight-medium q-mb-xs">{{ label }}</div>

    <template v-if="type === 'select'">
      <q-select
        :model-value="modelValue"
        @update:model-value="$emit('update:model-value', $event)"
        :options="options ? [...options] : undefined"
        emit-value
        map-options
        outlined
        dense
        :readonly="readonly"
        :rules="rules ? [...rules] : undefined"
        hide-bottom-space
        class="custom-input"
        :class="inputClass"
      />
    </template>

    <template v-else>
      <q-input
        :model-value="modelValue"
        @update:model-value="$emit('update:model-value', $event)"
        :type="type"
        :placeholder="placeholder"
        outlined
        dense
        :stack-label="type === 'date'"
        :readonly="readonly"
        :rules="rules ? [...rules] : undefined"
        hide-bottom-space
        :rows="type === 'textarea' ? 5 : undefined"
        class="custom-input"
        :class="inputClass"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
type ValidationRule = (
  val: string | number | null | undefined,
) => boolean | string | Promise<boolean | string>;
type SelectOption =
  | string
  | number
  | { label: string; value: string | number; [key: string]: unknown };

interface Props {
  label: string;
  modelValue?: string | number | null;
  type?: 'text' | 'textarea' | 'tel' | 'date' | 'select' | 'email' | 'password';
  placeholder?: string;
  options?: readonly SelectOption[];
  readonly?: boolean;
  rules?: readonly ValidationRule[];
  inputClass?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  readonly: false,
});

defineEmits(['update:model-value']);
</script>
