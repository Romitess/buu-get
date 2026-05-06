<template>
  <div class="exam-calendar-component">
    <div class="calendar-container">
      <q-card class="calendar-card" flat>
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

        <div class="calendar-grid">
          <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
          <div class="day-cell empty" v-for="n in emptyDaysCount" :key="'empty-' + n"></div>

          <div
            v-for="day in daysInMonth"
            :key="day.value"
            class="day-cell"
            :class="{
              active: selectedDate === day.dateString,
              today: day.isToday,
            }"
            @click="handleDaySelect(day)"
          >
            {{ day.value }}
            <span v-if="day.status === 'full'" class="dot dot-red"></span>
            <span v-if="day.status === 'available'" class="dot dot-green"></span>
          </div>
        </div>
      </q-card>

      <q-card class="status-footer q-mt-md" flat>
        <div class="status-item">
          <div class="status-dot dot-green"></div>
          <span>มีที่นั่งว่าง</span>
        </div>
        <div class="status-item">
          <div class="status-dot dot-red"></div>
          <span>รอบเต็มแล้ว</span>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// ============================================================================
// 1. STATE ของหน้า Page หลัก (ตัวแปรพวกนี้จะถูกส่งไปเป็น Props ให้ Component ลูก)
// ============================================================================

// --- 🔗 [ส่วนเชื่อมต่อ: Props ฝั่ง Calendar] ---
// ข้อมูลจุดสถานะของเดือนนั้นๆ (API จะส่งมาแบบนี้ คุณก็รับไปเป็น Prop ฝั่งปฏิทิน)
const apiMonthlyAvailability = ref<Record<string, 'available' | 'full' | null>>({});

// --- 🔗 [ส่วนเชื่อมต่อ: Props ฝั่งร่วมกัน] ---
// วันที่กำลังเลือกอยู่ (ปฏิทินใช้เพื่อไฮไลท์สีฟ้า / ตารางสอบใช้แสดงหัวข้อวันที่)
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');

// ที่เก็บข้อมูลตารางสอบทั้งหมดที่เคยดึงมา (Key คือ dateString)
const allSchedules = ref<Record<string, { availableSeats: number }[]>>({});

// ============================================================================
// 2. LOGIC ภายใน Calendar Component (ส่วนที่คุณต้องเอาไปใส่ในไฟล์ Calendar.vue)
// ============================================================================
const currentDate = ref(new Date());
const weekdays = ['Mon', 'Tue', 'Wed', 'Thru', 'Fri', 'Sat', 'Sun'];
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
  return firstDay === 0 ? 6 : firstDay - 1;
});

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const daysArray = [];

  for (let i = 1; i <= daysCount; i++) {
    const isToday =
      year === today.getFullYear() && month === today.getMonth() && i === today.getDate();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

    // 🔗 [ส่วนเชื่อมต่อ: การดึง Data]
    // ลำดับความสำคัญ:
    // 1. ถ้ามีข้อมูลตารางสอบที่โหลดมาแล้ว (allSchedules) ให้คำนวณจากจำนวนที่นั่งจริง
    // 2. ถ้ายังไม่มี ให้ใช้ค่าจาก apiMonthlyAvailability (จุดเริ่มต้นจาก API เดือน)
    let status = apiMonthlyAvailability.value[dateString] || null;

    const daySchedules = allSchedules.value[dateString];
    if (daySchedules && daySchedules.length > 0) {
      const hasAvailable = daySchedules.some((s) => s.availableSeats > 0);
      status = hasAvailable ? 'available' : 'full';
    }

    daysArray.push({ value: i, isToday, status, dateString });
  }
  return daysArray;
});

// --- 🔗 [ส่วนเชื่อมต่อ: Emits เวลากดเปลี่ยนเดือน] ---
// ถ้าแยก Component แล้ว ตรงนี้จะใช้ emit('change-month', year, month) แทน
const handlePrevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1,
  );
  fetchMonthAvailabilityFromAPI(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1);
};

const handleNextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1,
  );
  fetchMonthAvailabilityFromAPI(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1);
};

// --- 🔗 [ส่วนเชื่อมต่อ: Emits เวลากดเลือกวัน] ---
// ถ้าแยก Component แล้ว ตรงนี้จะใช้ emit('select-date', day.dateString) แทน
const handleDaySelect = (day: { dateString: string; value: number }) => {
  selectedDate.value = day.dateString;
  fetchDailySchedulesFromAPI(day.dateString);
};

// ============================================================================
// 3. LOGIC ฝั่ง API (จำลองการทำงานของหน้า Page หลัก ที่รับ Emits มาแล้วไปดึงข้อมูล)
// ============================================================================

// จำลองการดึงจุดแดง/เขียวของทั้งเดือน (เรียกเมื่อ Mount และเมื่อเปลี่ยนเดือน)
const fetchMonthAvailabilityFromAPI = (year: number, month: number) => {
  console.log(`📡 Fetching monthly data for ${year}-${month}...`);
  // TODO: เชื่อมต่อ API จริงตรงนี้
  // ตัวอย่าง: const response = await api.get(`/exams/availability?year=${year}&month=${month}`)
  // apiMonthlyAvailability.value = response.data
};

// จำลองการดึงตารางสอบรายวัน (เรียกเมื่อ Mount และเมื่อคลิกเลือกวัน)
const fetchDailySchedulesFromAPI = (dateStr: string) => {
  console.log(`📡 Fetching daily schedules for ${dateStr}...`);
  // TODO: เชื่อมต่อ API จริงตรงนี้
};

// โหลดข้อมูลเริ่มต้น
onMounted(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1;
  fetchMonthAvailabilityFromAPI(year, month);
  fetchDailySchedulesFromAPI(selectedDate.value);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap');

.max-w-1200 {
  max-width: 1200px;
  font-family: 'Kanit', sans-serif;
}
.gap-sm {
  gap: 8px;
}

/* Styles ปฏิทิน */
.calendar-card {
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.calendar-nav-btn {
  font-size: 16px;
  color: #ccc;
  transition: color 0.2s;
}
.calendar-nav-btn:hover {
  color: #000;
}
.calendar-title {
  text-align: center;
}
.calendar-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
}
.calendar-title p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 300;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 8px;
  column-gap: 4px;
  text-align: center;
}
.weekday {
  font-size: 11px;
  font-weight: 400;
  color: #888;
  margin-bottom: 4px;
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
}
.day-cell:not(.empty):hover {
  background-color: #3b82f6;
  color: #fff;
}
.day-cell.active {
  background-color: #1d4ed8;
  color: #fff;
}
.day-cell.today {
  background-color: #f3f4f6;
}
.day-cell.today.active,
.day-cell.today:hover {
  background-color: #1d4ed8;
  color: #fff;
}
.day-cell.empty {
  cursor: default;
  background-color: transparent;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  position: absolute;
  bottom: 4px;
}
.dot-red {
  background-color: #c12a32;
}
.dot-green {
  background-color: #27ae60;
}

.status-footer {
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  justify-content: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}
.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* ตกแต่งการ์ดตารางสอบฝั่งขวา */
.schedule-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}
.border-right {
  border-right: 1px solid #e0e0e0;
}
.border-dashed {
  border: 2px dashed #ccc;
}
</style>
