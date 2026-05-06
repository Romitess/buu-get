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
          <div
            class="rounds-list"
            :style="{ overflowY: selectedDateRounds.length > 3 ? 'auto' : 'hidden' }"
          >
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
 * ข้อมูลทั้งหมดดึงจาก useExamStore (Pinia)
 */
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import ExamDetail from 'src/components/ExamDetail.vue';
import ExamCalendar from 'src/components/ExamCalendar.vue';
import RoundExam from 'src/components/exam/RoundExam.vue';
import DialogConfirm from 'src/components/exam/DialogConfirm.vue';
import ExamPasscodeInputDialog from 'src/components/exam-passcode-input-dialog.vue';
import { useExamStore } from 'src/stores/exam.store';
import type { ExamRound } from 'src/components/models';

const $q = useQuasar();
const examStore = useExamStore();

// ============================================================================
// 1. STATE จาก Store (Reactive ผ่าน storeToRefs)
// ============================================================================

const {
  examInfo,
  selectedDate,
  selectedDateRounds,
  currentDayDetails,
  dynamicBadgeText,
  calendarAvailability,
  formattedSelectedDate,
} = storeToRefs(examStore);

// --- Dialog State (UI-only, ไม่ต้องอยู่ใน Store) ---
const showConfirmDialog = ref(false);
const passcodeDialogRef = ref<InstanceType<typeof ExamPasscodeInputDialog> | null>(null);
const selectedRound = ref<ExamRound | null>(null);

// ============================================================================
// 2. METHODS
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
  if (selectedRound.value) {
    examStore.confirmRegistration(selectedRound.value);
    $q.notify({
      type: 'positive',
      message: 'ลงทะเบียนสอบสำเร็จ กรุณาชำระเงินภายในเวลาที่กำหนด',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
  }
};

const onPasscodeConfirm = (passcode: string): void => {
  if (selectedRound.value) {
    examStore.confirmSpecialRegistration(selectedRound.value, passcode);
    $q.notify({
      type: 'positive',
      message: 'ตรวจสอบรหัสผ่านสำเร็จ ลงทะเบียนสอบเรียบร้อย',
      position: 'top',
      timeout: 2000,
    });
  }
};

const onMonthChange = (month: number, year: number): void => {
  console.log(`📅 เปลี่ยนเดือนเป็น: ${month}/${year}`);
  // ในอนาคต: ดึงข้อมูล scheduleData ใหม่ของเดือนนั้นๆ จาก API
};
</script>

<style scoped lang="scss">
.page-container {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 16px 24px;
}

.schedule-content {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.rounds-section {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  height: fit-content;
  max-height: 536px;
  overflow: hidden;
}

.rounds-header {
  flex: 0 0 auto;
  margin-bottom: 20px;
  &__title-row {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }
  &__title {
    font-size: 1.2rem;
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
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 8px;
  min-height: 0;
  scrollbar-gutter: stable; /* เพิ่มเพื่อให้ขนาดบล็อกนิ่งขึ้นเมื่อมี Scrollbar */

  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
    &:hover {
      background: #999;
    }
  }
}

.rounds-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  background: #fafafa;
}

@media (max-width: 1024px) {
  .schedule-content {
    flex-direction: column;
    align-items: stretch;
  }
  .rounds-section {
    max-height: 500px; /* ยึดความสูงสูงสุดไว้เพื่อให้เลื่อนดูรอบสอบภายในได้สะดวก */
  }
}

@media (max-width: 600px) {
  .page-container {
    padding: 12px 16px;
  }

  .rounds-section {
    padding: 16px;
    max-height: 480px;
  }

  .rounds-header {
    margin-bottom: 16px;
    &__title {
      font-size: 1.1rem;
    }
    &__subtitle {
      font-size: 0.8rem;
      padding-left: 28px;
    }
  }
}
</style>
