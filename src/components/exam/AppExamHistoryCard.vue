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
          <div
            v-if="deadline"
            class="deadline-text row items-center"
            style="color: var(--badge-error-dot)"
          >
            <q-icon name="warning_amber" size="18px" class="q-mr-xs" />
            {{ $t('exam.history.paymentDeadline') }} {{ deadline }}
          </div>
        </slot>
      </div>
      <div class="text-right" v-if="fee !== undefined">
        <div class="fee-label">{{ $t('exam.history.fee') }}</div>
        <div class="fee-value">{{ fee.toLocaleString() }} ฿</div>
      </div>
    </div>

    <!-- Middle Row: Title -->
    <div class="exam-title text-weight-bold q-mt-sm">
      {{ title }}
    </div>

    <!-- Bottom Row: Info & Buttons -->
    <div class="row items-end justify-between full-width q-mt-auto">
      <div class="row items-center q-gutter-x-lg">
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
            :label="$t('exam.history.cancel')"
            class="action-btn"
            @click="$emit('cancel')"
          />
          <!-- Optional Pay Button -->
          <AppButton
            v-if="showPay"
            id="btn-pay-exam"
            icon="payments"
            :label="$t('exam.history.pay')"
            class="action-btn pay-btn"
            @click="$emit('pay')"
          />
          <!-- Optional Download Button -->
          <AppButton
            v-if="showDownload"
            id="btn-download-receipt"
            icon="receipt_long"
            :label="$t('exam.history.downloadReceipt')"
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
.app-exam-history-card-container {
  // Always use primary blue for the brand bar as seen in Figma
  border-left: 6px solid var(--primary);
  position: relative;
  overflow: hidden;
  min-height: 160px;
  background: var(--surface-card);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.deadline-text {
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.fee-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: -2px;
}

.fee-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.exam-title {
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 800; // Extra bold as per premium design
  line-height: 1.3;
  margin-top: 12px;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-item {
  font-size: 14px;
  font-weight: 700; // Bold for maximum clarity
  color: var(--text-primary);
  display: flex;
  align-items: center;

  :deep(.q-icon) {
    color: var(--text-primary);
    margin-right: 8px;
  }
}

.action-btn {
  min-width: 130px;
  height: 40px;
  border-radius: var(--radius-sm);
  font-weight: 700;

  &.pay-btn {
    background-color: var(--primary) !important;
    color: white !important;
  }

  &.download-btn {
    background-color: var(--primary) !important;
    color: white !important;
  }
}

// Icon consistency
:deep(.q-icon) {
  color: var(--text-primary);
}

// Special case for deadline icon to match text color
.deadline-text :deep(.q-icon) {
  color: inherit;
}
</style>
