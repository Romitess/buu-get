<template>
  <div
    class="buu-card q-pa-lg column app-exam-history-card-container"
    :class="[`status-${statusType}`]"
  >
    <!-- Top Row: Status & Fee -->
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
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
  border-left: 8px solid var(--primary);
  border-radius: var(--radius-md); // 12px
  position: relative;
  overflow: hidden;
  min-height: 180px;
  width: 100%;
  max-width: 1300px;
  background: var(--surface-card);
  box-shadow: 0px 4px 4px 0px #00000040;
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
.card-top-row {
  justify-content: flex-start !important;

  .status-group {
    margin-left: 0 !important;
    margin-right: auto !important;
  }

  @media (max-width: 600px) {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 12px;

    .fee-group {
      text-align: left !important;
      order: 2;
    }
    .status-group {
      order: 1;
    }
  }
}

@media (max-width: 600px) {
  .app-exam-history-card-container {
    padding: 16px !important;
    min-height: 150px;
    border-left-width: 6px;
  }

  .exam-title {
    font-size: 16px;
    margin-top: 8px;
  }

  .info-item {
    font-size: 13px;
    margin-bottom: 4px;
    &:last-child {
      margin-bottom: 0;
    }
  }

  .fee-value {
    font-size: 16px;
  }

  // Stack info and buttons on mobile
  .row.items-end.justify-between.full-width.q-mt-auto {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 16px;
  }

  .row.q-gutter-x-md {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
    .action-btn {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
