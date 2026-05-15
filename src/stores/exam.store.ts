import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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
  type CreateExamPayload,
} from 'src/services/exam.service';
import { DEFAULT_EXAM_FEE_THB, BUDDHIST_YEAR_OFFSET, EMPTY_DETAILS } from 'src/constants/exam';

export const useExamStore = defineStore('exam', () => {
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
  const nextHistoryId = ref(100);
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
    const date = new Date(selectedDate.value);
    const buddhistYear = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${date.getDate()} ${monthNamesTH[date.getMonth()]} ${buddhistYear}`;
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

  function confirmRegistration(round: ExamRound): void {
    const dayData = scheduleData.value[selectedDate.value];
    if (dayData) {
      const targetRound = dayData.rounds.find((r) => r.id === round.id);
      if (targetRound && targetRound.availableSeats > 0) {
        targetRound.availableSeats -= 1;
      }
    }

    const newId = nextHistoryId.value++;
    const feeAmount = dayData?.fee.match(/\d+/)?.[0];

    // Calculate an absolute deadline (Current time + 29m 30s)
    const expiry = new Date();
    expiry.setSeconds(expiry.getSeconds() + 1770); // 29 * 60 + 30 = 1770 seconds

    pendingRegistrations.value.push({
      id: newId,
      title: `${round.title} (${round.roundTypeLabel})`,
      status: 'exam.status.pending',
      statusType: 'primary',
      date: formattedSelectedDate.value,
      time: round.timeRange,
      location: dayData?.location || examInfo.value.locationText,
      fee: feeAmount ? Number(feeAmount) : DEFAULT_EXAM_FEE_THB,
      deadline: expiry.toISOString(),
      actions: ['cancel', 'pay'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function confirmSpecialRegistration(round: ExamRound, passcode: string): void {
    confirmRegistration(round);
  }

  function cancelRegistration(examId: number): void {
    const index = pendingRegistrations.value.findIndex((e) => e.id === examId);
    if (index !== -1) {
      const cancelled = pendingRegistrations.value.splice(index, 1)[0];
      if (cancelled) {
        historyRecords.value.unshift({
          id: cancelled.id,
          title: cancelled.title,
          status: 'exam.status.cancelled',
          statusType: cancelled.statusType,
          date: cancelled.date,
          time: cancelled.time,
          location: cancelled.location,
          customStatus: {
            label: 'exam.status.paymentTimeout',
            type: 'error',
            icon: 'warning_amber',
          },
        });
      }
    }
  }

  function confirmPayment(examId: number): void {
    const index = pendingRegistrations.value.findIndex((e) => e.id === examId);
    if (index !== -1) {
      const paid = pendingRegistrations.value.splice(index, 1)[0];
      if (paid) {
        historyRecords.value.unshift({
          id: paid.id,
          title: paid.title,
          status: 'exam.status.verifying',
          statusType: paid.statusType,
          date: paid.date,
          time: paid.time,
          location: paid.location,
        });
      }
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
  };
});
