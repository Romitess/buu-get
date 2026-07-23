<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="onUpdateModelValue">
    <q-card class="placement-choice-card">
      <q-card-section class="row items-center q-pb-none header-section">
        <div class="text-h6 text-weight-bold card-title">{{ title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense class="close-btn" @click="onKeep" />
      </q-card-section>

      <q-card-section class="message-section">
        <div class="text-body1 message-text">{{ message }}</div>
        <div v-if="unassignedCount > 0" class="unassigned-hint text-body2">
          {{ unassignedHint }}
        </div>
      </q-card-section>

      <q-card-actions vertical class="action-section q-gutter-y-sm">
        <AppButton
          :label="rearrangeLabel"
          color="primary"
          class="dialog-btn choice-btn"
          @click="onRearrange"
        />
        <AppButton
          :label="keepLabel"
          class="dialog-btn choice-btn keep-btn"
          outline
          @click="onKeep"
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
  unassignedHint?: string;
  unassignedCount?: number;
  rearrangeLabel: string;
  keepLabel: string;
}

withDefaults(defineProps<Props>(), {
  unassignedHint: '',
  unassignedCount: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'rearrange'): void;
  (e: 'keep'): void;
}>();

const onUpdateModelValue = (val: boolean): void => {
  emit('update:modelValue', val);
};

const onRearrange = (): void => {
  emit('rearrange');
  emit('update:modelValue', false);
};

const onKeep = (): void => {
  emit('keep');
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.placement-choice-card {
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

.unassigned-hint {
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

.keep-btn {
  color: var(--text-primary) !important;
  border-color: #cfcfcf !important;
}
</style>
