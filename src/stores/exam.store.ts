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
  DEFAULT_EXAM_FEE_THB,
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
        subtitle: dayData.subtitle,
        locationText: dayData.location,
        feeText: dayData.fee,
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

  async function initSchedule(): Promise<void> {
    try {
      const data = await fetchScheduleData();
      scheduleData.value = data;
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  async function loadManagementSchedules(): Promise<void> {
    try {
      managementSchedules.value = await fetchExamSchedules();
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
          fee: exam?.EXAM_FEE || DEFAULT_EXAM_FEE_THB,
          rawEnrollment: enrollment,
        };

        if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.UNPAID) {
          item.status = 'exam.status.pending';
          item.statusType = 'primary';
          item.actions = ['cancel', 'pay'];
          if (enrollment.CREATED_AT) {
            const createdAtDate = new Date(enrollment.CREATED_AT);
            const deadlineDate = new Date(
              createdAtDate.getTime() + PAYMENT_DURATION_SECONDS_DEFAULT * 1000,
            );
            item.deadline = deadlineDate.toISOString();
          }
          newPending.push(item);
        } else if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.PAID) {
          item.status = 'exam.status.paymentCompleted';
          item.statusType = 'primary';
          const isVerified = enrollment.ERM_VERIFY_STATUS === VERIFY_STATUS.PASS;
          const hasBankMatch =
            enrollment.TRANSACTION?.TRANX_MATCH_STATUS === TRANSACTION_MATCH_STATUS.MATCH;
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
          item.status = 'exam.status.cancelled';
          item.statusType = 'error';
          item.customStatus = {
            label: 'exam.status.cancelled',
            type: 'error',
            icon: 'warning_amber',
          };
          newHistory.push(item);
        }
      });

      pendingRegistrations.value = newPending;
      historyRecords.value = newHistory;
    } catch (error: unknown) {
      console.error('Failed to fetch user history:', error);
    }
  }

  async function confirmRegistration(round: ExamRound, passcode?: string): Promise<void> {
    const userIdStr = localStorage.getItem('user_id');
    if (!userIdStr) throw new Error(i18n.t('examSchedule.userNotLoggedIn'));
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      throw new Error(i18n.t('examSchedule.invalidUserId'));
    }

    await createEnrollment(userId, round.id, passcode);
    await fetchHistory();
    await initSchedule();
  }

  async function confirmSpecialRegistration(round: ExamRound, passcode: string): Promise<void> {
    await confirmRegistration(round, passcode);
  }

  async function cancelRegistration(enrollmentId: number): Promise<void> {
    try {
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

  async function addExamRound(payload: CreateExamPayload): Promise<void> {
    await createExamRound(payload);

    await initSchedule();

    const [dd, mm, yyyy] = payload.examDate.split('/');
    if (dd && mm && yyyy) {
      const gregorianYear = parseInt(yyyy) - BUDDHIST_YEAR_OFFSET;
      selectedDate.value = `${gregorianYear}-${mm}-${dd}`;
    }
  }

  async function deleteExamRound(id: number | string): Promise<void> {
    await deleteExam(id);
    await loadManagementSchedules();
    await initSchedule();
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
