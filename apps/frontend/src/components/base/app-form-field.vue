<template>
  <div>
    <div class="text-body2 text-weight-medium q-mb-xs field-label">
      {{ label }}
      <span v-if="required" class="text-negative">*</span>
    </div>

    <template v-if="type === 'select'">
      <AppSelect
        :model-value="modelValue ?? null"
        @update:model-value="(val) => $emit('update:modelValue', val)"
        :options="options ? [...options] : undefined"
        emit-value
        map-options
        outlined
        dense
        :readonly="readonly"
        :rules="rules ? [...rules] : undefined"
        :hide-bottom-space="!reserveBottomSpace"
        class="custom-input"
        :class="inputClass"
        v-bind="$attrs"
      />
    </template>

    <template v-else>
      <q-input
        :model-value="modelValue ?? null"
        @update:model-value="(val) => $emit('update:modelValue', val)"
        :type="inputType"
        :placeholder="placeholder"
        outlined
        dense
        :stack-label="type === 'date'"
        :readonly="readonly || type === 'date'"
        :rules="rules ? [...rules] : undefined"
        :hide-bottom-space="!reserveBottomSpace"
        :rows="type === 'textarea' ? 5 : undefined"
        class="custom-input"
        :class="inputClass"
        v-bind="$attrs"
      >
        <template v-if="type === 'date'" v-slot:append>
          <q-icon name="event" class="cursor-pointer">
            <slot name="append-inner"></slot>
          </q-icon>
        </template>
        <template v-else-if="type === 'password'" v-slot:append>
          <q-icon
            :name="passwordVisible ? 'visibility_off' : 'visibility'"
            class="cursor-pointer password-visibility-icon"
            @click.stop="passwordVisible = !passwordVisible"
          />
        </template>
      </q-input>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppSelect from './app-select.vue';

defineOptions({
  inheritAttrs: false,
});

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
  required?: boolean;
  rules?: readonly ValidationRule[];
  inputClass?: string;
  reserveBottomSpace?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  readonly: false,
  required: false,
  reserveBottomSpace: false,
});

defineEmits(['update:modelValue']);

const passwordVisible = ref(false);
const inputType = computed(() => {
  if (props.type === 'password') {
    return passwordVisible.value ? 'text' : 'password';
  }
  if (props.type === 'date' || props.type === 'select') {
    return 'text';
  }
  return props.type;
});
</script>

<style scoped lang="scss">
.password-visibility-icon {
  color: var(--neutral-400);
  font-size: 18px;
}
</style>
