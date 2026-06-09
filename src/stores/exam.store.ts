import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ExamRound, ExamInfo, ExamHistoryItem, DayData } from 'src/types/exam';
import type { ExamSchedule } from 'src/types/exam.types';
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
  VERIFY_STATUS,
  TRANSACTION_MATCH_STATUS,
  formatLocationWithRoom,
  PAYMENT_DURATION_SECONDS_DEFAULT,
} from 'src/constants/exam';

export const useExamStore = defineStore('exam', () => {
  const i18n = useI18n();
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');
  const scheduleData = ref<Record<string, DayData>>({});
  const cancellationReasonStorageKey = 'exam_cancellation_reasons';

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

  const calendarAvailability = computed((): Record<string, 'available' | 'full' | null> => {
    const result: Record<string, 'available' | 'full' | null> = {};
    Object.entries(scheduleData.value).forEach(([date, data]) => {
      const hasAvailable = data.rounds.some((r) => r.availableSeats > 0);
      result[date] = hasAvailable ? 'available' : 'full';
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

  async function initSchedule(force = false): Promise<void> {
    try {
      const data = await fetchScheduleData(force);
      scheduleData.value = data;
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  async function loadManagementSchedules(force = false): Promise<void> {
    try {
      managementSchedules.value = await fetchExamSchedules(force);
    } catch (error) {
      console.error('Failed to load management schedules:', error);
    }
  }

  async function fetchHistory(): Promise<void> {
    const userIdStr = localStorage.getItem('user_id');
    if (!userIdStr) return;
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) return;

    try {
      const enrollments = await fetchUserEnrollments(userId);
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

      enrollments.forEach((enrollment) => {
        const session = enrollment.SESSION;
        if (!session) return;
        const exam = session.EXAM;
        const location = session.LOCATION;

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
          title: exam?.EXAM_NAME || i18n.t('examSchedule.defaultEnrollmentTitle'),
          status: '',
          statusType: 'primary',
          date: formattedDate,
          time: `${formatTime(session.SS_START_TIME)} - ${formatTime(session.SS_END_TIME)}`,
          location: locationText,
          fee: exam?.EXAM_FEE ?? 0,
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
          const isVerified = enrollment.ERM_VERIFY_STATUS === VERIFY_STATUS.PASS;
          const hasBankMatch =
            enrollment.TRANSACTION?.TRANX_MATCH_STATUS === TRANSACTION_MATCH_STATUS.MATCH;
          item.status = isVerified ? 'exam.status.verified' : 'exam.status.paymentCompleted';
          item.statusType = 'primary';
          item.actions = isVerified && hasBankMatch ? ['downloadReceipt'] : [];
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.SEAT_ASSIGNED) {
          item.status = 'exam.status.verified';
          item.statusType = 'primary';
          const isVerified = enrollment.ERM_VERIFY_STATUS === VERIFY_STATUS.PASS;
          const hasBankMatch =
            enrollment.TRANSACTION?.TRANX_MATCH_STATUS === TRANSACTION_MATCH_STATUS.MATCH;

          const actions: string[] = [];
          if (isVerified) {
            if (hasBankMatch) {
              actions.push('downloadReceipt');
            }
          }
          item.actions = actions;
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.SEAT_PUBLISHED) {
          item.status = 'exam.status.verified';
          item.statusType = 'primary';
          const isVerified = enrollment.ERM_VERIFY_STATUS === VERIFY_STATUS.PASS;
          const hasBankMatch =
            enrollment.TRANSACTION?.TRANX_MATCH_STATUS === TRANSACTION_MATCH_STATUS.MATCH;
          const hasVoucher = !!(enrollment.VOUCHERS && enrollment.VOUCHERS.length > 0);

          const actions: string[] = [];
          if (isVerified) {
            if (hasVoucher) {
              actions.push('candidateCard');
            }
            if (hasBankMatch) {
              actions.push('downloadReceipt');
            }
          }
          item.actions = actions;
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.ATTENDED) {
          const hasScore = !!enrollment.SCORE;
          const hasCertificate = !!(
            enrollment.SCORE?.CERTIFICATES && enrollment.SCORE.CERTIFICATES.length > 0
          );

          const actions: string[] = [];
          if (hasScore) {
            actions.push('scoreDetails');
          }
          if (hasCertificate) {
            actions.push('certificate');
          }

          item.status = hasScore ? 'exam.status.completed' : 'exam.status.evaluating';
          item.statusType = 'primary';
          item.actions = actions;
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.CANCELLED) {
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
          newHistory.push(item);
        }
      });

      pendingRegistrations.value = newPending;
      historyRecords.value = newHistory;
    } catch (error: unknown) {
      console.error('Failed to fetch user history:', error);
    }
  }

  async function confirmRegistration(
    round: ExamRound,
    passcode?: string,
    physicalStatus?: string,
  ): Promise<void> {
    const userIdStr = localStorage.getItem('user_id');
    if (!userIdStr) throw new Error(i18n.t('examSchedule.userNotLoggedIn'));
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      throw new Error(i18n.t('examSchedule.invalidUserId'));
    }

    await createEnrollment(userId, round.id, passcode, physicalStatus);
    await fetchHistory();
    await initSchedule();
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
      await fetchHistory();
      await initSchedule();
    } catch (error: unknown) {
      console.error('Failed to cancel registration:', error);
      throw error;
    }
  }

  async function confirmPayment(enrollmentId: number): Promise<void> {
    try {
      await updateEnrollmentStatus(enrollmentId, ENROLLMENT_STATUS.PAID);
      await fetchHistory();
    } catch (error: unknown) {
      console.error('Failed to confirm payment:', error);
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
    confirmRegistration,
    confirmSpecialRegistration,
    cancelRegistration,
    confirmPayment,
    addExamRound,
    deleteExamRound,
    initSchedule,
    loadManagementSchedules,
    fetchHistory,
  };
});
