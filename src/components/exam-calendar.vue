<template>
  <div class="exam-calendar-wrapper">
    <AppCalendar
      :model-value="modelValue"
      @update:model-value="(val) => $emit('update:modelValue', val)"
      @change-month="(m, y) => $emit('change-month', m, y)"
      @main-card-resize="(size) => $emit('main-card-resize', size)"
    >
      <template #day-content="{ day }">
        <div
          v-if="availability?.[day.dateString]"
          class="dot"
          :class="availability[day.dateString] === 'available' ? 'dot-green' : 'dot-red'"
        ></div>
      </template>

      <template #footer>
        <q-card class="status-footer q-mt-lg" flat>
          <div class="status-item">
            <div class="status-dot dot-green"></div>
            <span>{{ CALENDAR_TEXT.LEGEND_AVAILABLE }}</span>
          </div>
          <div class="status-item">
            <div class="status-dot dot-red"></div>
            <span>{{ CALENDAR_TEXT.LEGEND_FULL }}</span>
          </div>
        </q-card>
      </template>
    </AppCalendar>
  </div>
</template>

<script setup lang="ts">
import AppCalendar from './app-calendar.vue';
import type { ExamCalendarProps } from '../types/common';

const CALENDAR_TEXT = {
  LEGEND_AVAILABLE: 'มีที่นั่งว่าง',
  LEGEND_FULL: 'รอบเต็มแล้ว',
};

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

.status-footer {
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  justify-content: center;
  gap: 18px;
  box-shadow: var(--shadow-card) !important;
  background-color: var(--surface-card);
}
.status-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--neutral-500);
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

@media (max-width: 600px) {
  .dot {
    width: 6px;
    height: 6px;
    bottom: 3px;
  }
  .status-footer {
    padding: 10px;
    gap: 12px;
    margin-top: 12px !important;
  }
  .status-item {
    font-size: 12px;
    gap: 5px;
  }
}
</style>
