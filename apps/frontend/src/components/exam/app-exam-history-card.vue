<template>
  <div
    class="buu-card q-pa-lg column app-exam-history-card-container"
    :class="[`status-${statusType}`, { 'has-notify': Boolean($slots.notify) }]"
  >
    <div v-if="$slots.notify" class="card-notify">
      <slot name="notify" />
    </div>

    <!-- Top Row: Status & Fee -->
    <div class="row items-center justify-start full-width card-top-row">
      <!-- Left side: Status indicators -->
      <div class="row items-center q-gutter-x-sm status-group">
        <div class="status-badges row items-center q-gutter-x-sm wrap">
          <AppStatusBadge
            v-if="registrationStatusLabel"
            :label="registrationStatusLabel"
            :type="registrationStatusType"
          />
          <AppStatusBadge
            v-if="examStatusLabel"
            :label="examStatusLabel"
            :type="examStatusType"
          />
          <AppStatusBadge
            v-if="!registrationStatusLabel && statusLabel"
            :label="statusLabel"
            :type="statusType"
          />
        </div>
        <slot name="status-append">
          <div v-if="displayDeadlineText" class="deadline-text row items-center">
            <q-icon name="warning_amber" size="calc(var(--space-unit) * 4.5)" class="q-mr-xs" />
            {{ $t('exam.history.paymentDeadline') }} {{ displayDeadlineText }}
          </div>
        </slot>
      </div>

      <q-space />

      <!-- Right side: Fee -->
      <div class="fee-group text-right" v-if="fee !== undefined">
        <div class="fee-label">{{ $t('exam.history.fee') }}</div>
        <div class="fee-value">{{ fee.toLocaleString() }} ฿</div>
      </div>
    </div>

    <!-- Middle Row: Title -->
    <div class="exam-title q-mt-sm">
      {{ title }}
    </div>

    <!-- Bottom Row: Info -->
    <div class="row items-center full-width card-bottom-row q-mt-md">
      <div class="row items-center q-gutter-x-lg">
        <div class="info-item row items-center">
          <q-icon name="event" size="calc(var(--space-unit) * 5)" class="q-mr-sm" />
          {{ date }}
        </div>
        <div class="info-item row items-center">
          <q-icon name="schedule" size="calc(var(--space-unit) * 5)" class="q-mr-sm" />
          {{ time }}
        </div>
        <div class="info-item row items-center">
          <q-icon name="place" size="calc(var(--space-unit) * 5)" class="q-mr-sm" />
          {{ location }}
        </div>
        <div v-if="seatLabel" class="info-item row items-center">
          <q-icon name="event_seat" size="calc(var(--space-unit) * 5)" class="q-mr-sm" />
          {{ $t('exam.history.seatLabel') }} {{ seatLabel }}
        </div>
      </div>
    </div>

    <!-- Action Buttons: absolutely positioned so they don't affect card height -->
    <div class="card-actions row q-gutter-x-md">
      <slot name="actions">
        <AppButton
          v-if="showCancel"
          id="btn-cancel-exam"
          outline
          color="grey-8"
          :label="$t('exam.history.cancel')"
          class="action-btn"
          @click="$emit('cancel')"
        />
        <AppButton
          v-if="showPay"
          id="btn-pay-exam"
          icon="payments"
          :label="$t('exam.history.pay')"
          class="action-btn pay-btn"
          @click="$emit('pay')"
        />
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
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue';
import AppStatusBadge from 'src/components/base/app-status-badge.vue';
import AppButton from 'src/components/base/app-button.vue';
import { useAppDate } from 'src/composables/useAppDate';
import { useCountdown } from 'src/composables/use-countdown';

