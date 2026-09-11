<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="payment-dialog-card column no-wrap items-center">
      <q-btn icon="close" flat round dense v-close-popup class="absolute-top-right close-btn" />

      <div class="dialog-title">{{ $t('payment.dialog.title') }}</div>

      <q-card flat class="amount-card">
        <div class="amount-label">{{ $t('payment.dialog.detailsLabel') }}</div>
        <div class="amount-value">{{ amount.toLocaleString() }} THB</div>
      </q-card>

      <div v-if="ref1 || ref2" class="ref-block q-mb-sm">
        <div v-if="ref1">REF1: {{ ref1 }}</div>
        <div v-if="ref2">REF2: {{ ref2 }}</div>
      </div>

      <div class="qr-container">
        <q-img :src="resolvedQrUrl" class="qr-image" />
      </div>

      <AppStatusBadge type="error" :dot="false" class="countdown-badge">
        <q-icon name="schedule" class="q-mr-xs" />
        {{ $t('payment.dialog.payWithin', { time: displayDeadline }) }}
      </AppStatusBadge>

      <div class="instruction-text">{{ $t('payment.dialog.instruction') }}</div>

      <div v-if="statusMessage" class="status-message q-mt-sm">{{ statusMessage }}</div>

      <AppButton
        v-if="paymentMode === 'mock'"
        icon="payments"
        :label="$t('payment.dialog.simulatePayment')"
        class="save-btn"
        :loading="isMockPaying"
        @click="$emit('mock-pay')"
      />
      <AppButton
        v-else
        icon="file_download"
        :label="$t('payment.dialog.saveQr')"
        class="save-btn"
        @click="$emit('save')"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import QRCode from 'qrcode';
import AppButton from 'src/components/base/app-button.vue';
import AppStatusBadge from 'src/components/base/app-status-badge.vue';
import { useCountdown } from 'src/composables/use-countdown';
import type { PaymentMode } from 'src/services/transaction.service';

interface Props {
  modelValue: boolean;
  amount: number;
  qrPayload?: string;
  qrCodeUrl?: string;
  ref1?: string;
  ref2?: string;
  paymentMode?: PaymentMode;
  statusMessage?: string | null;
  isMockPaying?: boolean;
  expiryTime: string | Date;
}

const props = withDefaults(defineProps<Props>(), {
  qrPayload: '',
  qrCodeUrl: '',
  ref1: '',
  ref2: '',
  paymentMode: 'csv',
  statusMessage: null,
  isMockPaying: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [];
  'mock-pay': [];
  timeout: [];
}>();

useI18n();

const generatedQrDataUrl = ref('');

const { displayDeadline } = useCountdown(toRef(props, 'expiryTime'), () => emit('timeout'));

watch(
  () => props.qrPayload,
  async (payload) => {
    if (!payload) {
      generatedQrDataUrl.value = '';
      return;
    }
    try {
      generatedQrDataUrl.value = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
      });
    } catch {
      generatedQrDataUrl.value = '';
    }
  },
  { immediate: true },
);

const resolvedQrUrl = computed(
  () => generatedQrDataUrl.value || props.qrCodeUrl || '/qr test.png',
);
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
  border: 1px solid #dddddd !important;
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

.ref-block {
  margin-top: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
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
  white-space: pre-line;
}

.status-message {
  color: var(--q-negative);
  text-align: center;
  font-size: var(--font-size-sm);
}

.save-btn {
  width: 100%;
  margin-top: var(--space-md);
  padding: var(--space-sm) 0;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-body);
}
</style>
