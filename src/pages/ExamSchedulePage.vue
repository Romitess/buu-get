<template>
  <div class="page-container">
    <!-- ==================== ส่วนบน: ExamDetail ==================== -->
    <ExamDetail
      :badge-text="dynamicBadgeText"
      :title="examInfo.title"
      :subtitle="examInfo.subtitle"
      :location-text="currentDayDetails.location"
      :fee-text="currentDayDetails.fee"
    />

    <!-- ==================== ส่วนล่าง: Calendar (ซ้าย) + Rounds (ขวา) ==================== -->
    <div class="schedule-content row q-col-gutter-lg q-mt-sm">
      <!-- ฝั่งซ้าย: ปฏิทิน -->
      <div class="col-12 col-md-5">
        <ExamCalendar
          v-model="selectedDate"
          :availability="calendarAvailability"
          @change-month="onMonthChange"
        />
      </div>

      <!-- ฝั่งขวา: รอบสอบ -->
      <div class="col-12 col-md-7">
        <div class="rounds-section">
          <!-- หัวข้อรอบสอบ -->
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

    <ExamPasscodeInputDialog ref="passcodeDialogRef" @confirm="onPasscodeConfirm" />
  </div>
</template>

<script setup lang="ts">
/**
 * ExamSchedulePage
 * จัดการข้อมูลรอบสอบและปฏิทินแบบ Real-time พร้อมระบบแจ้งเตือน
 */
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import ExamDetail from 'src/components/ExamDetail.vue';
import ExamCalendar from 'src/components/ExamCalendar.vue';
import RoundExam from 'src/components/exam/RoundExam.vue';
import DialogConfirm from 'src/components/exam/DialogConfirm.vue';
import ExamPasscodeInputDialog from 'src/components/exam-passcode-input-dialog.vue';
import type { ExamRound, ExamInfo } from 'src/components/models';

const $q = useQuasar();

// ============================================================================
// 1. STATE & REALISTIC MOCKUP DATA
// ============================================================================

interface DayData {
  rounds: ExamRound[];
  location: string;
  fee: string;
}

const examInfo = ref<ExamInfo>({
  badgeText: 'รอบทั่วไป',
  title: 'การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET',
  subtitle: 'เลือกวันที่และเวลาที่สะดวกในการมาทดสอบ โดยตรวจสอบจำนวนที่นั่งว่างในแต่ละช่วงเวลา',
  locationText: 'Computer Center , BUU (201)',
  feeText: 'Fee : 500 ฿',
});

/** วันที่เลือก (Default เป็นวันนี้) */
const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');

/**
 * Mockup ข้อมูลรายวัน (สถาบันภาษา ม.บูรพา)
 * แบ่งตามสถานที่สอบและประเภทการสอบที่สมจริง
 */
const mockupData = ref<Record<string, DayData>>({
  // --- รอบทั่วไป: อาคารสำนักคอมพิวเตอร์ (Computer Center) ---
  '2026-05-06': {
    location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์ ชั้น 2)',
    fee: 'Fee : 500 ฿',
    rounds: [
      {
        id: 101,
        title: 'BUU - GET (General)',
        timeRange: '08:00 - 10:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 15,
        totalSeats: 30,
      },
      {
        id: 102,
        title: 'BUU - GET (General)',
        timeRange: '10:00 - 12:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 5,
        totalSeats: 30,
      },
      {
        id: 103,
        title: 'BUU - GET (General)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 22,
        totalSeats: 30,
      },
    ],
  },
  '2026-05-13': {
    location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์ ชั้น 2)',
    fee: 'Fee : 500 ฿',
    rounds: [
      {
        id: 201,
        title: 'BUU - GET (General)',
        timeRange: '09:00 - 11:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 28,
        totalSeats: 30,
      },
      {
        id: 202,
        title: 'BUU - GET (General)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 10,
        totalSeats: 30,
      },
    ],
  },

  // --- รอบพิเศษ: อาคารปฏิบัติการรวม (Building 600) ---
  '2026-05-11': {
    location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
    fee: 'Fee : 800 ฿',
    rounds: [
      {
        id: 501,
        title: 'BUU - GET (Special)',
        timeRange: '08:30 - 10:30',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 5,
        totalSeats: 20,
      },
      {
        id: 502,
        title: 'BUU - GET (Special)',
        timeRange: '13:30 - 15:30',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 12,
        totalSeats: 20,
      },
    ],
  },
  '2026-05-18': {
    location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
    fee: 'Fee : 800 ฿',
    rounds: [
      {
        id: 601,
        title: 'BUU - GET (Special)',
        timeRange: '10:00 - 12:00',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 2,
        totalSeats: 15,
      },
    ],
  },

  // --- รอบทั่วไป: อาคารเฉลิมพระเกียรติ (QS Building) ---
  '2026-05-20': {
    location: 'QS Building (อาคารเฉลิมพระเกียรติ คณะศึกษาศาสตร์)',
    fee: 'Fee : 500 ฿',
    rounds: [
      {
        id: 301,
        title: 'BUU - GET (General)',
        timeRange: '08:00 - 10:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 12,
        totalSeats: 30,
      },
      {
        id: 302,
        title: 'BUU - GET (General)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 30,
        totalSeats: 30,
      },
    ],
  },

  // --- วันที่เต็มแล้ว (Fully Booked) ---
  '2026-05-08': {
    location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์)',
    fee: 'Fee : 500 ฿',
    rounds: [
      {
        id: 801,
        title: 'BUU - GET (General)',
        timeRange: '08:00 - 10:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 0,
        totalSeats: 30,
      },
      {
        id: 802,
        title: 'BUU - GET (General)',
        timeRange: '10:00 - 12:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 0,
        totalSeats: 30,
      },
    ],
  },
  '2026-05-15': {
    location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
    fee: 'Fee : 800 ฿',
    rounds: [
      {
        id: 901,
        title: 'BUU - GET (Special)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 0,
        totalSeats: 20,
      },
    ],
  },
});

