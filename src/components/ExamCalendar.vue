<template>
  <div class="exam-calendar-component">
    <div class="calendar-container">
      <q-card class="calendar-card" flat>
        <!-- Header -->
        <div class="calendar-header">
          <q-btn
            flat
            round
            dense
            icon="chevron_left"
            class="calendar-nav-btn"
            @click="handlePrevMonth"
          />
          <div class="calendar-title">
            <h2>{{ currentMonthYearTH }}</h2>
            <p>{{ currentMonthYearEN }}</p>
          </div>
          <q-btn
            flat
            round
            dense
            icon="chevron_right"
            class="calendar-nav-btn"
            @click="handleNextMonth"
          />
        </div>

        <!-- Grid -->
        <div class="calendar-grid">
          <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
          <div class="day-cell empty" v-for="n in emptyDaysCount" :key="'empty-' + n"></div>

          <div
            v-for="day in daysInMonth"
            :key="day.dateString"
            class="day-cell"
            :class="{
              active: modelValue === day.dateString,
              today: day.isToday,
            }"
            @click="handleDaySelect(day.dateString)"
          >
            {{ day.value }}
            <!-- จุดสีสำหรับสถานะรอบสอบ -->
            <div
              v-if="availability?.[day.dateString]"
              class="dot"
              :class="availability[day.dateString] === 'available' ? 'dot-green' : 'dot-red'"
            ></div>
          </div>
        </div>
      </q-card>

      <!-- Legend -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ExamCalendar
 * Controlled component สำหรับแสดงปฏิทินและสถานะรอบสอบรายวัน
 * ใช้ v-model สำหรับการเลือกวันที่ และรับข้อมูลจุดสถานะผ่าน props
 */
import { ref, computed } from 'vue';

interface Props {
  /** วันที่เลือกอยู่ (YYYY-MM-DD) */
  modelValue: string;
  /** สถานะจุดในแต่ละวัน (Map: dateString -> status) */
  availability?: Record<string, 'available' | 'full' | null>;
}

withDefaults(defineProps<Props>(), {
  availability: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
}>();

// ============================================================================
// LOGIC
// ============================================================================
const currentDate = ref(new Date());
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const monthNamesTH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const CALENDAR_TEXT = {
  LEGEND_AVAILABLE: 'มีที่นั่งว่าง',
  LEGEND_FULL: 'รอบเต็มแล้ว',
};
const monthNamesEN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const currentMonthYearTH = computed(
  () => `${monthNamesTH[currentDate.value.getMonth()]} ${currentDate.value.getFullYear() + 543}`,
);
const currentMonthYearEN = computed(
  () => `${monthNamesEN[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`,
);

const emptyDaysCount = computed(() => {
  const firstDay = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1,
  ).getDay();
  // ปรับให้เริ่มต้นที่วันจันทร์
  return firstDay === 0 ? 6 : firstDay - 1;
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: daysCount }, (_, i) => {
    const day = i + 1;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const date = new Date(year, month, day);
    const isToday = date.getTime() === today.getTime();
    return { value: day, isToday, dateString };
  });
});

const handlePrevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
  emit('change-month', currentDate.value.getMonth() + 1, currentDate.value.getFullYear());
};

const handleNextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
  emit('change-month', currentDate.value.getMonth() + 1, currentDate.value.getFullYear());
};

const handleDaySelect = (dateString: string) => {
  emit('update:modelValue', dateString);
};
</script>

<style scoped lang="scss">
.calendar-card {
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  background-color: #ffffff;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.calendar-nav-btn {
  font-size: 15px;
  color: #ccc;
  transition: color 0.2s;
  &:hover {
    color: #000;
  }
}
.calendar-title {
  text-align: center;
  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.1;
  }
  p {
    margin: 0;
    font-size: 13px;
    color: #6b7280;
    font-weight: 300;
  }
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 6px;
  column-gap: 4px;
  text-align: center;
}
.weekday {
  font-size: 11px;
  font-weight: 400;
  color: #888;
  margin-bottom: 2px;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  user-select: none;
  &:not(.empty):hover {
    background-color: #3b82f6;
    color: #fff;
  }
  &.active {
    background-color: #1d4ed8;
    color: #fff;
  }
  &.today {
    background-color: #f3f4f6;
  }
  &.today.active,
  &.today:hover {
    background-color: #1d4ed8;
    color: #fff;
  }
  &.empty {
    cursor: default;
    background-color: transparent;
  }
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: absolute;
  bottom: 6px;
}
.dot-red {
  background-color: #c12a32;
}
.dot-green {
  background-color: #27ae60;
}

.status-footer {
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  justify-content: center;
  gap: 18px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  background-color: #ffffff;
}
.status-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: #6b7280;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

@media (max-width: 600px) {
  .calendar-card {
    padding: 12px 16px;
    border-radius: 12px;
  }

  .calendar-title h2 {
    font-size: 15px;
  }

  .calendar-title p {
    font-size: 11px;
  }

  .calendar-grid {
    row-gap: 4px;
    column-gap: 2px;
  }

  .day-cell {
    font-size: 13px;
    border-radius: 6px;
  }

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

  .status-dot {
    width: 8px;
    height: 8px;
  }
}
</style>
