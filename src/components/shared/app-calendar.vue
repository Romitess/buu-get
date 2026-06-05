<template>
  <div class="calendar-component">
    <div class="calendar-container">
      <q-card class="calendar-card" flat>
        <q-resize-observer @resize="(size) => $emit('main-card-resize', size)" />

        <div v-if="!showPicker" class="calendar-main-view">
          <div class="calendar-header">
            <q-btn
              flat
              round
              dense
              icon="chevron_left"
              class="calendar-nav-btn"
              @click="handlePrevMonth"
            />
            <div
              class="calendar-title cursor-pointer"
              role="button"
              tabindex="0"
              aria-label="Select month and year"
              @click="showPicker = true"
              @keydown.enter="showPicker = true"
            >
              <h2 class="month-title">
                <span>{{ currentMonthYearTH }}</span>
                <q-icon name="arrow_drop_down" class="dropdown-icon" />
              </h2>
              <p class="month-subtitle">{{ currentMonthYearEN }}</p>
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

          <div class="calendar-grid">
            <div class="weekday" v-for="day in WEEKDAYS" :key="day">{{ day }}</div>
            <div class="day-cell empty" v-for="n in emptyDaysCount" :key="'empty-' + n"></div>

            <div
              v-for="day in daysInMonth"
              :key="day.dateString"
              class="day-cell"
              :class="{
                active: modelValue === day.dateString,
                today: day.isToday,
                disabled:
                  (props.disablePastDates && day.isPast) ||
                  (props.minDate && day.dateString < props.minDate),
              }"
              role="button"
              tabindex="0"
              :aria-label="`Select date ${day.dateString}`"
              @click="handleDaySelect(day)"
              @keydown.enter="handleDaySelect(day)"
            >
              {{ day.value }}
              <slot name="day-content" :day="day"></slot>
            </div>

            <div
              v-for="n in trailingEmptyDaysCount"
              :key="'trailing-' + n"
              class="day-cell empty"
            ></div>
          </div>

          <div v-if="props.showLegend" class="calendar-footer-legend">
            <div class="legend-item">
              <div class="legend-dot dot-available"></div>
              <span>{{ t('exam.calendar.legendAvailable') }}</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot dot-full"></div>
              <span>{{ t('exam.calendar.legendFull') }}</span>
            </div>
          </div>
        </div>

        <div v-else class="month-year-picker-view">
          <div class="picker-header row items-center justify-between q-px-sm q-py-xs">
            <div class="text-subtitle2 text-weight-bold">{{ currentMonthYearEN }}</div>
            <q-btn flat round dense icon="close" size="sm" @click="showPicker = false" />
          </div>

          <q-separator />

          <div class="year-selector scroll-column">
            <div
              v-for="y in yearOptions"
              :key="y"
              class="year-item"
              :class="{ active: currentDate.getFullYear() === y - THAI_YEAR_OFFSET }"
              role="button"
              tabindex="0"
              :aria-label="`Select year ${y}`"
              @click="handleYearSelect(y - THAI_YEAR_OFFSET)"
              @keydown.enter="handleYearSelect(y - THAI_YEAR_OFFSET)"
            >
              {{ y }}
            </div>
          </div>

          <q-separator />

          <div class="month-grid q-pa-sm">
            <div
              v-for="(m, index) in SHORT_MONTH_NAMES_EN"
              :key="m"
              class="month-item"
              :class="{ active: currentDate.getMonth() === index }"
              role="button"
              tabindex="0"
              :aria-label="`Select month ${m}`"
              @click="handleMonthSelect(index)"
              @keydown.enter="handleMonthSelect(index)"
            >
              {{ m }}
            </div>
          </div>
        </div>
      </q-card>

      <slot v-if="!showPicker" name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AppCalendarProps } from '../../types/common';

const THAI_YEAR_OFFSET = 543;
const PAST_YEARS_RANGE = 100;
const TOTAL_YEARS_RANGE = 111;
const CALENDAR_TOTAL_SLOTS = 42;

const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(2000, 0, 3 + i)),
);
const MONTH_NAMES_TH = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(new Date(2000, i, 1)),
);
const MONTH_NAMES_EN = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2000, i, 1)),
);
const SHORT_MONTH_NAMES_EN = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2000, i, 1)),
);

const props = withDefaults(defineProps<AppCalendarProps>(), {
  showLegend: false,
  disablePastDates: false,
});

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change-month', month: number, year: number): void;
  (e: 'click-date', value: string): void;
  (e: 'main-card-resize', size: { width: number; height: number }): void;
}>();

const showPicker = ref(false);
const currentDate = ref(new Date());
const todayString = ref(getTodayString());

function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

let midnightTimer: ReturnType<typeof setTimeout>;

const scheduleMidnightUpdate = () => {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeToMidnight = tomorrow.getTime() - now.getTime();

  midnightTimer = setTimeout(() => {
    todayString.value = getTodayString();
    scheduleMidnightUpdate();
  }, timeToMidnight + 1000);
};