// --- Dialog State ---
const showConfirmDialog = ref(false);
const passcodeDialogRef = ref<InstanceType<typeof ExamPasscodeInputDialog> | null>(null);
const selectedRound = ref<ExamRound | null>(null);

// ============================================================================
// 2. COMPUTED (Real-time Reactivity)
// ============================================================================

/** กรองรอบสอบตามวันที่เลือก */
const selectedDateRounds = computed((): ExamRound[] => {
  return mockupData.value[selectedDate.value]?.rounds || [];
});

/** ข้อมูลสถานที่และค่าธรรมเนียมตามวันที่เลือก */
const currentDayDetails = computed(() => {
  return (
    mockupData.value[selectedDate.value] || {
      location: 'กรุณาเลือกวันที่เพื่อดูสถานที่สอบ',
      fee: 'Fee : - ฿',
    }
  );
});

/** Badge Text เปลี่ยนตามข้อมูลรอบสอบในวันที่เลือก */
const dynamicBadgeText = computed((): string => {
  const rounds = selectedDateRounds.value;
  return rounds[0]?.roundTypeLabel ?? 'ไม่มีรอบสอบ';
});

/** คำนวณสถานะจุดในปฏิทิน */
const calendarAvailability = computed((): Record<string, 'available' | 'full' | null> => {
  const result: Record<string, 'available' | 'full' | null> = {};
  Object.entries(mockupData.value).forEach(([date, data]) => {
    const hasAvailable = data.rounds.some((r) => r.availableSeats > 0);
    result[date] = hasAvailable ? 'available' : 'full';
  });
  return result;
});

/** แปลง selectedDate เป็นรูปแบบไทย */
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
  const buddhistYear = date.getFullYear() + 543;
  return `${date.getDate()} ${monthNamesTH[date.getMonth()]} ${buddhistYear}`;
});

// ============================================================================
// 3. METHODS
// ============================================================================

const handleRegister = (round: ExamRound): void => {
  if (round.availableSeats === 0) {
    $q.notify({
      type: 'negative',
      message: 'ขออภัย รอบสอบนี้ไม่มีที่ว่างแล้ว (เต็ม)',
      icon: 'report_problem',
      position: 'top',
      timeout: 2500,
      actions: [{ icon: 'close', color: 'white' }],
    });
    return;
  }
  selectedRound.value = round;

  // ตรวจสอบประเภทรอบสอบเพื่อเลือก Dialog ที่เหมาะสม
  if (round.roundTypeLabel === 'รอบพิเศษ') {
    passcodeDialogRef.value?.openDialog();
  } else {
    showConfirmDialog.value = true;
  }
};

const onConfirmRegistration = (): void => {
  showConfirmDialog.value = false;
  // Placeholder สำหรับการต่อยอด Payment API ในอนาคต
  console.log('✅ ยืนยันการสมัครรอบทั่วไป:', selectedRound.value?.id);
};

const onPasscodeConfirm = (passcode: string): void => {
  console.log('🔑 ยืนยันรหัสผ่านรอบพิเศษ:', passcode, 'สำหรับรอบ:', selectedRound.value?.id);
  // ตรวจสอบความถูกต้องของ Passcode ที่นี่ในอนาคต
  $q.notify({
    type: 'positive',
    message: 'ตรวจสอบรหัสผ่านสำเร็จ กำลังดำเนินการต่อ...',
    position: 'top',
    timeout: 2000,
  });
};

const onMonthChange = (month: number, year: number): void => {
  console.log(`📅 เปลี่ยนเดือนเป็น: ${month}/${year}`);
  // ในอนาคต: ดึงข้อมูล mockupData ใหม่ของเดือนนั้นๆ จาก API
};
</script>

<style scoped lang="scss">
.page-container {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 24px;
}

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
    padding-left: 28px;
  }
}

.rounds-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rounds-empty {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  background: #fafafa;
}

@media (max-width: 1024px) {
  .schedule-content {
    flex-direction: column;
  }
}
</style>
