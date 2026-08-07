import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed, unref } from 'vue';
import type { ExamRound, ExamInfo, ExamHistoryItem, DayData, ExamEnrollment } from 'src/types/exam';
import type { ExamSchedule } from 'src/types/exam.types';
import type { ReceiptInformation } from 'src/types/receipt-information';
import {
  createTransaction as createTransactionRequest,
  confirmPaymentFlow,
  expireTransaction as expireTransactionRequest,
} from 'src/services/transaction.service';
import {
  fetchScheduleData,
  fetchExamSchedules,
  createExamRound,
  deleteExam,
  createEnrollment,
  fetchUserEnrollments,
  updateEnrollmentStatus,
  formatTime,
  type CreateExamPayload,
} from 'src/services/exam.service';
import {
  BUDDHIST_YEAR_OFFSET,
  EMPTY_DETAILS,
  DEFAULT_LOCATION_TEXT,
  DEFAULT_EXAM_INFO,
  ENROLLMENT_STATUS,
  formatLocationWithRoom,
} from 'src/constants/exam';
import {
  getExamRoundsCalendarAvailability,
  type ExamCalendarAvailability,
} from 'src/utils/exam-registration';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import {
  isPendingHistoryItem,
  mapEnrollmentToHistoryItem,
} from 'src/utils/map-enrollment-history-status';
import { useUserStore } from 'src/stores/user.store';
import { i18n as appI18n } from 'src/boot/i18n';

