<template>
  <q-select
    v-bind="$attrs"
    :model-value="modelValue"
    popup-content-class="app-select-menu"
    class="app-select"
    :class="{ 'app-select--open': isOpen }"
    @update:model-value="emit('update:modelValue', $event)"
    @popup-show="handlePopupShow"
    @popup-hide="handlePopupHide"
  >
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineOptions({
  inheritAttrs: false,
});

defineProps<{
  modelValue?: unknown;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void;
  (e: 'popupShow'): void;
  (e: 'popupHide'): void;
}>();

const isOpen = ref(false);

const handlePopupShow = (): void => {
  isOpen.value = true;
  emit('popupShow');
};

const handlePopupHide = (): void => {
  isOpen.value = false;
  emit('popupHide');
};
</script>

<style scoped>
.app-select {
  width: 100%;
}

.app-select :deep(.q-field__control) {
  transition:
    border-radius 0.16s ease,
    box-shadow 0.16s ease;
}

.app-select--open :deep(.q-field__control) {
  border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important;
  box-shadow: 0 4px 10px rgb(15 23 42 / 6%);
}

.app-select--open :deep(.q-field__control::before),
.app-select--open :deep(.q-field__control::after) {
  border-bottom-color: transparent !important;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important;
}

:global(.app-select-menu) {
  margin-top: -1px !important;
  border: 1px solid var(--primary);
  border-top: 0;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm) !important;
  box-shadow: 0 10px 20px rgb(15 23 42 / 12%) !important;
  overflow: hidden;
  max-height: 300px !important;
}

:global(.app-select-menu .q-virtual-scroll__content) {
  border-radius: inherit;
  overflow: hidden;
}

:global(.app-select-menu .q-item) {
  min-height: 40px;
  transition:
    background-color 0.16s ease,
    color 0.16s ease;
}

:global(.app-select-menu .q-item:last-child) {
  border-radius: 0 0 calc(var(--radius-sm) - 1px) calc(var(--radius-sm) - 1px);
}
</style>
