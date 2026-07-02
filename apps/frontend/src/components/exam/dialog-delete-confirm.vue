<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="onUpdateModelValue">
    <q-card class="dialog-delete-card">
      <q-card-section class="row items-center q-pb-none header-section">
        <div class="text-h6 text-weight-bold card-title">{{ title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="onCancel" class="close-btn" />
      </q-card-section>

      <q-card-section class="text-center message-section">
        <div class="text-body1 message-text">{{ message }}</div>
      </q-card-section>

      <q-card-actions align="center" class="q-pt-none q-pb-md action-section q-gutter-x-md">
        <AppButton
          :label="cancelLabel"
          class="dialog-btn cancel-btn"
          :disable="loading"
          @click="onCancel"
        />
        <AppButton
          :label="confirmLabel"
          class="dialog-btn confirm-btn"
          :loading="loading"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'ยืนยัน',
  cancelLabel: 'ยกเลิก',
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const onUpdateModelValue = (val: boolean): void => {
  emit('update:modelValue', val);
};

const onCancel = (): void => {
  emit('cancel');
  emit('update:modelValue', false);
};

const onConfirm = (): void => {
  emit('confirm');
};
</script>

<style scoped lang="scss">
.dialog-delete-card {
  width: 500px;
  max-width: 90vw;
  border-radius: 16px !important;
  padding: 16px;
  background-color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
}

.header-section {
  padding: 8px 8px 0 8px;
}

.card-title {
  font-size: 18px;
  color: #1d1d1d;
  font-weight: 600;
}

.close-btn {
  color: #9e9e9e;
  font-size: 12px;
  transition: color 0.2s ease;

  &:hover {
    color: #616161;
  }
}

.message-section {
  padding: 32px 16px;
}

.message-text {
  font-size: 16px;
  color: #2c2c2c;
  font-weight: 500;
}

.action-section {
  padding: 0 8px 8px 8px;
}

.dialog-btn {
  width: 140px !important;
  height: 44px !important;
  font-weight: 600;
  font-size: 15px !important;
  border-radius: 12px !important;
  text-transform: none;
  transition: all 0.25s ease;
}

.cancel-btn {
  background-color: #e0e0e0 !important;
  color: #2c2c2c !important;
  box-shadow: none !important;

  &:hover {
    background-color: #d5d5d5 !important;
  }
}

.confirm-btn {
  background-color: var(--primary) !important;
  color: #ffffff !important;
  box-shadow: none !important;

  &:hover {
    filter: brightness(1.1) !important;
    box-shadow: none !important;
  }
}
</style>
