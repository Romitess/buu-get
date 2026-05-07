<template>
  <div class="page-container exam-schedule">
    <!-- ส่วนบน examdetail -->
    <ExamDetail
      :badge-text="dynamicBadgeText"
      :title="examInfo.title"
      :subtitle="examInfo.subtitle"
      :location-text="currentDayDetails.location"
      :fee-text="currentDayDetails.fee"
    />

    <!-- ส่วนล่าง calendar + roundexam -->
    <div class="exam-schedule__content row q-col-gutter-lg q-mt-sm">
      <!-- ฝั่งซ้าย ปฏิทิน -->
      <div class="col-12 col-md-5">
        <ExamCalendar
          v-model="selectedDate"
          :availability="calendarAvailability"
          @change-month="onMonthChange"
          @main-card-resize="onCalendarResize"
        />
      </div>

      <!-- ฝั่งขวา รอบสอบ -->
      <div class="col-12 col-md-7">
        <q-card class="exam-schedule__rounds-section" :style="roundsSectionStyle">
          <!-- หัวข้อรอบสอบ -->
          <q-card-section class="exam-schedule__rounds-header q-pa-none">
            <div class="exam-schedule__rounds-title-row">
              <q-icon name="calendar_today" size="20px" color="dark" class="q-mr-sm" />
              <h3 class="exam-schedule__rounds-title">
                {{ t('examSchedule.title') }}วันที่ {{ formattedSelectedDate }}
              </h3>
            </div>
            <p class="exam-schedule__rounds-subtitle text-grey-7">
              {{ t('examSchedule.subtitle') }}
            </p>
          </q-card-section>

          <!-- รายการรอบสอบ -->
          <div
            class="exam-schedule__rounds-list"
            :style="{
              overflowY: $q.screen.lt.md || selectedDateRounds.length >= 3 ? 'auto' : 'hidden',
            }"
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
            <q-card-section v-else class="exam-schedule__rounds-empty text-center q-pa-xl">
              <q-icon name="event_busy" size="48px" color="grey-4" />
              <p class="text-grey-6 q-mt-md">{{ t('examSchedule.emptyRounds') }}</p>
            </q-card-section>
          </div>
        </q-card>
      </div>
    </div>

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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import ExamDetail from 'src/components/exam-detail.vue';
import ExamCalendar from 'src/components/exam-calendar.vue';
import RoundExam from 'src/components/exam/round-exam.vue';
import DialogConfirm from 'src/components/exam/dialog-confirm.vue';
import ExamPasscodeInputDialog from 'src/components/exam-passcode-input-dialog.vue';
import { useExamStore } from 'src/stores/exam.store';
import type { ExamRound } from 'src/types/exam';

const $q = useQuasar();
const router = useRouter();
const examStore = useExamStore();
const { t } = useI18n();
const ROUTES = {
  HISTORY: '/exam-history',
};

const {
  examInfo,
  selectedDate,
  selectedDateRounds,
  currentDayDetails,
  dynamicBadgeText,
  calendarAvailability,
  formattedSelectedDate,
} = storeToRefs(examStore);

const showConfirmDialog = ref(false);
const passcodeDialogRef = ref<InstanceType<typeof ExamPasscodeInputDialog> | null>(null);
const selectedRound = ref<ExamRound | null>(null);
const calendarHeight = ref<number>(0);

const onCalendarResize = (size: { width: number; height: number }) => {
  calendarHeight.value = size.height;
};

const roundsSectionStyle = computed(() => {
  if ($q.screen.gt.sm && calendarHeight.value > 0) {
    if (selectedDateRounds.value.length >= 3) {
      return { height: `${calendarHeight.value}px` };
    }
    return { maxHeight: `${calendarHeight.value}px` };
  }
  return {};
});

const handleRegister = (round: ExamRound): void => {
  if (round.availableSeats === 0) {
    $q.notify({
      type: 'negative',
      message: t('examSchedule.notifications.roundFull'),
      icon: 'report_problem',
      position: 'top',
      timeout: 2500,
      actions: [{ icon: 'close', color: 'white' }],
    });
    return;
  }
  selectedRound.value = round;
  if (round.roundTypeLabel === 'รอบพิเศษ') {
    passcodeDialogRef.value?.openDialog();
  } else {
    showConfirmDialog.value = true;
  }
};

const onConfirmRegistration = async (): Promise<void> => {
  showConfirmDialog.value = false;
  if (selectedRound.value) {
    examStore.confirmRegistration(selectedRound.value);
    $q.notify({
      type: 'positive',
      message: t('examSchedule.notifications.registrationSuccess'),
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
    });
    await router.push(ROUTES.HISTORY);
  }
};

const onPasscodeConfirm = async (passcode: string): Promise<void> => {
  if (selectedRound.value) {
    examStore.confirmSpecialRegistration(selectedRound.value, passcode);
    $q.notify({
      type: 'positive',
      message: t('examSchedule.notifications.passcodeSuccess'),
      position: 'top',
      timeout: 2000,
    });
    await router.push(ROUTES.HISTORY);
  }
};

const onMonthChange = (month: number, year: number): void => {
  console.log(`เปลี่ยนเดือนเป็น: ${month}/${year}`);
  // ในอนาคต: ดึงข้อมูล scheduleData ใหม่ของเดือนนั้นๆ จาก API
};
</script>

<style scoped lang="scss">
.page-container {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 16px 24px;
}

/* Override ขนาดปฏิทินที่โดน Fix มาจากข้างใน component */
:deep(.calendar-card) {
  width: 100% !important; /* บังคับให้เต็มคอลัมน์ */
  height: auto !important; /* ปล่อยให้สูงตามเนื้อหา */
  min-height: 440px; /* กำหนดความสูงขั้นต่ำให้ดูสมดุล */
}

.exam-schedule {
  &__content {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  &__rounds-section {
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
    overflow: hidden;
    border: none;
  }

  &__rounds-header {
    flex: 0 0 auto;
    margin-bottom: 20px;
  }

  &__rounds-title-row {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
  }

  &__rounds-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }

  &__rounds-subtitle {
    font-size: 0.85rem;
    margin: 0;
    padding-left: 28px;
  }

  &__rounds-list {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    padding-right: 8px;
    min-height: 0;
    scrollbar-gutter: stable;

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

  &__rounds-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-md);
    background: #fafafa;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .exam-schedule__content {
    flex-direction: column;
    align-items: stretch;
  }
  .exam-schedule__rounds-section {
    max-height: 500px;
    margin-top: 24px;
  }
}

@media (max-width: 600px) {
  .page-container {
    padding: 12px 16px;
  }

  .exam-schedule__rounds-section {
    padding: 16px;
    max-height: 480px;
  }

  .exam-schedule__rounds-title {
    font-size: 1.1rem;
  }

  .exam-schedule__rounds-subtitle {
    font-size: 0.8rem;
    padding-left: 28px;
  }
}
</style>
