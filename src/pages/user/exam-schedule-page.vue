<template>
  <div class="page-container exam-schedule q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('examSchedule.registrationTitle')"
      :subtitle="t('examSchedule.registrationSubtitle')"
    />

    <!-- ส่วนบน examdetail -->
    <ExamDetail
      :badge-text="examInfo.badgeText"
      :title="examInfo.title"
      :subtitle="examInfo.subtitle"
      :location-text="examInfo.locationText"
      :fee-text="examInfo.feeText"
    />

    <div class="exam-schedule__content row q-col-gutter-lg q-mt-sm">
      <div class="col-12 col-md-5">
        <ExamCalendar
          v-model="selectedDate"
          :availability="calendarAvailability"
          @change-month="onMonthChange"
          @main-card-resize="onCalendarResize"
        />
      </div>

      <div class="col-12 col-md-7">
        <q-card class="exam-schedule__rounds-section" :style="roundsSectionStyle">
          <q-card-section class="exam-schedule__rounds-header q-pa-none">
            <div class="exam-schedule__rounds-title-row">
              <q-icon name="calendar_today" size="20px" color="dark" class="q-mr-sm" />
              <h3 class="exam-schedule__rounds-title">
                {{ t('examSchedule.title') }} {{ t('examSchedule.dateLabel') }}
                {{ formattedSelectedDate }}
              </h3>
            </div>
            <p class="exam-schedule__rounds-subtitle text-grey-7">
              {{ t('examSchedule.subtitle') }}
            </p>
          </q-card-section>

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
                :reg-start-date="round.regStartDate"
                :reg-end-date="round.regEndDate"
                :exam-date="round.examDate"
                @register="(isExpiredOrNotOpen) => handleRegister(round, isExpiredOrNotOpen)"
              />
            </template>

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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamDetail from 'src/components/exam-detail.vue';
import ExamCalendar from 'src/components/exam-calendar.vue';
import RoundExam from 'src/components/exam/round-exam.vue';
import DialogConfirm from 'src/components/exam/dialog-confirm.vue';
import ExamPasscodeInputDialog from 'src/components/exam-passcode-input-dialog.vue';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { EXAM_TYPE_SPECIAL } from 'src/constants/exam';
import type { ExamRound } from 'src/types/exam';

const $q = useQuasar();
const router = useRouter();
const examStore = useExamStore();
const userStore = useUserStore();
const { t } = useI18n();
const ROUTES = {
  HISTORY: '/user/exam-history',
};

const { examInfo, selectedDate, selectedDateRounds, calendarAvailability, formattedSelectedDate } =
  storeToRefs(examStore);

const showConfirmDialog = ref(false);
const passcodeDialogRef = ref<InstanceType<typeof ExamPasscodeInputDialog> | null>(null);
const selectedRound = ref<ExamRound | null>(null);
const calendarHeight = ref<number>(0);

onMounted(async () => {
  await examStore.initSchedule();
});

const onCalendarResize = (size: { width: number; height: number }): void => {
  calendarHeight.value = size.height;
};

const roundsSectionStyle = computed(() => {
  if ($q.screen.gt.sm && calendarHeight.value > 0) {
    return { maxHeight: `${calendarHeight.value}px` };
  }
  return {};
});

const handleRegister = async (
  round: ExamRound,
  status: 'expired' | 'notOpen' | '' = '',
): Promise<void> => {
  if (status === 'expired') {
    $q.notify({
      type: 'negative',
      message: t('examSchedule.notifications.expired'),
      icon: 'report_problem',
      position: 'top',
      timeout: 2500,
      actions: [{ icon: 'close', color: 'white' }],
    });
    return;
  }

  if (status === 'notOpen') {
    $q.notify({
      type: 'negative',
      message: t('examSchedule.notifications.notOpen'),
      icon: 'report_problem',
      position: 'top',
      timeout: 2500,
      actions: [{ icon: 'close', color: 'white' }],
    });
    return;
  }

  if (!userStore.isLoggedIn) {
    $q.notify({
      type: 'warning',
      message: t('examSchedule.notifications.pleaseLogin'),
      icon: 'login',
      position: 'top',
      timeout: 2500,
    });
    await router.push({ name: 'login' });
    return;
  }

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
  if (round.roundTypeLabel === EXAM_TYPE_SPECIAL) {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onMonthChange = (month: number, year: number): void => {
  // ในอนาคต: ดึงข้อมูล scheduleData ใหม่ของเดือนนั้นๆ จาก API
};
</script>
