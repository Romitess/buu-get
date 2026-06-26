<template>
  <div class="page-container exam-schedule q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('examSchedule.registrationTitle')"
      :subtitle="t('examSchedule.registrationSubtitle')"
    />

    <ExamDetail
      :badge-text="examInfo.badgeText"
      :title="examInfo.title"
      :subtitle="examInfo.subtitle"
      :location-text="examInfo.locationText"
      :fee-text="examInfo.feeText"
      :format-text="examInfo.formatText"
    />

    <div class="exam-schedule__content row q-col-gutter-lg q-mt-sm">
      <div class="col-12 col-md-5">
        <ExamCalendar
          v-model="selectedDate"
          :availability="calendarAvailability"
          :schedule-data="scheduleData"
          :current-time="calendarNow"
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
              overflowY: roundsListOverflow,
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
      :exam-fee="examInfo.feeText"
      @confirm="onConfirmRegistration"
    />

    <ExamPasscodeInputDialog ref="passcodeDialogRef" @confirm="onPasscodeConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamDetail from 'src/components/exam-detail.vue';
import ExamCalendar from 'src/components/exam/exam-calendar.vue';
import RoundExam from 'src/components/exam/round-exam.vue';
import DialogConfirm from 'src/components/exam/dialog-confirm.vue';
import ExamPasscodeInputDialog from 'src/components/exam-passcode-input-dialog.vue';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { EXAM_TYPE_SPECIAL } from 'src/constants/exam';
import { api } from 'src/boot/axios';
import type { ExamRound } from 'src/types/exam';

const $q = useQuasar();
const router = useRouter();
const examStore = useExamStore();
const userStore = useUserStore();
const { t } = useI18n();
const ROUTES = {
  HISTORY: '/user/exam-history',
};

const {
  examInfo,
  selectedDate,
  selectedDateRounds,
  calendarAvailability,
  formattedSelectedDate,
  scheduleData,
} = storeToRefs(examStore);

interface ExamPasscodeDialogExpose {
  openDialog: () => void;
  closeDialog: () => void;
}

const showConfirmDialog = ref(false);
const passcodeDialogRef = ref<ExamPasscodeDialogExpose | null>(null);
const selectedRound = ref<ExamRound | null>(null);
const savedPasscode = ref<string | undefined>(undefined);
const calendarHeight = ref<number>(0);
const calendarNow = ref(new Date());
const calendarServerOffset = ref(0);

const roundsListOverflow = computed(() => ($q.screen.gt.sm ? 'auto' : 'visible'));

let scheduleInterval: ReturnType<typeof setInterval>;
let calendarClockInterval: ReturnType<typeof setInterval> | null = null;
let calendarClockResyncInterval: ReturnType<typeof setInterval> | null = null;

const getSyncedCalendarTime = (): Date => new Date(Date.now() + calendarServerOffset.value);

const updateCalendarNow = (): void => {
  calendarNow.value = getSyncedCalendarTime();
};

const syncCalendarTime = async (): Promise<void> => {
  const start = Date.now();

  try {
    const response = await api.get<{ serverTime: string }>('/exam/time', { params: { _t: start } });
    if (response.data.serverTime) {
      const serverTime = new Date(response.data.serverTime).getTime();
      const end = Date.now();
      const latency = (end - start) / 2;
      calendarServerOffset.value = serverTime + latency - end;
    }
  } catch {
    try {
      const response = await api.get<unknown>('/exam', { params: { _t: start } });
      const serverDate = response.headers['date'];
      if (serverDate) {
        const serverTime = new Date(serverDate).getTime();
        const end = Date.now();
        const latency = (end - start) / 2;
        calendarServerOffset.value = serverTime + latency - end;
      }
    } catch (err) {
      console.error('[CalendarTimeSync] Failed to sync with backend', err);
    }
  } finally {
    updateCalendarNow();
  }
};

onMounted(async () => {
  // Read the date from query parameter if provided
  const dateFromQuery = router.currentRoute.value.query.date;
  if (dateFromQuery && typeof dateFromQuery === 'string') {
    selectedDate.value = dateFromQuery;
  }

  await syncCalendarTime();
  await examStore.initSchedule();
  scheduleInterval = setInterval(() => {
    void examStore.initSchedule();
  }, 5000);
  calendarClockInterval = setInterval(updateCalendarNow, 1000);
  calendarClockResyncInterval = setInterval(() => {
    void syncCalendarTime();
  }, 60000);
});

onUnmounted(() => {
  if (scheduleInterval) {
    clearInterval(scheduleInterval);
  }
  if (calendarClockInterval) {
    clearInterval(calendarClockInterval);
  }
  if (calendarClockResyncInterval) {
    clearInterval(calendarClockResyncInterval);
  }
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

  selectedRound.value = round;
  savedPasscode.value = undefined;
  if (round.roundTypeLabel === EXAM_TYPE_SPECIAL) {
    passcodeDialogRef.value?.openDialog();
  } else {
    showConfirmDialog.value = true;
  }
};

const onConfirmRegistration = async (physicalStatus?: string): Promise<void> => {
  showConfirmDialog.value = false;
  if (selectedRound.value) {
    try {
      if (selectedRound.value.roundTypeLabel === EXAM_TYPE_SPECIAL) {
        await examStore.confirmSpecialRegistration(
          selectedRound.value,
          savedPasscode.value || '',
          physicalStatus,
        );
        $q.notify({
          type: 'positive',
          message: t('examSchedule.notifications.passcodeSuccess'),
          position: 'top',
          timeout: 2000,
        });
      } else {
        await examStore.confirmRegistration(selectedRound.value, undefined, physicalStatus);
        $q.notify({
          type: 'positive',
          message: t('examSchedule.notifications.registrationSuccess'),
          icon: 'check_circle',
          position: 'top',
          timeout: 3000,
        });
      }
      await router.push(ROUTES.HISTORY);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: {
            message?: string | string[];
          };
        };
        message?: string;
      };
      const status = error?.response?.status;
      const resMsg = error?.response?.data?.message;
      let msg = t('examSchedule.notifications.unknownError', {
        message: Array.isArray(resMsg) ? resMsg.join(', ') : resMsg || error.message || 'Unknown',
      });

      if (status === 409) {
        msg = t('examSchedule.notifications.alreadyRegistered');
      } else if (status === 400 && resMsg === 'FULL') {
        msg = t('examSchedule.notifications.roundFull');
      } else if (status === 400 && resMsg === 'Invalid passcode for this user and exam') {
        msg = t('examSchedule.notifications.invalidPasscode');
      } else if (status === 404) {
        msg = t('examSchedule.notifications.notFound');
      } else if (status && status >= 500) {
        msg = t('examSchedule.notifications.serverError');
      }

      $q.notify({
        type: 'negative',
        message: msg,
        icon: 'report_problem',
        position: 'top',
        timeout: 3000,
      });
    }
  }
};

const onPasscodeConfirm = (passcode: string): void => {
  savedPasscode.value = passcode;
  showConfirmDialog.value = true;
};

const onMonthChange = (): void => {};
</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .page-container {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>
