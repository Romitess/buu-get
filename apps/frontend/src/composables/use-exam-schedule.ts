import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import type { AxiosError } from 'axios';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import {
  EXAM_TYPE_SPECIAL,
  POLLING_INTERVAL_MS,
  NOTIFY_TIMEOUT_SHORT,
  NOTIFY_TIMEOUT_DEFAULT,
  NOTIFY_TIMEOUT_LONG,
  ROUNDS_SCROLL_THRESHOLD,
  HTTP_STATUS,
} from 'src/constants/exam';
import type { ExamRound } from 'src/types/exam';

type RegistrationStatus = 'expired' | 'notOpen' | '';

interface ApiErrorData {
  message?: string | string[];
}

interface ExamPasscodeDialogExpose {
  openDialog: () => void;
  closeDialog: () => void;
}

const ROUTE_NAMES = {
  HISTORY: 'exam-history',
  LOGIN: 'login',
} as const;

export function useExamSchedule() {
  const $q = useQuasar();
  const router = useRouter();
  const examStore = useExamStore();
  const userStore = useUserStore();
  const { t } = useI18n();

  const {
    examInfo,
    selectedDate,
    selectedDateRounds,
    calendarAvailability,
    formattedSelectedDate,
  } = storeToRefs(examStore);

  const showConfirmDialog = ref(false);
  const passcodeDialogRef = ref<ExamPasscodeDialogExpose | null>(null);
  const selectedRound = ref<ExamRound | null>(null);
  const calendarHeight = ref<number>(0);
  let scheduleInterval: ReturnType<typeof setInterval>;

  const roundsSectionStyle = computed(() => {
    if ($q.screen.gt.sm && calendarHeight.value > 0) {
      return { maxHeight: `${calendarHeight.value}px` };
    }
    return {};
  });

  const roundsListOverflow = computed((): 'auto' | 'hidden' => {
    return $q.screen.lt.md || selectedDateRounds.value.length >= ROUNDS_SCROLL_THRESHOLD
      ? 'auto'
      : 'hidden';
  });

  const onCalendarResize = (size: { width: number; height: number }): void => {
    calendarHeight.value = size.height;
  };

  const onMonthChange = (): void => {};

  const getRegistrationErrorMessage = (err: unknown): string => {
    const error = err as AxiosError<ApiErrorData>;
    const status = error?.response?.status;
    const resMsg = error?.response?.data?.message;

    if (status === HTTP_STATUS.CONFLICT) {
      return t('examSchedule.notifications.alreadyRegistered');
    }
    if (status === HTTP_STATUS.BAD_REQUEST && resMsg === 'FULL') {
      return t('examSchedule.notifications.roundFull');
    }
    if (
      status === HTTP_STATUS.BAD_REQUEST &&
      (resMsg === 'REGISTRATION_CLOSED' || resMsg === 'EXAM_STARTED')
    ) {
      return t('examSchedule.notifications.expired');
    }
    if (status === HTTP_STATUS.BAD_REQUEST && resMsg === 'REGISTRATION_NOT_OPEN') {
      return t('examSchedule.notifications.notOpen');
    }
    if (status === HTTP_STATUS.NOT_FOUND) {
      return t('examSchedule.notifications.notFound');
    }
    if (status && status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
      return t('examSchedule.notifications.serverError');
    }
    const detail = Array.isArray(resMsg)
      ? resMsg.join(', ')
      : resMsg || error?.message || 'Unknown';
    return t('examSchedule.notifications.unknownError', { message: detail });
  };

  const handleRegister = async (
    round: ExamRound,
    status: RegistrationStatus = '',
  ): Promise<void> => {
    if (status === 'expired') {
      $q.notify({
        type: 'negative',
        message: t('examSchedule.notifications.expired'),
        icon: 'report_problem',
        position: 'bottom',
        timeout: NOTIFY_TIMEOUT_DEFAULT,
        actions: [{ icon: 'close', color: 'white' }],
      });
      return;
    }

    if (status === 'notOpen') {
      $q.notify({
        type: 'negative',
        message: t('examSchedule.notifications.notOpen'),
        icon: 'report_problem',
        position: 'bottom',
        timeout: NOTIFY_TIMEOUT_DEFAULT,
        actions: [{ icon: 'close', color: 'white' }],
      });
      return;
    }

    if (round.availableSeats <= 0) {
      $q.notify({
        type: 'negative',
        message: t('examSchedule.notifications.roundFull'),
        icon: 'report_problem',
        position: 'bottom',
        timeout: NOTIFY_TIMEOUT_DEFAULT,
        actions: [{ icon: 'close', color: 'white' }],
      });
      return;
    }

    if (!userStore.isLoggedIn) {
      $q.notify({
        type: 'warning',
        message: t('examSchedule.notifications.pleaseLogin'),
        icon: 'login',
        position: 'bottom',
        timeout: NOTIFY_TIMEOUT_DEFAULT,
      });
      await router.push({ name: ROUTE_NAMES.LOGIN });
      return;
    }

    selectedRound.value = round;
    if (round.roundTypeLabel === EXAM_TYPE_SPECIAL) {
      passcodeDialogRef.value?.openDialog();
    } else {
      showConfirmDialog.value = true;
    }
  };

  const executeRegistration = async (
    registrationFn: () => Promise<void>,
    successKey: string,
    successTimeout: number,
    successIcon?: string,
  ): Promise<void> => {
    try {
      await registrationFn();
      $q.notify({
        type: 'positive',
        message: t(successKey),
        position: 'bottom',
        timeout: successTimeout,
        ...(successIcon ? { icon: successIcon } : {}),
      });
      await router.push({ name: ROUTE_NAMES.HISTORY });
    } catch (err: unknown) {
      $q.notify({
        type: 'negative',
        message: getRegistrationErrorMessage(err),
        icon: 'report_problem',
        position: 'bottom',
        timeout: NOTIFY_TIMEOUT_LONG,
      });
    }
  };

  const onConfirmRegistration = async (): Promise<void> => {
    showConfirmDialog.value = false;
    if (!selectedRound.value) return;
    const round = selectedRound.value;
    await executeRegistration(
      () => examStore.confirmRegistration(round),
      'examSchedule.notifications.registrationSuccess',
      NOTIFY_TIMEOUT_LONG,
      'check_circle',
    );
  };

  const onPasscodeConfirm = async (passcode: string): Promise<void> => {
    if (!selectedRound.value) return;
    const round = selectedRound.value;
    await executeRegistration(
      () => examStore.confirmSpecialRegistration(round, passcode),
      'examSchedule.notifications.passcodeSuccess',
      NOTIFY_TIMEOUT_SHORT,
    );
  };

  onMounted(async () => {
    await examStore.initSchedule();
    scheduleInterval = setInterval(() => {
      void examStore.initSchedule();
    }, POLLING_INTERVAL_MS);
  });

  onUnmounted(() => {
    if (scheduleInterval) {
      clearInterval(scheduleInterval);
    }
  });

  return {
    examInfo,
    selectedDate,
    selectedDateRounds,
    calendarAvailability,
    formattedSelectedDate,
    showConfirmDialog,
    passcodeDialogRef,
    selectedRound,
    roundsSectionStyle,
    roundsListOverflow,
    onCalendarResize,
    onMonthChange,
    handleRegister,
    onConfirmRegistration,
    onPasscodeConfirm,
  };
}