onMounted(() => {
  scheduleMidnightUpdate();
});

onUnmounted(() => {
  clearTimeout(midnightTimer);
});

const currentMonthYearTH = computed(
  () =>
    `${MONTH_NAMES_TH[currentDate.value.getMonth()]} ${currentDate.value.getFullYear() + THAI_YEAR_OFFSET}`,
);
const currentMonthYearEN = computed(
  () => `${MONTH_NAMES_EN[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`,
);

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear() + THAI_YEAR_OFFSET;
  return Array.from(
    { length: TOTAL_YEARS_RANGE },
    (_, i) => currentYear - PAST_YEARS_RANGE + i,
  ).reverse();
});

const emptyDaysCount = computed(() => {
  const firstDay = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1,
  ).getDay();
  return firstDay === 0 ? 6 : firstDay - 1;
});

const trailingEmptyDaysCount = computed(() => {
  const occupiedSlots = emptyDaysCount.value + daysInMonth.value.length;
  return CALENDAR_TOTAL_SLOTS - occupiedSlots;
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const currentTodayStr = todayString.value;

  return Array.from({ length: daysCount }, (_, i) => {
    const day = i + 1;
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateString === currentTodayStr;
    const isPast = dateString < currentTodayStr;
    return { value: day, isToday, isPast, dateString };
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
  showPicker.value = false;
};

const handleYearSelect = (year: number) => {
  currentDate.value = new Date(year, currentDate.value.getMonth(), 1);
  emit('change-month', currentDate.value.getMonth() + 1, year);
};

const handleDaySelect = (day: { dateString: string; isPast: boolean }) => {
  if (props.disablePastDates && day.isPast) return;
  if (props.minDate && day.dateString < props.minDate) return;
  emit('update:modelValue', day.dateString);
  emit('click-date', day.dateString);
};
</script>

<style scoped lang="scss">
.calendar-card {
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: var(--shadow-card) !important;
  background-color: var(--surface-card);
  position: relative;
  width: 320px;
  height: 420px;
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
  height: 44px;
}
.calendar-nav-btn {
  font-size: 15px;
  color: var(--neutral-400);
  transition: color var(--transition-fast);
  &:hover {
    color: var(--text-primary);
  }
}
.calendar-title {
  flex: 1;
  text-align: center;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--calendar-hover-bg-light);
  }

  h2.month-title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.2;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: var(--text-primary);

    span {
      display: inline-block;
    }

    .dropdown-icon {
      font-size: 20px;
      margin-left: 4px;
    }
  }

  p.month-subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--neutral-500);
    font-weight: 400;
    line-height: 1.2;
  }
}

.year-selector {
  flex: 0 1 auto;
  max-height: 180px;
  overflow-y: auto;
  border-bottom: 1px solid var(--calendar-month-year-picker-border);
}

.year-item {
  padding: 8px;
  text-align: center;
  cursor: pointer;
  font-size: 15px;
  border-bottom: 1px solid var(--calendar-year-item-border);
  &:hover {
    background-color: var(--calendar-year-item-hover);
  }
  &.active {
    background-color: var(--calendar-active-bg);
    color: var(--text-on-primary);
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
    background-color: var(--calendar-month-item-hover);
    border-color: var(--calendar-month-item-border-hover);
  }
  &.active {
    border-color: var(--calendar-active-bg);
    color: var(--calendar-active-bg);
    font-weight: bold;
  }
}

.calendar-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(6, 1fr);
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
  transition: all var(--transition-fast);
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
  &.disabled {
    cursor: not-allowed;
    opacity: 0.3;
    background-color: transparent !important;
    color: var(--text-muted) !important;
    &:hover {
      background-color: transparent !important;
      color: var(--text-muted) !important;
    }
  }
  &.empty {
    cursor: default;
    background-color: transparent;
  }
}

.scroll-column {
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: var(--calendar-scrollbar-track);
  }
  &::-webkit-scrollbar-thumb {
    background: var(--calendar-scrollbar-thumb);
    border-radius: 4px;
    &:hover {
      background: var(--calendar-scrollbar-thumb-hover);
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

.calendar-footer-legend {
  padding: 12px 0 0 0;
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 18px;
  border-top: 1px solid var(--calendar-month-year-picker-border);
  background-color: transparent;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-600);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  &.dot-available {
    background-color: var(--calendar-dot-available);
  }
  &.dot-full {
    background-color: var(--calendar-dot-full);
  }
}

@media (max-width: 600px) {
  .calendar-card {
    height: auto;
    min-height: 400px;
  }
  .calendar-footer-legend {
    gap: 14px;
    margin-top: 10px;
    padding-top: 10px;
  }
  .legend-item {
    font-size: 13px;
    gap: 6px;
  }
}
</style>
