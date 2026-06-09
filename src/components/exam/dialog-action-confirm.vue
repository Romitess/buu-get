<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="dialog-action-card relative-position q-pa-md">
      <q-btn
        icon="close"
        flat
        round
        dense
        class="absolute-top-right q-ma-md text-grey-5"
        style="z-index: 10"
        @click="onCancel"
      />

      <q-card-section class="q-pb-none">
        <div class="dialog-title text-weight-bold text-dark">{{ title }}</div>
      </q-card-section>

      <q-card-section class="text-center q-py-xl">
        <div class="dialog-message">{{ message }}</div>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md row q-gutter-lg no-wrap">
        <AppButton :label="cancelLabel" class="dialog-btn cancel-btn" @click="onCancel" />
        <AppButton
          :label="confirmLabel"
          :color="confirmColor"
          class="dialog-btn confirm-btn"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';

withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: string;
  }>(),
  {
    confirmLabel: 'ยืนยัน',
    cancelLabel: 'ยกเลิก',
    confirmColor: 'primary',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const onConfirm = (): void => {
  emit('confirm');
  emit('update:modelValue', false);
};

const onCancel = (): void => {
  emit('cancel');
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.dialog-action-card {
  width: 100%;
  max-width: 480px;
  border-radius: 16px !important;
  background: var(--surface-card);
  box-shadow: var(--dialog-shadow);
}

.dialog-title {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.dialog-message {
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text-primary);
}

.dialog-btn {
  width: 140px !important;
  height: 44px !important;
  border-radius: 10px !important;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
}

.cancel-btn {
  background-color: var(--neutral-gray-light) !important;
  color: var(--text-primary) !important;
  box-shadow: none !important;

  &:hover {
    background-color: #d2d2d2 !important;
    filter: none !important;
    transform: translateY(-1px);
  }
}
</style>
