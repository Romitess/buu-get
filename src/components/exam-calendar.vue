<template>
  <div class="exam-calendar-wrapper">
    <AppCalendar
      :model-value="modelValue"
      @update:model-value="(val) => $emit('update:modelValue', val)"
      @change-month="(m, y) => $emit('change-month', m, y)"
      @main-card-resize="(size) => $emit('main-card-resize', size)"
    >
      <!-- ใส่จุดสีสำหรับสถานะรอบสอบผ่าน Scoped Slot -->
      <template #day-content="{ day }">
        <div
          v-if="availability?.[day.dateString]"
          class="dot"
          :class="availability[day.dateString] === 'available' ? 'dot-green' : 'dot-red'"
        ></div>
      </template>

      <!-- ใส่ Legend ด้านล่างผ่าน Footer Slot -->
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
/**
 * ExamCalendar
 * คอมโพเนนต์สำหรับแสดงปฏิทินสอบ โดยใช้ AppCalendar เป็นฐาน
 */
import AppCalendar from './app-calendar.vue';

interface Props {
  /** วันที่เลือกอยู่ (YYYY-MM-DD) */
  modelValue: string;
  /** สถานะจุดในแต่ละวัน (Map: dateString -> status) */
  availability?: Record<string, 'available' | 'full' | null>;
}

withDefaults(defineProps<Props>(), {
  availability: () => ({}),
});

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
  (e: 'main-card-resize', size: { width: number; height: number }): void;
}>();

const CALENDAR_TEXT = {
  LEGEND_AVAILABLE: 'มีที่นั่งว่าง',
  LEGEND_FULL: 'รอบเต็มแล้ว',
};
</script>

<style scoped lang="scss">
/* สไตล์เฉพาะสำหรับจุดสีและส่วนท้ายของ ExamCalendar */
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
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
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
