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
  /** The numeric status value from backend */
  status: number;
  /** Whether this is a payment status or verify status */
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

  // verify status
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
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 100px;
  text-align: center;
}

// Payment: ชำระเงินแล้ว — green border/text
.badge--paid {
  color: #1b5e20;
  background-color: transparent;
  border: 1.5px solid #4caf50;
}

// Payment: ค้างชำระ — red border/text
.badge--unpaid {
  color: #c62828;
  background-color: transparent;
  border: 1.5px solid #ef5350;
}

// Verify: ผ่าน — green border/text
.badge--pass {
  color: #1b5e20;
  background-color: transparent;
  border: 1.5px solid #4caf50;
}

// Verify: รอการแก้ไข — orange/red border/text
.badge--wait-fixed {
  color: #c62828;
  background-color: transparent;
  border: 1.5px solid #ef5350;
}

// Verify: รอการตรวจสอบ — grey border/text
.badge--unchecked {
  color: #424242;
  background-color: transparent;
  border: 1.5px solid #9e9e9e;
}

// Cancelled — grey
.badge--cancelled {
  color: #757575;
  background-color: transparent;
  border: 1.5px solid #bdbdbd;
}

// Default fallback
.badge--default {
  color: var(--text-secondary);
  background-color: transparent;
  border: 1.5px solid var(--border-color);
}
</style>
