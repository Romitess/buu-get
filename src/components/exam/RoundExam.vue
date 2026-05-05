<template>
  <div class="round-exam" :class="{ 'round-exam--full': isFull }">
    <!-- Time Slot -->
    <div class="round-exam__time">
      <ExamClock :time-range="timeRange" />
    </div>

    <!-- Exam Info -->
    <div class="round-exam__info">
      <h3 class="round-exam__title">{{ title }}</h3>
      <AppButton
        :label="roundTypeLabel"
        color="secondary"
        pill
        dense
        class="round-exam__tag"
      />
    </div>

    <!-- Spacer for flex layout -->
    <div class="q-space" />

    <!-- Status and Action -->
    <div class="round-exam__action-group">
      <div class="round-exam__status" :class="isFull ? 'text-negative' : 'text-positive'">
        <q-icon name="groups" size="xs" />
        <span class="round-exam__seats">
          {{ isFull ? 'ไม่มีที่ว่าง' : `ว่าง ${availableSeats} ที่นั่ง` }}
          <span class="text-muted">({{ totalSeats - availableSeats }}/{{ totalSeats }})</span>
        </span>
      </div>
      
      <AppButton
        :label="isFull ? 'เต็ม (Full)' : 'ลงทะเบียนสอบ'"
        :color="isFull ? 'full' : 'primary'"
        class="round-exam__btn"
        @click="$emit('register')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ExamClock from './ExamClock.vue';
import AppButton from '../base/AppButton.vue';

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
}

const props = withDefaults(defineProps<Props>(), {
  roundTypeLabel: 'รอบทั่วไป'
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
  gap: 24px;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
    border-color: rgba(13, 71, 161, 0.1);
  }

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
    &__title {
      font-size: 1.05rem;
    }
    
    &__action-group {
      flex-direction: column;
      align-items: flex-end;
    }
  }
}
</style>
