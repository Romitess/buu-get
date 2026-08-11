<template>
  <div class="exam-calendar-wrapper">
    <AppCalendar
      :model-value="modelValue"
      show-legend
      disable-past-dates
      @update:model-value="onUpdateModelValue"
      @change-month="onChangeMonth"
      @main-card-resize="onMainCardResize"
    >
      <template #day-content="{ day }">
        <div v-if="shouldShowDot(day)" class="dot" :class="getDotClasses(day.dateString)"></div>
      </template>
    </AppCalendar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppCalendar from '../shared/app-calendar.vue';
import type { ExamCalendarProps } from '../../types/common';
import {
  getExamRoundsCalendarAvailability,
  type ExamCalendarAvailability,
} from 'src/utils/exam-registration';

const props = withDefaults(defineProps<ExamCalendarProps>(), {
  availability: () => ({}),
  scheduleData: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
  (e: 'main-card-resize', size: { width: number; height: number }): void;
}>();

interface CalendarDay {
  dateString: string;
  isPast: boolean;
  isToday: boolean;
}

const activeTime = computed((): Date => props.currentTime ?? new Date());

const getDayAvailability = (dateString: string): ExamCalendarAvailability => {
  const rounds = props.scheduleData[dateString]?.rounds;
  if (rounds?.length) {
    return getExamRoundsCalendarAvailability(rounds, activeTime.value);
  }

  return props.availability[dateString] ?? null;
};

const shouldShowDot = (day: CalendarDay): boolean => {
  return getDayAvailability(day.dateString) != null && !day.isPast;
};

const getDotClasses = (dateString: string): Record<string, boolean> => {
  const dayAvailability = getDayAvailability(dateString);

  return {
    'dot-green': dayAvailability === 'available',
    'dot-red': dayAvailability === 'full',
  };
};

const onUpdateModelValue = (val: string) => {
  emit('update:modelValue', val);
};

const onChangeMonth = (m: number, y: number) => {
  emit('change-month', m, y);
};

const onMainCardResize = (size: { width: number; height: number }) => {
  emit('main-card-resize', size);
};
</script>

<style scoped lang="scss">
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}
.dot-red {
  background-color: var(--calendar-dot-full);
}
.dot-green {
  background-color: var(--calendar-dot-available);
}

@media (max-width: 600px) {
  .dot {
    width: 6px;
    height: 6px;
    bottom: 3px;
  }
}
</style>
