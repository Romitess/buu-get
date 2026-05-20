import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ExamRound, ExamInfo, ExamHistoryItem, DayData } from 'src/types/exam';
import type { ExamSchedule } from 'src/types/exam.types';
import {
  defaultExamInfo,
  mockScheduleData,
  mockHistoryRecords,
  fetchScheduleData,
  fetchExamSchedules,
  createExamRound,
  deleteExam,
  createEnrollment,
  fetchUserEnrollments,
  updateEnrollmentStatus,
  type CreateExamPayload,
} from 'src/services/exam.service';
import {
  DEFAULT_EXAM_FEE_THB,
  BUDDHIST_YEAR_OFFSET,
  EMPTY_DETAILS,
  DEFAULT_LOCATION_TEXT,
} from 'src/constants/exam';

export const useExamStore = defineStore('exam', () => {
  const { locale } = useI18n();
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');
  const scheduleData = ref<Record<string, DayData>>(structuredClone(mockScheduleData));

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
    return { ...defaultExamInfo };
  });
  const pendingRegistrations = ref<ExamHistoryItem[]>([]);
  const historyRecords = ref<ExamHistoryItem[]>(structuredClone(mockHistoryRecords));
  // For admin management table
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
    return rounds[0]?.roundTypeLabel ?? 'ไม่มีรอบสอบ';
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
    if (locale.value && locale.value.startsWith('en')) {
      const monthNamesEN = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${date.getDate()} ${monthNamesEN[date.getMonth()]} ${date.getFullYear()}`;
    } else {
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
      const buddhistYear = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
      return `${date.getDate()} ${monthNamesTH[date.getMonth()]} ${buddhistYear}`;
    }
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
        const buddhistYear = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
        const formattedDate = `${date.getDate()} ${monthNamesTH[date.getMonth()]} ${buddhistYear}`;

        const locationText = location
          ? `${location.LOCATION_NAME}${location.LOCATION_ROOM_NO ? ` (${location.LOCATION_ROOM_NO})` : ''}`
          : DEFAULT_LOCATION_TEXT;

        // ERM_STATUS: 0=UNPAID, 1=PAID, 2=SEAT_ASSIGNED, 3=ATTENDED, 4=CANCELLED
        const item: ExamHistoryItem = {
          id: enrollment.ERM_ID,
          title: exam?.EXAM_NAME || 'การทดสอบวัดความสามารถทางภาษาอังกฤษ',
          status: '',
          statusType: 'primary',
          date: formattedDate,
          time: `${session.SS_START_TIME?.substring(0, 5) || '00:00'} - ${session.SS_END_TIME?.substring(0, 5) || '00:00'}`,
          location: locationText,
          fee: exam?.EXAM_FEE || DEFAULT_EXAM_FEE_THB,
          rawEnrollment: enrollment,
        };

        if (enrollment.ERM_STATUS === 0) {
          item.status = 'exam.status.pending';
          item.statusType = 'primary';
          item.actions = ['cancel', 'pay'];
          newPending.push(item);
        } else if (enrollment.ERM_STATUS === 1) {
          // PAID: ชำระเงินเสร็จสิ้น — no buttons by default
          // Show downloadReceipt only when ERM_VERIFY_STATUS === PASS AND bank reconcile matched
          item.status = 'exam.status.paymentCompleted';
          item.statusType = 'primary';
          const isVerified = enrollment.ERM_VERIFY_STATUS === 1; // PASS
          const hasBankMatch = enrollment.TRANSACTION?.TRANX_MATCH_STATUS === 1; // MATCH
          item.actions = isVerified && hasBankMatch ? ['downloadReceipt'] : [];
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === 2) {
          // SEAT_ASSIGNED: Show downloadReceipt + candidateCard only when ERM_VERIFY_STATUS === PASS
          item.status = 'exam.status.verified';
          item.statusType = 'primary';
          const isVerified = enrollment.ERM_VERIFY_STATUS === 1; // PASS
          item.actions = isVerified ? ['downloadReceipt', 'candidateCard'] : [];
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === 3) {
          item.status = 'exam.status.completed';
          item.statusType = 'primary';
          item.actions = ['scoreDetails'];
          newHistory.push(item);
        } else if (enrollment.ERM_STATUS === 4) {
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
    } catch (error) {
      console.error('Failed to fetch user history:', error);
    }
  }

  async function confirmRegistration(round: ExamRound): Promise<void> {
    const userIdStr = localStorage.getItem('user_id');
    if (!userIdStr) throw new Error('User not logged in');
    const userId = parseInt(userIdStr, 10);
    if (isNaN(userId)) {
      throw new Error(
        'ข้อมูลผู้ใช้งานไม่ถูกต้อง (Invalid User ID) กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่',
      );
    }

    // Call backend API
    await createEnrollment(userId, round.id);

    // Refresh history & schedule
    await fetchHistory();
    await initSchedule();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function confirmSpecialRegistration(round: ExamRound, passcode: string): Promise<void> {
    await confirmRegistration(round);
  }

  async function cancelRegistration(enrollmentId: number): Promise<void> {
    try {
      await updateEnrollmentStatus(enrollmentId, 4); // 4 = CANCELLED
      await fetchHistory(); // รีเฟรชข้อมูลประวัติ
      await initSchedule(); // รีเฟรชตารางสอบเพื่อคืนที่นั่ง
    } catch (error) {
      console.error('Failed to cancel registration:', error);
      throw error;
    }
  }

  async function confirmPayment(enrollmentId: number): Promise<void> {
    try {
      await updateEnrollmentStatus(enrollmentId, 1); // 1 = PAID
      await fetchHistory(); // รีเฟรชข้อมูลประวัติเพื่อแสดงสถานะชำระเงินแล้ว
    } catch (error) {
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
