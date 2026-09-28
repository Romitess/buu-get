<template>
  <q-input
    :model-value="modelValue"
    outlined
    dense
    readonly
    bg-color="grey-2"
    class="custom-input cursor-pointer"
    hide-bottom-space
  >
    <template #append>
      <q-icon v-if="modelValue" name="close" class="cursor-pointer q-mr-xs" @click.stop="clear" />
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy ref="proxy" cover transition-show="scale" transition-hide="scale">
          <AppCalendar :model-value="modelValue" @click-date="onPick" />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QPopupProxy } from 'quasar';
import AppCalendar from 'src/components/shared/app-calendar.vue';

defineProps<{ modelValue: string }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change'): void;
}>();

const proxy = ref<QPopupProxy | null>(null);

const onPick = (value: string): void => {
  emit('update:modelValue', value);
  emit('change');
  proxy.value?.hide();
};

const clear = (): void => {
  emit('update:modelValue', '');
  emit('change');
};
</script>

<style scoped lang="scss">
.custom-input {
  :deep(.q-field__control) {
    border-radius: 6px;
  }
}
</style>
