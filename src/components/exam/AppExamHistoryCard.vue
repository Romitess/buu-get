<template>
  <div
    class="buu-card q-pa-lg column app-exam-history-card-container"
    :class="[`status-${statusType}`]"
  >
    <!-- Top Row: Status & Fee -->
    <div class="row items-start justify-between full-width">
      <div class="row items-center q-gutter-x-md">
        <AppStatusBadge :label="statusLabel" :type="statusType" />
        <slot name="status-append">
          <div v-if="deadline" class="deadline-text row items-center text-negative">
            <q-icon name="report_problem" size="18px" class="q-mr-xs" />
            กำหนดชำระภายใน {{ deadline }}
          </div>
        </slot>
      </div>
      <div class="text-right" v-if="fee !== undefined">
        <div class="fee-label">ค่าธรรมเนียม</div>
        <div class="fee-value">{{ fee.toLocaleString() }} ฿</div>
      </div>
    </div>

    <!-- Middle Row: Title -->
    <div class="exam-title text-weight-bold q-mt-sm">
      {{ title }}
    </div>

    <!-- Bottom Row: Info & Buttons -->
    <div class="row items-end justify-between full-width q-mt-auto">
      <div class="row items-center q-gutter-x-lg text-grey-9">
        <div class="info-item row items-center">
          <q-icon name="event" size="22px" class="q-mr-sm" />
          {{ date }}
        </div>
        <div class="info-item row items-center">
          <q-icon name="schedule" size="22px" class="q-mr-sm" />
          {{ time }}
        </div>
        <div class="info-item row items-center">
          <q-icon name="place" size="22px" class="q-mr-sm" />
          {{ location }}
        </div>
      </div>

      <div class="row q-gutter-x-md">
        <slot name="actions">
          <!-- Optional Cancel Button -->
          <AppButton
            v-if="showCancel"
            id="btn-cancel-exam"
            outline
            color="grey-8"
            label="ยกเลิกการสมัคร"
            class="action-btn"
            @click="$emit('cancel')"
          />
          <!-- Optional Pay Button -->
          <AppButton
            v-if="showPay"
            id="btn-pay-exam"
            icon="payments"
            label="ชำระเงิน"
            class="action-btn pay-btn"
            @click="$emit('pay')"
          />
          <!-- Optional Download Button -->
          <AppButton
            v-if="showDownload"
            id="btn-download-receipt"
            icon="receipt_long"
            label="ดาวน์โหลดใบเสร็จ"
            class="action-btn download-btn"
            @click="$emit('download')"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppStatusBadge from '../base/AppStatusBadge.vue';
import AppButton from '../base/AppButton.vue';

interface Props {
  title: string;
  statusLabel: string;
  statusType?: 'primary' | 'success' | 'warning' | 'error' | 'info' | undefined;
  date: string;
  time: string;
  location: string;
  fee?: number | undefined;
  deadline?: string | undefined;
  showCancel?: boolean | undefined;
  showPay?: boolean | undefined;
  showDownload?: boolean | undefined;
}

withDefaults(defineProps<Props>(), {
  statusType: 'primary',
  showCancel: false,
  showPay: false,
  showDownload: false,
});

defineEmits(['cancel', 'pay', 'download']);
</script>

<style scoped lang="scss">
// We consume the global container style from app.scss
.app-exam-history-card-container {
  border-left: 6px solid var(--primary);

  &.status-info {
    border-left-color: var(--text-muted);
  }
  &.status-success {
    border-left-color: var(--badge-success-dot);
  }
  &.status-warning {
    border-left-color: var(--badge-warning-dot);
  }
  &.status-error {
    border-left-color: var(--badge-error-dot);
  }
}

.deadline-text {
  font-size: 14px;
  font-weight: 700;
}

.fee-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: -4px;
}

.fee-value {
  font-size: var(--exam-card-title-size);
  font-weight: 800;
  color: var(--text-primary);
}

.exam-title {
  font-size: var(--exam-card-title-size);
  color: var(--text-primary);
  line-height: 1.2;
  margin-top: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-item {
  font-size: var(--exam-card-info-size);
  font-weight: 600;
  color: var(--text-primary);
}

.action-btn {
  min-width: 140px;
  height: 44px;
  border-radius: var(--radius-sm);
  font-weight: 700;

  &.pay-btn :deep(.q-icon) {
    color: var(--text-on-primary) !important;
  }

  &.download-btn :deep(.q-icon) {
    color: var(--text-on-primary) !important;
  }
}

:deep(.q-icon) {
  color: var(--text-primary);
}

.deadline-text :deep(.q-icon) {
  color: inherit;
}
</style>
