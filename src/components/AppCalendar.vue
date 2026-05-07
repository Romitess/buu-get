<template>
  <div class="calendar-component">
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
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Calendar Component
 * คอมโพเนนต์ปฏิทินสำหรับเลือกวันที่
 * ส่งค่ากลับผ่าน v-model และ event 'click-date'
 */
import { ref, computed } from 'vue';

interface Props {
  /** วันที่เลือกอยู่ (YYYY-MM-DD) */
  modelValue: string;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
  (e: 'click-date', value: string): void;
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
  // ปรับให้เริ่มต้นที่วันจันทร์ (0=Sunday -> 6, 1=Monday -> 0)
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
  emit('click-date', dateString);
};
</script>

<style scoped lang="scss">
.calendar-card {
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  background-color: var(--surface-card);
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.calendar-nav-btn {
  font-size: 15px;
  color: var(--neutral-400);
  transition: color 0.2s;
  &:hover {
    color: var(--text-primary);
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
    color: var(--neutral-500);
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
  color: var(--text-muted);
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
    background-color: var(--calendar-hover-bg);
    color: var(--text-on-primary);
  }
  &.active {
    background-color: var(--calendar-active-bg);
    color: var(--text-on-primary);
  }
  &.today {
    background-color: var(--calendar-today-bg);
  }
  &.today.active,
  &.today:hover {
    background-color: var(--calendar-active-bg);
    color: var(--text-on-primary);
  }
  &.empty {
    cursor: default;
    background-color: transparent;
  }
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
}
</style>
