import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
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
  TRANSACTION_MATCH_STATUS,
  TRANSACTION_PAYMENT_STATUS,
  SESSION_STATUS_COMPLETED,
  formatLocationWithRoom,
  PAYMENT_DURATION_SECONDS_DEFAULT,
  ReceiptStatus,
} from 'src/constants/exam';
import {
  getExamRoundsCalendarAvailability,
  type ExamCalendarAvailability,
} from 'src/utils/exam-registration';
import { useUserStore } from 'src/stores/user.store';

export const useExamStore = defineStore('exam', () => {
  const i18n = useI18n();
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');
  const scheduleData = ref<Record<string, DayData>>({});
  const cancellationReasonStorageKey = 'exam_cancellation_reasons';
  const HISTORY_CACHE_TTL_MS = 2000;
  let lastHistoryFetchAt = 0;
  let historyFetchInFlight: Promise<void> | null = null;
  let scheduleFetchInFlight: Promise<void> | null = null;

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

    if (i18n.locale.value?.startsWith('en')) {
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
    if (scheduleFetchInFlight) {
      await scheduleFetchInFlight;
      if (!force) return;
    }

    const execute = async (): Promise<void> => {
      scheduleError.value = null;
      const showLoading = force || Object.keys(scheduleData.value).length === 0;
      if (showLoading) {
        isLoadingSchedule.value = true;
      }
      try {
        const [data] = await Promise.all([fetchScheduleData(force), loadRegisteredSessions()]);
        scheduleData.value = data;
      } catch (error) {
        console.error('Failed to load schedule:', error);
        scheduleError.value = i18n.t('examSchedule.loadError');
      } finally {
        if (showLoading) {
          isLoadingSchedule.value = false;
        }
      }
    };

    scheduleFetchInFlight = execute().finally(() => {
      scheduleFetchInFlight = null;
    });
    await scheduleFetchInFlight;
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

    if (historyFetchInFlight && !preloaded) {
      await historyFetchInFlight;
      if (!force && Date.now() - lastHistoryFetchAt < HISTORY_CACHE_TTL_MS) {
        return;
      }
      if (!force && lastHistoryFetchAt > 0 && !historyError.value) {
        return;
      }
    }

    const execute = async (): Promise<void> => {
      historyError.value = null;

      try {
        let enrollments = preloaded;
        if (!enrollments) {
          const userId = resolveUserId();
          if (userId === null) {
            historyError.value = i18n.t('exam.history.loadError');
            return;
          }
          enrollments = await fetchUserEnrollments(userId);
        }

        const newPending: ExamHistoryItem[] = [];
        const newHistory: ExamHistoryItem[] = [];

        const getPaymentDeadline = (createdAt: string): Date => {
          const createdAtDate = new Date(createdAt);
          return new Date(createdAtDate.getTime() + PAYMENT_DURATION_SECONDS_DEFAULT * 1000);
        };

        const isPaymentTimeoutCancellation = (enrollment: {
          ERM_ID: number;
          CREATED_AT: string;
          UPDATED_AT?: string;
        }): boolean => {
          const reason = getCancellationReason(enrollment.ERM_ID);
          if (reason) return reason === 'paymentTimeout';
          if (!enrollment.CREATED_AT || !enrollment.UPDATED_AT) return false;
          return (
            new Date(enrollment.UPDATED_AT).getTime() >=
            getPaymentDeadline(enrollment.CREATED_AT).getTime()
          );
        };

        const hasMatchedPayment = (enrollment: ExamEnrollment): boolean =>
          enrollment.TRANSACTION?.TRANX_MATCH_STATUS === TRANSACTION_MATCH_STATUS.MATCH;

        const hasDownloadableReceipt = (enrollment: ExamEnrollment): boolean => {
          const paymentStatus = enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS;
          if (
            paymentStatus === TRANSACTION_PAYMENT_STATUS.REFUND ||
            paymentStatus === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED
          ) {
            return false;
          }
          const receipts = enrollment.TRANSACTION?.RECEIPTS ?? [];
          const hasVoided = receipts.some((receipt) => receipt.RC_STATUS === ReceiptStatus.VOIDED);
          if (hasVoided) return false;
          return hasMatchedPayment(enrollment);
        };

        enrollments.forEach((enrollment) => {
          const session = enrollment.SESSION;
          if (!session) return;
          const exam = session.EXAM;
          const location = enrollment.SESSION_LOCATION?.LOCATION ?? session.LOCATION;

          const date = exam?.EXAM_DATE ? new Date(exam.EXAM_DATE) : new Date();
          const months = getMonthNames();
          const monthName = months[date.getMonth()] || '';
          const year = i18n.locale.value?.startsWith('en')
            ? date.getFullYear()
            : date.getFullYear() + BUDDHIST_YEAR_OFFSET;
          const formattedDate = `${date.getDate()} ${monthName} ${year}`;

          const locationText = location
            ? formatLocationWithRoom(location.LOCATION_NAME, location.LOCATION_ROOM_NO)
            : DEFAULT_LOCATION_TEXT;

          const item: ExamHistoryItem = {
            id: enrollment.ERM_ID,
            title: exam?.EXAM_ROUND
              ? `${exam.EXAM_NAME} ${exam.EXAM_ROUND}`
              : exam?.EXAM_NAME || i18n.t('examSchedule.defaultEnrollmentTitle'),
            status: '',
            statusType: 'primary',
            date: formattedDate,
            time: `${formatTime(session.SS_START_TIME)} - ${formatTime(session.SS_END_TIME)}`,
            location: locationText,
            fee: Number(exam?.EXAM_FEE ?? 0),
            rawEnrollment: enrollment,
          };

          if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.UNPAID) {
            item.status = 'exam.status.pending';
            item.statusType = 'primary';
            item.actions = ['cancel', 'pay'];
            if (enrollment.CREATED_AT) {
              item.deadline = getPaymentDeadline(enrollment.CREATED_AT).toISOString();
            }
            newPending.push(item);
          } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.PAID) {
            const canDownloadReceipt = hasDownloadableReceipt(enrollment);
            item.status = canDownloadReceipt
              ? 'exam.status.verified'
              : 'exam.status.paymentCompleted';
            item.statusType = 'primary';
            item.actions = canDownloadReceipt ? ['downloadReceipt'] : [];
            newHistory.push(item);
          } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.SEAT_ASSIGNED) {
            const canDownloadReceipt = hasDownloadableReceipt(enrollment);
            item.status = canDownloadReceipt
              ? 'exam.status.verified'
              : 'exam.status.paymentCompleted';
            item.statusType = 'primary';

            const actions: string[] = [];
            if (canDownloadReceipt) {
              actions.push('downloadReceipt');
            }
            item.actions = actions;
            newHistory.push(item);
          } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.SEAT_PUBLISHED) {
            const canDownloadReceipt = hasDownloadableReceipt(enrollment);
            item.status = canDownloadReceipt
              ? 'exam.status.verified'
              : 'exam.status.paymentCompleted';
            item.statusType = 'primary';
            const hasVoucher = !!(enrollment.VOUCHERS && enrollment.VOUCHERS.length > 0);

            const actions: string[] = [];
            if (hasVoucher) {
              actions.push('candidateCard');
            }
            if (canDownloadReceipt) {
              actions.push('downloadReceipt');
            }
            item.actions = actions;
            newHistory.push(item);
          } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.ATTENDED) {
            const hasScore = !!enrollment.SCORE;
            const canDownloadReceipt = hasDownloadableReceipt(enrollment);
            const hasCompletedSession =
              Number(enrollment.SESSION?.SS_SESSION_STATUS) === SESSION_STATUS_COMPLETED;
            const hasCertificate = !!(
              enrollment.SCORE?.CERTIFICATES && enrollment.SCORE.CERTIFICATES.length > 0
            );

            const actions: string[] = [];
            if (canDownloadReceipt) {
              actions.push('downloadReceipt');
            }
            if (hasCompletedSession && hasCertificate) {
              actions.push('certificate');
            }

            item.status = hasScore ? 'exam.status.completed' : 'exam.status.evaluating';
            item.statusType = 'primary';
            item.actions = actions;
            newHistory.push(item);
          } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.CANCELLED) {
            const paymentStatus = enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS;
            if (paymentStatus === TRANSACTION_PAYMENT_STATUS.REFUND) {
              item.status = 'exam.status.refunded';
              item.statusType = 'warning';
              item.customStatus = {
                label: 'exam.status.refunded',
                type: 'error',
                icon: 'currency_exchange',
              };
            } else if (paymentStatus === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED) {
              item.status = 'exam.status.receiptVoided';
              item.statusType = 'warning';
              item.customStatus = {
                label: 'exam.status.receiptVoided',
                type: 'error',
                icon: 'receipt_long',
              };
            } else {
              const isPaymentTimeout = isPaymentTimeoutCancellation(enrollment);
              item.status = isPaymentTimeout
                ? 'exam.status.cancelled'
                : 'exam.status.registrationCancelled';
              item.statusType = 'primary';
              if (isPaymentTimeout) {
                item.customStatus = {
                  label: 'exam.status.paymentTimeout',
                  type: 'error',
                  icon: 'warning_amber',
                };
              }
            }
            newHistory.push(item);
          }
        });

        pendingRegistrations.value = newPending;
        historyRecords.value = newHistory;
        lastHistoryFetchAt = Date.now();
      } catch (error: unknown) {
        console.error('Failed to fetch user history:', error);
        historyError.value = i18n.t('exam.history.loadError');
      }
    };

    if (preloaded) {
      await execute();
      return;
    }

    historyFetchInFlight = execute().finally(() => {
      historyFetchInFlight = null;
    });
    await historyFetchInFlight;
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

    await initSchedule(true);

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
    loadManagementSchedules,
    fetchHistory,
    isSessionRegistered,
    resetExamUserState,
  };
});
