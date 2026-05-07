<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="payment-dialog-card column no-wrap items-center q-pa-lg">
      <!-- Close Button -->
      <q-btn
        icon="close"
        flat
        round
        dense
        v-close-popup
        class="absolute-top-right q-ma-sm close-btn"
      />

      <!-- Title -->
      <div class="text-h6 text-weight-bold q-mt-sm full-width text-left q-px-md">
        ยืนยันการชำระเงิน
      </div>

      <!-- Amount Details Card -->
      <div class="amount-card q-mt-md column items-center justify-center">
        <div class="amount-label">รายละเอียดการชำระเงิน</div>
        <div class="amount-value q-mt-xs">{{ amount }} THB</div>
      </div>

      <!-- QR Code -->
      <div class="qr-container q-mt-lg">
        <q-img src="/qr test.png" width="240px" height="240px" fit="contain" class="qr-image" />
      </div>

      <!-- Countdown -->
      <div class="countdown-badge q-mt-lg row items-center justify-center">
        <q-icon name="schedule" size="20px" class="q-mr-xs" />
        <span>ชำระเงินภายใน {{ countdown }}</span>
      </div>

      <!-- Instruction -->
      <div class="instruction-text q-mt-lg text-center">
        กรุณาสแกน QR Code ด้วยแอปพลิเคชัน Mobile Banking เพื่อเสร็จสิ้นการลงทะเบียน
      </div>

      <!-- Save Button -->
      <div class="q-mt-xl">
        <AppButton
          icon="file_download"
          label="บันทึก QR Code ชำระเงิน"
          class="save-btn"
          @click="$emit('save')"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/AppButton.vue';

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
  width: 400px;
  height: 692px;
  border-radius: 8px;
  background: var(--surface-card);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.close-btn {
  color: var(--text-muted);
}

.amount-card {
  width: 350px;
  height: 96px;
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 10px;

  .amount-label {
    font-size: 16px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .amount-value {
    font-size: 24px;
    font-weight: 800;
    color: var(--text-primary);
  }
}

.qr-container {
  padding: 10px;
  background: var(--surface-card);
}

.countdown-badge {
  background: var(--badge-error-bg);
  color: var(--badge-error-dot);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
}

.instruction-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  max-width: 300px;
}

.save-btn {
  width: 300px;
  height: 45px;
  border-radius: 12px !important; // override AppButton default if needed
  padding: 10px;
  font-size: 16px;

  :deep(.q-btn__content) {
    gap: 10px;
  }
}
</style>