interface Props {
  title: string;
  statusLabel?: string;
  statusType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  registrationStatusLabel?: string;
  registrationStatusType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  examStatusLabel?: string;
  examStatusType?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  date: string;
  time: string;
  location: string;
  seatLabel?: string;
  fee?: number | undefined;
  /** QR session expiry — when set, card shows MM:SS countdown */
  deadline?: string | undefined;
  /** Exam pay-by date — static display before QR session starts */
  payByDate?: string | undefined;
  showCancel?: boolean;
  showPay?: boolean;
  showDownload?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  statusLabel: '',
  statusType: 'primary',
  registrationStatusType: 'primary',
  examStatusType: 'info',
  showCancel: false,
  showPay: false,
  showDownload: false,
});

const emit = defineEmits(['cancel', 'pay', 'download', 'timeout']);

const { formatDateShort } = useAppDate();
const { displayDeadline } = useCountdown(toRef(props, 'deadline'), () => emit('timeout'));

const displayDeadlineText = computed((): string => {
  if (props.deadline && displayDeadline.value) {
    return displayDeadline.value;
  }
  if (props.payByDate) {
    return formatDateShort(props.payByDate);
  }
  return '';
});
</script>

<style scoped lang="scss">
.card-notify {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 2;
}

.app-exam-history-card-container {
  // Always use primary blue for the brand bar as seen in Figma
  border-left: var(--space-sm) solid var(--primary);
  border-radius: var(--radius-md);
  position: relative;
  // Fixed min-height ensures ALL cards are identical height
  // Accounts for: padding (48) + top-row with fee (40) + title (44) + bottom-row (36) ≈ 168px
  min-height: calc(var(--space-unit) * 42);
  width: 100%;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.has-notify {
    .card-top-row {
      padding-right: calc(var(--space-unit) * 10);
    }
  }
}

.deadline-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--badge-error-dot);
  display: flex;
  align-items: center;
}

.status-badges {
  row-gap: var(--space-xs);
}

.fee-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-weight: var(--font-weight-medium);
  margin-bottom: calc(var(--space-xs) * -0.5);
}

.fee-value {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-black);
  color: var(--text-primary);
}

.exam-title {
  font-size: var(--font-size-h3);
  color: var(--text-primary);
  font-weight: var(--font-weight-black);
  line-height: 1.4;
  margin-top: var(--space-sm);
  margin-bottom: var(--space-sm);
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-item {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  display: flex;
  align-items: center;

  :deep(.q-icon) {
    color: var(--text-primary);
    margin-right: var(--space-sm);
  }
}

.card-bottom-row {
  margin-top: var(--space-md);
}

.card-actions {
  position: absolute;
  right: var(--space-lg);
  bottom: var(--space-lg);
  display: flex;
  align-items: center;
}

.action-btn {
  // Let AppButton handle its own sizing — only define color variants here

  &.pay-btn {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
  }

  &.download-btn {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
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
.card-top-row {
  justify-content: flex-start !important;

  .status-group {
    margin-right: auto !important;
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-md);
  }
}

// === Mobile Responsive ===
@media (max-width: 600px) {
  .app-exam-history-card-container {
    padding: var(--space-md) !important;
    min-height: auto; // Let card grow naturally on mobile
    border-left-width: calc(var(--space-unit) * 1.5);
  }

  // Stack status and fee vertically
  .card-top-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: var(--space-sm);

    .fee-group {
      text-align: left !important;
      order: 2;
    }

    .status-group {
      order: 1;
    }
  }

  .exam-title {
    font-size: var(--font-size-body);
    margin-top: var(--space-sm);
  }

  // Stack info items vertically
  .card-bottom-row {
    .row.items-center.q-gutter-x-lg {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-xs);
    }
  }

  .info-item {
    font-size: var(--font-size-xs);
  }

  .fee-value {
    font-size: var(--font-size-body);
  }

  // Switch buttons from absolute to static, stacking below content
  .card-actions {
    position: static;
    margin-top: var(--space-md);
    width: 100%;
    justify-content: stretch;
    flex-wrap: wrap;
    gap: var(--space-sm);

    .action-btn {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
