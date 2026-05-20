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
        <div
          v-if="availability?.[day.dateString] && !day.isPast && !day.isToday"
          class="dot"
          :class="{
            'dot-green': availability[day.dateString] === 'available',
            'dot-red': availability[day.dateString] === 'full',
          }"
        ></div>
      </template>
    </AppCalendar>
  </div>
</template>

<script setup lang="ts">
import AppCalendar from '../shared/app-calendar.vue';
import type { ExamCalendarProps } from '../../types/common';

withDefaults(defineProps<ExamCalendarProps>(), {
  availability: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
  (e: 'main-card-resize', size: { width: number; height: number }): void;
}>();

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
