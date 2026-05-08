<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="payment-dialog-card column no-wrap items-center">
      <!-- Close Button -->
      <q-btn icon="close" flat round dense v-close-popup class="absolute-top-right close-btn" />

      <!-- Title -->
      <div class="dialog-title">ยืนยันการชำระเงิน</div>

      <!-- Amount Details Card -->
      <q-card flat class="amount-card">
        <div class="amount-label">รายละเอียดการชำระเงิน</div>
        <div class="amount-value">{{ amount.toLocaleString() }} THB</div>
      </q-card>

      <!-- QR Code -->
      <div class="qr-container">
        <q-img src="/qr test.png" class="qr-image" />
      </div>

      <!-- Countdown Badge -->
      <AppStatusBadge type="error" :dot="false" class="countdown-badge">
        <q-icon name="schedule" class="q-mr-xs" />
        ชำระเงินภายใน {{ countdown }}
      </AppStatusBadge>

      <!-- Instruction -->
      <div class="instruction-text">
        กรุณาสแกน QR Code ด้วยแอปพลิเคชัน Mobile Banking<br />
        เพื่อเสร็จสิ้นการลงทะเบียน
      </div>

      <!-- Save Button -->
      <AppButton
        icon="file_download"
        label="บันทึก QR Code ชำระเงิน"
        class="save-btn"
        @click="$emit('save')"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';
import AppStatusBadge from 'src/components/base/app-status-badge.vue';

interface Props {
  modelValue: boolean;
  amount: number;
  qrCodeUrl?: string;
  countdown: string;
}

defineProps<Props>();
defineEmits(['update:modelValue', 'save']);
</script>

<style scoped lang="scss">
.payment-dialog-card {
  width: calc(var(--space-unit) * 100);
  max-width: 100%;
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  box-shadow: var(--shadow-lg);
  padding: var(--space-lg);
}

.close-btn {
  color: var(--text-muted);
  margin: var(--space-sm);
}

.dialog-title {
  width: 100%;
  text-align: left;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.amount-card {
  width: 100%;
  margin-top: var(--space-md);
  border: 2px solid var(--neutral-gray-light) !important;
  border-radius: var(--radius-sm) !important;
  padding: var(--space-md) var(--space-lg);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  box-shadow: none !important;

  .amount-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    margin-bottom: var(--space-xs);
  }

  .amount-value {
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
  }
}

.qr-container {
  margin-top: var(--space-md);
}

.qr-image {
  width: calc(var(--space-unit) * 55);
  height: calc(var(--space-unit) * 55);
  object-fit: contain;
}

.countdown-badge {
  margin-top: var(--space-md);
  color: var(--badge-error-text) !important;
  border-radius: 16px !important;

  :deep(.badge-label),
  :deep(.q-icon) {
    color: var(--badge-error-text);
  }
}

.instruction-text {
  margin-top: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  text-align: center;
}

.save-btn {
  width: 100%;
  margin-top: var(--space-md);
  padding: var(--space-sm) 0;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-body);
}
</style>
