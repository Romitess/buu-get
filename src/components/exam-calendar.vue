<template>
  <div class="exam-calendar-wrapper">
    <AppCalendar
      :model-value="modelValue"
      show-legend
      disable-past-dates
      @update:model-value="(val) => $emit('update:modelValue', val)"
      @change-month="(m, y) => $emit('change-month', m, y)"
      @main-card-resize="(size) => $emit('main-card-resize', size)"
    >
      <template #day-content="{ day }">
        <div
          v-if="availability?.[day.dateString] && !day.isPast"
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
import AppCalendar from './app-calendar.vue';
import type { ExamCalendarProps } from '../types/common';

withDefaults(defineProps<ExamCalendarProps>(), {
  availability: () => ({}),
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
  (e: 'main-card-resize', size: { width: number; height: number }): void;
}>();
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
