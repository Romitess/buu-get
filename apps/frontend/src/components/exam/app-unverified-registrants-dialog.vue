<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    role="alertdialog"
    aria-labelledby="unverified-dialog-title"
    @update:model-value="onUpdateModelValue"
  >
    <q-card class="unverified-dialog-card">
      <q-card-section class="row items-center q-pb-none header-section">
        <div id="unverified-dialog-title" class="text-h6 text-weight-bold card-title">
          {{ title }}
        </div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          class="close-btn"
          :aria-label="closeLabel"
          @click="onClose"
        />
      </q-card-section>

      <q-card-section class="message-section">
        <div class="text-body1 message-text">{{ message }}</div>
        <div v-if="count > 0" class="count-hint text-body2">{{ countHint }}</div>
      </q-card-section>

      <q-card-actions vertical class="action-section q-gutter-y-sm">
        <AppButton
          :label="goToLabel"
          color="primary"
          class="dialog-btn choice-btn"
          autofocus
          @click="onGoToRegistrants"
        />
        <AppButton
          :label="closeLabel"
          class="dialog-btn choice-btn close-action-btn"
          outline
          @click="onClose"
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
  goToLabel: string;
  closeLabel: string;
  countHint?: string;
  count?: number;
}

withDefaults(defineProps<Props>(), {
  countHint: '',
  count: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'go-to-registrants'): void;
  (e: 'close'): void;
}>();

const onUpdateModelValue = (val: boolean): void => {
  emit('update:modelValue', val);
};

const onClose = (): void => {
  emit('update:modelValue', false);
  emit('close');
};

const onGoToRegistrants = (): void => {
  emit('go-to-registrants');
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.unverified-dialog-card {
  width: 480px;
  max-width: 90vw;
  border-radius: 16px !important;
  padding: 16px;
  background-color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
}

.header-section {
  padding: 8px 8px 0;
}

.card-title {
  font-size: 18px;
  color: #1d1d1d;
  font-weight: 600;
}

.close-btn {
  color: #9e9e9e;
}

.message-section {
  padding: 24px 16px 12px;
  text-align: center;
}

.message-text {
  font-size: 16px;
  color: #2c2c2c;
  line-height: 1.5;
}

.count-hint {
  margin-top: 12px;
  color: #616161;
}

.action-section {
  padding: 8px 16px 16px;
  width: 100%;
}

.dialog-btn {
  width: 100%;
  height: 44px;
  font-weight: 600;
  font-size: 14px;
  border-radius: 8px;
  text-transform: none;
}

.close-action-btn {
  color: var(--text-primary) !important;
  border-color: #cfcfcf !important;
}
</style>
