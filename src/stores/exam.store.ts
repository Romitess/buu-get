import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ExamRound, ExamInfo, ExamHistoryItem, DayData } from 'src/types/exam';
import { mockScheduleData, mockHistoryRecords, fetchScheduleData } from 'src/services/exam.service';
import { DEFAULT_EXAM_FEE_THB, PAYMENT_COUNTDOWN_DEFAULT } from 'src/constants/exam';

export const useExamStore = defineStore('exam', () => {
  const examInfo = ref<ExamInfo>({
    badgeText: '',
    title: '',
    subtitle: '',
    locationText: '',
    feeText: '',
  });

  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');

  const scheduleData = ref<Record<string, DayData>>(structuredClone(mockScheduleData));

  const nextHistoryId = ref(100);

  const pendingRegistrations = ref<ExamHistoryItem[]>([]);

  const historyRecords = ref<ExamHistoryItem[]>(structuredClone(mockHistoryRecords));

  const selectedDateRounds = computed((): ExamRound[] => {
    return scheduleData.value[selectedDate.value]?.rounds || [];
  });

  const currentDayDetails = computed(() => {
    return (
      scheduleData.value[selectedDate.value] || {
        location: 'กรุณาเลือกวันที่เพื่อดูสถานที่สอบ',
        fee: 'Fee : - ฿',
      }
    );
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
    const buddhistYear = date.getFullYear() + 543;
    return `${date.getDate()} ${monthNamesTH[date.getMonth()]} ${buddhistYear}`;
  });

  async function initSchedule(): Promise<void> {
    try {
      const data = await fetchScheduleData();
      scheduleData.value = data;

      const firstDate = Object.keys(data).sort()[0];
      if (firstDate) {
        const firstExam = data[firstDate];
        if (firstExam && firstExam.rounds.length > 0) {
          const round = firstExam.rounds[0];
          if (round) {
            examInfo.value = {
              ...examInfo.value,
              title: round.title,
              locationText: firstExam.location,
              feeText: firstExam.fee,
              badgeText: round.roundTypeLabel,
            };
            selectedDate.value = firstDate;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
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

    pendingRegistrations.value.push({
      id: newId,
      title: `${round.title} (${round.roundTypeLabel})`,
      status: 'exam.status.pending',
      statusType: 'primary',
      date: formattedSelectedDate.value,
      time: round.timeRange,
      location: dayData?.location || examInfo.value.locationText,
      fee: feeAmount ? Number(feeAmount) : DEFAULT_EXAM_FEE_THB,
      deadline: PAYMENT_COUNTDOWN_DEFAULT,
      actions: ['cancel', 'pay'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function confirmSpecialRegistration(round: ExamRound, _passcode: string): void {
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

  function addExamRound(payload: {
    examName: string;
    location: string;
    examType: string;
    fee: string | number;
    seats: number;
    examDate: string;
    timeRanges: string[];
  }): void {
    const [dd, mm, yyyy] = payload.examDate.split('/');
    if (!dd || !mm || !yyyy) return;

    const gregorianYear = parseInt(yyyy) - 543;
    const dateKey = `${gregorianYear}-${mm}-${dd}`;

    let formattedFee = `Fee : ${payload.fee} ฿`;
    if (payload.fee === '0.00' || !payload.fee) {
      formattedFee = 'Fee : 500 ฿';
    }

    if (!scheduleData.value[dateKey]) {
      scheduleData.value[dateKey] = {
        location: payload.location || 'Computer Center, BUU',
        fee: formattedFee,
        rounds: [],
      };
    } else {
      const day = scheduleData.value[dateKey];
      if (day) {
        if (payload.location) day.location = payload.location;
        if (payload.fee && payload.fee !== '0.00') day.fee = formattedFee;
      }
    }

    const day = scheduleData.value[dateKey];
    if (!day) return;

    payload.timeRanges.forEach((timeRange: string) => {
      let maxId = 0;
      Object.values(scheduleData.value).forEach((d: DayData) => {
        d.rounds.forEach((r: ExamRound) => {
          if (r.id > maxId) maxId = r.id;
        });
      });

      day.rounds.push({
        id: maxId + 1,
        title:
          payload.examName ||
          `BUU - GET (${payload.examType === 'รอบทั่วไป' ? 'General' : 'Special'})`,
        timeRange,
        roundTypeLabel: payload.examType,
        availableSeats: payload.seats,
        totalSeats: payload.seats,
      });
    });

    selectedDate.value = dateKey;
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
    confirmRegistration,
    confirmSpecialRegistration,
    cancelRegistration,
    confirmPayment,
    addExamRound,
    initSchedule,
  };
});
