<template>
  <div class="enrollment-status-badge" :class="badgeClass">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  EnrollmentStatus,
  VerifyStatus,
  PAYMENT_STATUS_LABELS,
  VERIFY_STATUS_LABELS,
} from 'src/types/enrollment.types';

interface Props {
  status: number;
  type: 'payment' | 'verify';
}

const props = defineProps<Props>();

const label = computed((): string => {
  if (props.type === 'payment') {
    return PAYMENT_STATUS_LABELS[props.status] ?? '-';
  }
  return VERIFY_STATUS_LABELS[props.status] ?? '-';
});

const badgeClass = computed((): string => {
  if (props.type === 'payment') {
    const status: EnrollmentStatus = props.status;
    switch (status) {
      case EnrollmentStatus.PAID:
      case EnrollmentStatus.SEAT_ASSIGNED:
      case EnrollmentStatus.SEAT_PUBLISHED:
      case EnrollmentStatus.ATTENDED:
        return 'badge--paid';
      case EnrollmentStatus.UNPAID:
        return 'badge--unpaid';
      case EnrollmentStatus.CANCELLED:
        return 'badge--cancelled';
      default:
        return 'badge--default';
    }
  }

  const vStatus: VerifyStatus = props.status;
  switch (vStatus) {
    case VerifyStatus.PASS:
      return 'badge--pass';
    case VerifyStatus.WAIT_FIXED:
      return 'badge--wait-fixed';
    case VerifyStatus.UNCHECKED:
      return 'badge--unchecked';
    case VerifyStatus.CANCELLED:
      return 'badge--cancelled';
    default:
      return 'badge--default';
  }
});
</script>

<style scoped lang="scss">
.enrollment-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 120px;
  text-align: center;
}

.badge--paid {
  color: var(--badge-success-text);
  background-color: transparent;
  border: 1.5px solid var(--badge-success-dot);
}

.badge--unpaid {
  color: var(--badge-error-text);
  background-color: transparent;
  border: 1.5px solid var(--badge-error-dot);
}

.badge--pass {
  color: var(--badge-success-text);
  background-color: transparent;
  border: 1.5px solid var(--badge-success-dot);
}

.badge--wait-fixed {
  color: var(--badge-error-text);
  background-color: transparent;
  border: 1.5px solid var(--badge-error-dot);
}

.badge--unchecked {
  color: var(--badge-primary-text);
  background-color: transparent;
  border: 1.5px solid var(--badge-primary-dot);
}

.badge--cancelled {
  color: var(--badge-info-text);
  background-color: transparent;
  border: 1.5px solid var(--badge-info-dot);
}

.badge--default {
  color: var(--text-secondary);
  background-color: transparent;
  border: 1.5px solid var(--border-color);
}
</style>
