<template>
  <div class="page-container">
    <!-- ==================== ส่วนบน: ExamDetail ==================== -->
    <ExamDetail
      :badge-text="examInfo.badgeText"
      :title="examInfo.title"
      :subtitle="examInfo.subtitle"
      :location-text="examInfo.locationText"
      :fee-text="examInfo.feeText"
    />

    <!-- ==================== ส่วนล่าง: Calendar (ซ้าย) + Rounds (ขวา) ==================== -->
    <div class="schedule-content row q-col-gutter-lg q-mt-md">
      <!-- ฝั่งซ้าย: ปฏิทิน -->
      <div class="col-12 col-md-5">
        <ExamCalendar />
      </div>

      <!-- ฝั่งขวา: รอบสอบ -->
      <div class="col-12 col-md-7">
        <div class="rounds-section">
          <!-- หัวข้อรอบสอบ ตาม Figma -->
          <div class="rounds-header">
            <div class="rounds-header__title-row">
              <q-icon name="calendar_today" size="20px" color="dark" class="q-mr-sm" />
              <h3 class="rounds-header__title">รอบสอบวันที่ {{ formattedSelectedDate }}</h3>
            </div>
            <p class="rounds-header__subtitle text-grey-7">
              กรุณาเลือกรอบเวลาที่ท่านต้องการลงทะเบียน
            </p>
          </div>

          <!-- รายการรอบสอบ -->
          <div class="rounds-list">
            <template v-if="selectedDateRounds.length > 0">
              <RoundExam
                v-for="round in selectedDateRounds"
                :key="round.id"
                :title="round.title"
                :time-range="round.timeRange"
                :available-seats="round.availableSeats"
                :total-seats="round.totalSeats"
                :round-type-label="round.roundTypeLabel"
                @register="handleRegister(round)"
              />
            </template>

            <!-- กรณีไม่มีรอบสอบในวันที่เลือก -->
            <div v-else class="rounds-empty text-center q-pa-xl">
              <q-icon name="event_busy" size="48px" color="grey-4" />
              <p class="text-grey-6 q-mt-md">ไม่มีรอบสอบในวันที่เลือก</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== Dialogs ==================== -->
    <DialogConfirm
      v-model="showConfirmDialog"
      :exam-date="formattedSelectedDate"
      :exam-time="selectedRound?.timeRange || ''"
      @confirm="onConfirmRegistration"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ExamSchedulePage
 * หน้ารายการสอบ — แสดง ExamDetail (ส่วนบน), ExamCalendar (ซ้าย), RoundExam (ขวา)
 * ข้อมูลทั้งหมดจัดการที่ระดับ Page เพื่อรองรับการเชื่อมต่อ API ในอนาคต
 */
import { ref, computed } from 'vue';
import ExamDetail from 'src/components/ExamDetail.vue';
import ExamCalendar from 'src/components/ExamCalendar.vue';
import RoundExam from 'src/components/exam/RoundExam.vue';
import DialogConfirm from 'src/components/exam/DialogConfirm.vue';
import type { ExamRound, ExamInfo } from 'src/components/models';

// ============================================================================
// 1. STATE — ข้อมูลหลักของหน้า (พร้อมเชื่อม API ในอนาคต)
// ============================================================================

/** ข้อมูลรายละเอียดการสอบ (ส่วนบน) */
const examInfo = ref<ExamInfo>({
  badgeText: 'รอบทั่วไป',
  title: 'การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET',
  subtitle: 'เลือกวันที่และเวลาที่สะดวกในการมาทดสอบ โดยตรวจสอบจำนวนที่นั่งว่างในแต่ละช่วงเวลา',
  locationText: 'Computer Center , BUU (201)',
  feeText: 'Fee : 500 ฿',
});

/** วันที่ที่เลือกอยู่ (format: YYYY-MM-DD) */
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');

/** รอบสอบทั้งหมด — Mock data (จะถูกแทนที่ด้วย API response ในอนาคต) */
// TODO: เชื่อมต่อ API — เรียก fetchRounds(selectedDate) เมื่อ selectedDate เปลี่ยน
const examRounds = ref<ExamRound[]>([
  {
    id: 1,
    timeRange: '08:00 - 10:00',
    title: 'BUU - GET (Genaral)',
    roundTypeLabel: 'รอบทั่วไป',
    availableSeats: 15,
    totalSeats: 30,
  },
  {
    id: 2,
    timeRange: '10:00 - 12:00',
    title: 'BUU - GET (Genaral)',
    roundTypeLabel: 'รอบทั่วไป',
    availableSeats: 15,
    totalSeats: 30,
  },
  {
    id: 3,
    timeRange: '13:00 - 15:00',
    title: 'BUU - GET (Genaral)',
    roundTypeLabel: 'รอบทั่วไป',
    availableSeats: 0,
    totalSeats: 30,
  },
  {
    id: 4,
    timeRange: '15:00 - 17:00',
    title: 'BUU - GET (Genaral)',
    roundTypeLabel: 'รอบทั่วไป',
    availableSeats: 15,
    totalSeats: 30,
  },
]);

// --- Dialog State ---
/** ควบคุมการแสดง Dialog ยืนยัน */
const showConfirmDialog = ref(false);
/** รอบที่ผู้ใช้เลือกกดลงทะเบียน */
const selectedRound = ref<ExamRound | null>(null);

// ============================================================================
// 2. COMPUTED
// ============================================================================

/** แปลง selectedDate เป็นรูปแบบไทย เช่น '15 พฤษภาคม 2569' */
const formattedSelectedDate = computed((): string => {
  if (!selectedDate.value) return '';

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

  const date = new Date(selectedDate.value);
  const day = date.getDate();
  const month = monthNamesTH[date.getMonth()];
  const buddhistYear = date.getFullYear() + 543;

  return `${day} ${month} ${buddhistYear}`;
});

/** รอบสอบที่แสดงตามวันที่เลือก — ในอนาคตจะกรองจาก API response */
// TODO: เมื่อเชื่อม API จริง ให้ filter จาก response ตาม selectedDate
const selectedDateRounds = computed((): ExamRound[] => {
  return examRounds.value;
});

// ============================================================================
// 3. METHODS
// ============================================================================

/** จัดการเมื่อผู้ใช้กดลงทะเบียนรอบสอบ */
const handleRegister = (round: ExamRound): void => {
  selectedRound.value = round;
  showConfirmDialog.value = true;
};

/** จัดการเมื่อกดยืนยันใน Dialog */
const onConfirmRegistration = (): void => {
  showConfirmDialog.value = false;
  console.log('✅ ยืนยันการสมัครสอบรอบ:', selectedRound.value?.id, selectedRound.value?.timeRange);
  // ในอนาคตสามารถเพิ่ม Logic นำทางไปหน้าชำระเงิน หรือเรียก API ที่นี่
};
</script>

<style scoped lang="scss">
.page-container {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 24px;
}

// ==================== Rounds Section ====================
.rounds-section {
  height: 100%;
}

.rounds-header {
  margin-bottom: 20px;

  &__title-row {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  &__subtitle {
    font-size: 0.85rem;
    margin: 0;
    padding-left: 28px; // align กับ title (icon 20px + margin 8px)
  }
}

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 0; // RoundExam มี margin-bottom ในตัวแล้ว
}

.rounds-empty {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  background: #fafafa;
}

// ==================== Responsive ====================
@media (max-width: 1024px) {
  .schedule-content {
    flex-direction: column;
  }
}
</style>
