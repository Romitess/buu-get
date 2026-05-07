<template>
  <div
    class="buu-card q-pa-lg column app-exam-history-card-container"
    :class="[`status-${statusType}`]"
  >
    <!-- Top Row: Status & Fee -->
    <div class="row items-center justify-start full-width card-top-row">
      <!-- Left side: Status indicators -->
      <div class="row items-center q-gutter-x-md status-group">
        <AppStatusBadge :label="statusLabel" :type="statusType" />
        <slot name="status-append">
          <div
            v-if="displayDeadline"
            class="deadline-text row items-center"
            style="color: var(--badge-error-dot)"
          >
            <q-icon name="warning_amber" size="18px" class="q-mr-xs" />
            {{ $t('exam.history.paymentDeadline') }} {{ displayDeadline }}
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import AppStatusBadge from '../base/app-status-badge.vue';
import AppButton from '../base/app-button.vue';

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

const props = withDefaults(defineProps<Props>(), {
  statusType: 'primary',
  showCancel: false,
  showPay: false,
  showDownload: false,
});

const emit = defineEmits(['cancel', 'pay', 'download', 'timeout']);

// === Timer Logic ===
const displayDeadline = ref(props.deadline);
let timerInterval: ReturnType<typeof setInterval> | null = null;

const startTimer = () => {
  const deadlineStr = props.deadline;
  if (!deadlineStr) return;

  let targetTime: number;

  // รองรับทั้งแบบ Mock (MM:SS) และแบบใช้งานจริงกับ Backend (ISO Date String)
  if (deadlineStr.includes(':') && deadlineStr.length <= 5) {
    const parts = deadlineStr.split(':');
    const minutes = parseInt(parts[0] || '0', 10);
    const seconds = parseInt(parts[1] || '0', 10);
    if (isNaN(minutes) || isNaN(seconds)) return;
    targetTime = Date.now() + (minutes * 60 + seconds) * 1000;
  } else {
    const parsedDate = new Date(deadlineStr);
    if (isNaN(parsedDate.getTime())) return;
    targetTime = parsedDate.getTime();
  }

  const updateDisplay = () => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      if (timerInterval) clearInterval(timerInterval);
      displayDeadline.value = '00:00';
      emit('timeout');
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;

    displayDeadline.value = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  updateDisplay(); // อัปเดตทันทีที่เริ่ม
  timerInterval = setInterval(updateDisplay, 1000);
};

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});

// Restart timer if deadline prop changes externally
watch(
  () => props.deadline,
  (newVal) => {
    if (timerInterval) clearInterval(timerInterval);
    displayDeadline.value = newVal;
    startTimer();
  },
);
</script>

<style scoped lang="scss">
.app-exam-history-card-container {
  // Always use primary blue for the brand bar as seen in Figma
  border-left: var(--space-sm) solid var(--primary);
  border-radius: var(--radius-md);
  position: relative;
  // Fixed min-height ensures ALL cards are identical height
  // Accounts for: padding (48) + top-row with fee (40) + title (44) + bottom-row (36) ≈ 168px
  min-height: calc(var(--space-unit) * 42);
  width: 100%;
  max-width: 1300px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.deadline-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
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
  font-family: 'Sarabun', sans-serif;
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
    // Use grid to fix status-append alignment without stretching the badge
    display: grid !important;
    grid-template-columns: calc(var(--space-unit) * 26) auto; // 120px fixed slot for badge
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