export const useExamStore = defineStore('exam', () => {
  // ใช้ global composer — อย่าใช้ useI18n() ใน store (login/async อยู่นอก setup)
  const i18n = appI18n.global;
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');
  const scheduleData = ref<Record<string, DayData>>({});
  const cancellationReasonStorageKey = 'exam_cancellation_reasons';
  const HISTORY_CACHE_TTL_MS = 2000;
  let lastHistoryFetchAt = 0;
  let historyFetchInFlight: Promise<void> | null = null;
  let scheduleFetchInFlight: Promise<void> | null = null;
  let scheduleFetchGeneration = 0;
  let historyFetchGeneration = 0;

  type CancellationReason = 'manual' | 'paymentTimeout';

  const getCancellationReasons = (): Record<string, CancellationReason> => {
    try {
      const raw = localStorage.getItem(cancellationReasonStorageKey);
      return raw ? (JSON.parse(raw) as Record<string, CancellationReason>) : {};
    } catch {
      return {};
    }
  };

  const setCancellationReason = (enrollmentId: number, reason: CancellationReason): void => {
    const reasons = getCancellationReasons();
    reasons[String(enrollmentId)] = reason;
    localStorage.setItem(cancellationReasonStorageKey, JSON.stringify(reasons));
  };

  const getCancellationReason = (enrollmentId: number): CancellationReason | null => {
    return getCancellationReasons()[String(enrollmentId)] ?? null;
  };

  /** Prefer Pinia user id; fall back to localStorage for cold paths */
  const resolveUserId = (): number | null => {
    const fromStore = useUserStore().currentUser?.id;
    if (typeof fromStore === 'number' && Number.isFinite(fromStore)) {
      return fromStore;
    }
    const userIdStr = localStorage.getItem('user_id');
    if (!userIdStr) return null;
    const parsed = parseInt(userIdStr, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const getMonthNames = (): string[] => {
    const raw = i18n.tm('common.months');
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => item);
  };

  const examInfo = computed((): ExamInfo => {
    const dayData = scheduleData.value[selectedDate.value];
    if (dayData) {
      return {
        badgeText: dynamicBadgeText.value,
        title: dayData.title,
        subtitle: i18n.t('examSchedule.examDetailSubtitle'),
        locationText: dayData.location,
        feeText: dayData.fee,
        formatText: dayData.formatText || '',
      };
    }
    return { ...DEFAULT_EXAM_INFO };
  });
  const pendingRegistrations = ref<ExamHistoryItem[]>([]);
  const historyRecords = ref<ExamHistoryItem[]>([]);
  const managementSchedules = ref<ExamSchedule[]>([]);
  const registeredSessionIds = ref<Set<number>>(new Set());
  const historyError = ref<string | null>(null);
  const scheduleError = ref<string | null>(null);
  const isLoadingSchedule = ref(false);

  const selectedDateRounds = computed((): ExamRound[] => {
    return scheduleData.value[selectedDate.value]?.rounds || [];
  });

  const currentDayDetails = computed(() => {
    const dayData = scheduleData.value[selectedDate.value];
    if (dayData) {
      return {
        location: dayData.location,
        fee: dayData.fee,
      };
    }
    return {
      location: EMPTY_DETAILS.LOCATION,
      fee: EMPTY_DETAILS.FEE,
    };
  });

  const dynamicBadgeText = computed((): string => {
    const rounds = selectedDateRounds.value;
    return rounds[0]?.roundTypeLabel ?? i18n.t('examSchedule.noBadgeRounds');
  });

  const calendarAvailability = computed((): Record<string, ExamCalendarAvailability> => {
    const result: Record<string, ExamCalendarAvailability> = {};
    const now = new Date();
    Object.entries(scheduleData.value).forEach(([date, data]) => {
      result[date] = getExamRoundsCalendarAvailability(data.rounds, now);
    });
    return result;
  });

  const formattedSelectedDate = computed((): string => {
    if (!selectedDate.value) return '';
    const date = new Date(selectedDate.value);
    const months = getMonthNames();
    const monthName = months[date.getMonth()] || '';

    if (String(unref(i18n.locale)).startsWith('en')) {
      return `${date.getDate()} ${monthName} ${date.getFullYear()}`;
    }
    const buddhistYear = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${date.getDate()} ${monthName} ${buddhistYear}`;
  });

  function resetExamUserState(): void {
    pendingRegistrations.value = [];
    historyRecords.value = [];
    registeredSessionIds.value = new Set();
    scheduleData.value = {};
    lastHistoryFetchAt = 0;
    historyError.value = null;
    scheduleError.value = null;
    historyFetchInFlight = null;
    scheduleFetchInFlight = null;
    scheduleFetchGeneration += 1;
    historyFetchGeneration += 1;
    isLoadingSchedule.value = false;
  }

  async function loadRegisteredSessions(preloaded?: ExamEnrollment[]): Promise<void> {
    let enrollments = preloaded;
    if (!enrollments) {
      const userId = resolveUserId();
      if (userId === null) {
        registeredSessionIds.value = new Set();
        return;
      }
      enrollments = await fetchUserEnrollments(userId);
    }

    registeredSessionIds.value = new Set(
      enrollments
        .filter((enrollment) => enrollment.ERM_STATUS !== ENROLLMENT_STATUS.CANCELLED)
        .map((enrollment) => enrollment.SESSION_ID),
    );
  }

  function isSessionRegistered(sessionId: number): boolean {
    return registeredSessionIds.value.has(sessionId);
  }

  async function initSchedule(force = false): Promise<void> {
    // Non-force callers join the in-flight request instead of stacking GET /exam
    if (scheduleFetchInFlight && !force) {
      await scheduleFetchInFlight;
      return;
    }

    const generation = ++scheduleFetchGeneration;
    const showLoading = force || Object.keys(scheduleData.value).length === 0;

    const execute = async (): Promise<void> => {
      scheduleError.value = null;
      if (showLoading) {
        isLoadingSchedule.value = true;
      }
      try {
        const [data] = await Promise.all([fetchScheduleData(force), loadRegisteredSessions()]);
        if (generation !== scheduleFetchGeneration) return;
        scheduleData.value = data;
      } catch (error) {
        if (generation !== scheduleFetchGeneration) return;
        console.error('Failed to load schedule:', error);
        scheduleError.value = i18n.t('examSchedule.loadError');
      } finally {
        if (generation === scheduleFetchGeneration && showLoading) {
          isLoadingSchedule.value = false;
        }
      }
    };

    const fetchPromise = execute().finally(() => {
      if (scheduleFetchInFlight === fetchPromise) {
        scheduleFetchInFlight = null;
      }
    });
    scheduleFetchInFlight = fetchPromise;
    await fetchPromise;
  }

  /** Clear schedule spinner when leaving the page — does not abort in-flight data update */
  function clearScheduleLoadingUi(): void {
    isLoadingSchedule.value = false;
  }

  async function loadManagementSchedules(force = false): Promise<void> {
    try {
      managementSchedules.value = await fetchExamSchedules(force);
    } catch (error) {
      console.error('Failed to load management schedules:', error);
    }
  }

  /** ดึง enrollments ครั้งเดียว แล้วอัปเดตทั้ง history + registered sessions */
  async function refreshUserEnrollmentViews(): Promise<void> {
    const userId = resolveUserId();
    if (userId === null) {
      historyError.value = i18n.t('exam.history.loadError');
      return;
    }

    const enrollments = await fetchUserEnrollments(userId);
    await Promise.all([fetchHistory(true, enrollments), loadRegisteredSessions(enrollments)]);
  }

  async function fetchHistory(force = false, preloaded?: ExamEnrollment[]): Promise<void> {
    if (!force && !preloaded && Date.now() - lastHistoryFetchAt < HISTORY_CACHE_TTL_MS) {
      return;
    }

    if (historyFetchInFlight && !preloaded && !force) {
      await historyFetchInFlight;
      if (Date.now() - lastHistoryFetchAt < HISTORY_CACHE_TTL_MS) {
        return;
      }
      if (lastHistoryFetchAt > 0 && !historyError.value) {
        return;
      }
    }

    const generation = ++historyFetchGeneration;

    const execute = async (): Promise<void> => {
      historyError.value = null;

      try {
        let enrollments = preloaded;
        if (!enrollments) {
          const userId = resolveUserId();
          if (userId === null) {
            if (generation === historyFetchGeneration) {
              historyError.value = i18n.t('exam.history.loadError');
            }
            return;
          }
          enrollments = await fetchUserEnrollments(userId);
        }

        if (generation !== historyFetchGeneration) return;

        const newPending: ExamHistoryItem[] = [];
        const newHistory: ExamHistoryItem[] = [];

        enrollments.forEach((enrollment) => {
          const session = enrollment.SESSION;
          if (!session) return;
          const exam = session.EXAM;
          const location = enrollment.SESSION_LOCATION?.LOCATION ?? session.LOCATION;

          const date = exam?.EXAM_DATE ? new Date(exam.EXAM_DATE) : new Date();
          const months = getMonthNames();
          const monthName = months[date.getMonth()] || '';
          const year = String(unref(i18n.locale)).startsWith('en')
            ? date.getFullYear()
            : date.getFullYear() + BUDDHIST_YEAR_OFFSET;
          const formattedDate = `${date.getDate()} ${monthName} ${year}`;

          const locationText = location
            ? formatLocationWithRoom(location.LOCATION_NAME, location.LOCATION_ROOM_NO)
            : DEFAULT_LOCATION_TEXT;

          const item = mapEnrollmentToHistoryItem(enrollment, {
            formattedDate,
            formattedTime: `${formatTime(session.SS_START_TIME)} - ${formatTime(session.SS_END_TIME)}`,
            locationText,
            title:
              formatExamDisplayTitle(exam?.EXAM_NAME, exam?.EXAM_ROUND, exam?.EXAM_FISCAL_YEAR) ||
              i18n.t('examSchedule.defaultEnrollmentTitle'),
            fee: Number(exam?.EXAM_FEE ?? 0),
            getCancellationReason,
          });

          if (!item) return;

          if (isPendingHistoryItem(item)) {
            newPending.push(item);
          } else {
            newHistory.push(item);
          }
        });

        pendingRegistrations.value = newPending;
        historyRecords.value = newHistory;
        lastHistoryFetchAt = Date.now();
      } catch (error: unknown) {
        if (generation !== historyFetchGeneration) return;
        console.error('Failed to fetch user history:', error);
        historyError.value = i18n.t('exam.history.loadError');
      }
    };

    if (preloaded) {
      await execute();
      return;
    }

    const fetchPromise = execute().finally(() => {
      if (historyFetchInFlight === fetchPromise) {
        historyFetchInFlight = null;
      }
    });
    historyFetchInFlight = fetchPromise;
    await fetchPromise;
  }

  async function confirmRegistration(
    round: ExamRound,
    passcode?: string,
    physicalStatus?: string,
  ): Promise<void> {
    const userId = resolveUserId();
    if (userId === null) throw new Error(i18n.t('examSchedule.userNotLoggedIn'));

    await createEnrollment(userId, round.id, passcode, physicalStatus);
    await refreshUserEnrollmentViews();
  }

  async function confirmSpecialRegistration(
    round: ExamRound,
    passcode: string,
    physicalStatus?: string,
  ): Promise<void> {
    await confirmRegistration(round, passcode, physicalStatus);
  }

  async function cancelRegistration(
    enrollmentId: number,
    reason: CancellationReason = 'manual',
  ): Promise<void> {
    try {
      setCancellationReason(enrollmentId, reason);
      await updateEnrollmentStatus(enrollmentId, ENROLLMENT_STATUS.CANCELLED);
      await refreshUserEnrollmentViews();
    } catch (error: unknown) {
      console.error('Failed to cancel registration:', error);
      throw error;
    }
  }

  async function createTransaction(
    enrollmentId: number,
    amount: number,
    pcId = 1,
  ): Promise<number> {
    try {
      const { TRANX_ID } = await createTransactionRequest({
        ermId: enrollmentId,
        pcId,
        amount,
      });

      return TRANX_ID;
    } catch (error: unknown) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  async function confirmPayment(
    tranxId: number,
    userCode: string,
    receiptInfo?: ReceiptInformation,
  ): Promise<void> {
    try {
      await confirmPaymentFlow(tranxId, {
        userCode,
        receiptTaxId: receiptInfo?.taxId,
        receiptName: receiptInfo?.fullName,
        receiptPhone: receiptInfo?.phone,
        receiptAddress: receiptInfo?.address,
      });

      await fetchHistory(true);
    } catch (error: unknown) {
      console.error('Failed to confirm payment:', error);
      throw error;
    }
  }

  async function expireTransaction(tranxId: number): Promise<void> {
    try {
      await expireTransactionRequest(tranxId);
      await fetchHistory(true);
    } catch (error: unknown) {
      console.error('Failed to expire transaction:', error);
      throw error;
    }
  }

  async function addExamRound(payload: CreateExamPayload): Promise<number> {
    const examId = await createExamRound(payload);

    // ไม่รอ refresh calendar บน save path — รอบสอบสร้างแล้ว ให้ UI เคลียร์ loading / redirect ได้ทันที
    void initSchedule(true).catch((error: unknown) => {
      console.error('Failed to refresh schedule after create:', error);
    });

    const [dd, mm, yyyy] = payload.examDate.split('/');
    if (dd && mm && yyyy) {
      const gregorianYear = parseInt(yyyy) - BUDDHIST_YEAR_OFFSET;
      selectedDate.value = `${gregorianYear}-${mm}-${dd}`;
    }

    return examId;
  }

  async function deleteExamRound(id: number | string): Promise<void> {
    await deleteExam(id);
    await loadManagementSchedules(true);
    await initSchedule(true);
  }

  return {
    examInfo,
    selectedDate,
    scheduleData,
    selectedDateRounds,
    currentDayDetails,
    dynamicBadgeText,
    calendarAvailability,
    formattedSelectedDate,
    pendingRegistrations,
    historyRecords,
    managementSchedules,
    historyError,
    scheduleError,
    isLoadingSchedule,
    confirmRegistration,
    confirmSpecialRegistration,
    cancelRegistration,
    createTransaction,
    confirmPayment,
    expireTransaction,
    addExamRound,
    deleteExamRound,
    initSchedule,
    clearScheduleLoadingUi,
    loadManagementSchedules,
    fetchHistory,
    isSessionRegistered,
    resetExamUserState,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExamStore, import.meta.hot));
}
