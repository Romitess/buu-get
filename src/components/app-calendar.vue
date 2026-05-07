<template>
  <div class="calendar-component">
    <div class="calendar-container">
      <q-card class="calendar-card" flat>
        <q-resize-observer @resize="(size) => $emit('main-card-resize', size)" />

        <!-- หน้าหลัก: ปฏิทินวัน -->
        <div v-if="!showPicker" class="calendar-main-view">
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
            <div class="calendar-title cursor-pointer" @click="showPicker = true">
              <h2>{{ currentMonthYearTH }} <q-icon name="arrow_drop_down" /></h2>
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
              <slot name="day-content" :day="day"></slot>
            </div>

            <!-- ช่องว่างส่วนท้ายเพื่อให้ขนาดคงที่ -->
            <div
              v-for="n in trailingEmptyDaysCount"
              :key="'trailing-' + n"
              class="day-cell empty"
            ></div>
          </div>
        </div>

        <!-- หน้าเลือกเดือน/ปี (Overlay ตามรูป) -->
        <div v-else class="month-year-picker-view">
          <div class="picker-header row items-center justify-between q-px-sm q-py-xs">
            <div class="text-subtitle2 text-weight-bold">{{ currentMonthYearEN }}</div>
            <q-btn flat round dense icon="close" size="sm" @click="showPicker = false" />
          </div>

          <q-separator />

          <!-- ส่วนบน: เลือกปี (List) -->
          <div class="year-selector scroll-column">
            <div
              v-for="y in yearOptions"
              :key="y"
              class="year-item"
              :class="{ active: currentDate.getFullYear() === y - 543 }"
              @click="handleYearSelect(y - 543)"
            >
              {{ y }}
            </div>
          </div>

          <q-separator />

          <!-- ส่วนล่าง: เลือกเดือน (Grid 4x3) -->
          <div class="month-grid q-pa-sm">
            <div
              v-for="(m, index) in shortMonthNamesEN"
              :key="m"
              class="month-item"
              :class="{ active: currentDate.getMonth() === index }"
              @click="handleMonthSelect(index)"
            >
              {{ m }}
            </div>
          </div>
        </div>
      </q-card>

      <!-- Slot สำหรับส่วนท้ายของปฏิทิน เช่น Legend (แสดงเฉพาะหน้าปฏิทินวัน) -->
      <slot v-if="!showPicker" name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AppCalendar (Base Component)
 * คอมโพเนนต์ปฏิทินพื้นฐานที่รองรับการปรับแต่งผ่าน Slots
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
  (e: 'main-card-resize', size: { width: number; height: number }): void;
}>();

// ============================================================================
// LOGIC
// ============================================================================
const showPicker = ref(false);
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
const shortMonthNamesEN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const currentMonthYearTH = computed(
  () => `${monthNamesTH[currentDate.value.getMonth()]} ${currentDate.value.getFullYear() + 543}`,
);
const currentMonthYearEN = computed(
  () => `${monthNamesEN[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`,
);

// สร้างรายการปี พ.ศ. (ย้อนหลัง 100 ปี ถึง อนาคต 10 ปี)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear() + 543;
  return Array.from({ length: 111 }, (_, i) => currentYear - 100 + i).reverse();
});

const emptyDaysCount = computed(() => {
  const firstDay = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1,
  ).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
});

// จำนวนช่องว่างส่วนท้ายเพื่อให้ครบ 6 แถว (42 ช่อง) เสมอ
const trailingEmptyDaysCount = computed(() => {
  const totalSlots = 42; // 6 แถว x 7 วัน
  const occupiedSlots = emptyDaysCount.value + daysInMonth.value.length;
  return totalSlots - occupiedSlots;
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

const handleMonthSelect = (monthIndex: number) => {
  currentDate.value = new Date(currentDate.value.getFullYear(), monthIndex, 1);
  emit('change-month', monthIndex + 1, currentDate.value.getFullYear());
  showPicker.value = false; // เลือกแล้วกลับไปหน้าปฏิทิน
};

const handleYearSelect = (year: number) => {
  currentDate.value = new Date(year, currentDate.value.getMonth(), 1);
  emit('change-month', currentDate.value.getMonth() + 1, year);
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
  position: relative;
  width: 320px; /* ล็อคความกว้างคงที่ */
  height: 380px; /* ล็อคความสูงคงที่ */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-main-view,
.month-year-picker-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  height: 44px; /* ล็อคความสูง Header */
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
  flex: 1;
  text-align: center;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    line-height: 1.1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  p {
    margin: 0;
    font-size: 13px;
    color: var(--neutral-500);
    font-weight: 300;
  }
}

/* ─── Picker View (Overlay Styles) ─── */
.year-selector {
  flex: 0 1 auto; /* ให้ขยายตามพื้นที่แต่ไม่เกินที่กำหนด */
  max-height: 180px; /* จำกัดความสูงไว้ไม่ให้ล้นยาว */
  overflow-y: auto;
  border-bottom: 1px solid #f0f0f0;
}

.year-item {
  padding: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 15px;
  border-bottom: 1px solid #fafafa;
  &:hover {
    background-color: #f5f5f5;
  }
  &.active {
    background-color: var(--calendar-active-bg);
    color: white;
    font-weight: bold;
  }
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 8px;
  flex: 0 0 auto;
}

.month-item {
  padding: 10px 4px;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid transparent;
  &:hover {
    background-color: #f5f5f5;
    border-color: #e0e0e0;
  }
  &.active {
    border-color: var(--calendar-active-bg);
    color: var(--calendar-active-bg);
    font-weight: bold;
  }
}

/* ─── Grid View Styles ─── */
.calendar-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(6, 1fr); /* ล็อค 6 แถววัน */
  row-gap: 4px;
  column-gap: 4px;
  text-align: center;
}
.weekday {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.1s ease;
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

.scroll-column {
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 8px; /* เพิ่มความหนาให้เห็นชัด */
  }
  &::-webkit-scrollbar-track {
    background: #f9f9f9;
  }
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    &:hover {
      background: #a8a8a8;
    }
  }
}

@media (max-width: 600px) {
  .calendar-card {
    padding: 12px 16px;
    border-radius: 12px;
    min-height: 300px;
  }
  .calendar-title h2 {
    font-size: 15px;
  }
  .calendar-title p {
    font-size: 11px;
  }
  .day-cell {
    font-size: 13px;
  }
}
</style>
