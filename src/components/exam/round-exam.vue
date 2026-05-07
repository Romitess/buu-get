<template>
  <div class="round-exam" :class="{ 'round-exam--full': isFull }">
    <!-- Time Slot -->
    <div class="round-exam__time">
      <ExamClock :time-range="timeRange" />
    </div>

    <!-- Exam Info -->
    <div class="round-exam__info">
      <h3 class="round-exam__title">{{ title }}</h3>
      <AppButton :label="roundTypeLabel" color="secondary" pill dense class="round-exam__tag" />
    </div>

    <!-- Spacer for flex layout -->
    <div class="q-space" />

    <!-- Status and Action -->
    <div class="round-exam__action-group">
      <div class="round-exam__status" :class="isFull ? 'text-negative' : 'text-positive'">
        <q-icon name="groups" size="xs" />
        <span class="round-exam__seats">
          {{
            isFull
              ? fullStatusText
              : `${availableStatusTextPrefix}${availableSeats}${availableStatusTextSuffix}`
          }}
          <span class="text-muted">({{ totalSeats - availableSeats }}/{{ totalSeats }})</span>
        </span>
      </div>

      <AppButton
        :label="isFull ? fullBtnText : registerBtnText"
        :color="isFull ? 'full' : 'primary'"
        class="round-exam__btn"
        @click="$emit('register')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ExamClock from './exam-clock.vue';
import AppButton from '../base/app-button.vue';

/**
 * RoundExam Component
 * A card representing an exam round with time, title, status, and action.
 */
interface Props {
  /** Exam title (e.g., 'BUU - GET (General)') */
  title: string;
  /** Time range (e.g., '10:30 - 11:30') */
  timeRange: string;
  /** Number of available seats */
  availableSeats: number;
  /** Total number of seats */
  totalSeats: number;
  /** Label for the round type (e.g., 'รอบทั่วไป') */
  roundTypeLabel?: string;

  /** Text shown when round is full */
  fullStatusText?: string;
  /** Prefix text for available seats */
  availableStatusTextPrefix?: string;
  /** Suffix text for available seats */
  availableStatusTextSuffix?: string;
  /** Button text when full */
  fullBtnText?: string;
  /** Button text when available */
  registerBtnText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  roundTypeLabel: 'รอบทั่วไป',
  fullStatusText: 'ไม่มีที่ว่าง',
  availableStatusTextPrefix: 'ว่าง ',
  availableStatusTextSuffix: ' ที่นั่ง',
  fullBtnText: 'เต็ม (Full)',
  registerBtnText: 'ลงทะเบียนสอบ',
});

defineEmits<{
  (e: 'register'): void;
}>();

/** Computed property to determine if the round is full */
const isFull = computed(() => props.availableSeats <= 0);
</script>

<style scoped lang="scss">
.round-exam {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  gap: 24px;

  &--full {
    background-color: #fafafa;
    border-color: #eee;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  &__time {
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  &__title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.2;
  }

  &__tag {
    font-weight: 700 !important;
  }

  &__action-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 0.8rem;

    .text-muted {
      color: #9e9e9e;
      font-weight: 400;
      margin-left: 2px;
    }
  }

  &__btn {
    min-width: 140px;
  }
}

// Responsive layout
@media (max-width: 900px) {
  .round-exam {
    flex-wrap: wrap;
    padding: 16px;
    gap: 16px;

    &__info {
      flex: 1;
      min-width: 200px;
    }

    .q-space {
      display: none;
    }

    &__action-group {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f5f5f5;
      padding-top: 16px;
    }
  }
}

@media (max-width: 600px) {
  .round-exam {
    padding: 16px;
    &__title {
      font-size: 1.1rem;
    }

    &__action-group {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    &__status {
      justify-content: center;
      width: 100%;
    }

    &__btn {
      width: 100%;
      min-width: unset;
    }
  }
}
</style>
