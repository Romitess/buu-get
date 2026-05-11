import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ExamRound, ExamInfo, ExamHistoryItem, DayData } from 'src/types/exam';
import {
  defaultExamInfo,
  mockScheduleData,
  mockHistoryRecords,
  fetchScheduleData,
} from 'src/services/exam.service';
import { DEFAULT_EXAM_FEE_THB, PAYMENT_COUNTDOWN_DEFAULT } from 'src/constants/exam';

/**
 * useExamStore
 * ศูนย์กลางจัดการข้อมูลตารางสอบ (Schedule) และประวัติการสอบ (History)
 * - ข้อมูล Mock ทั้งหมดดึงจาก src/services/exam.service.ts
 * - Business Logic: ลงทะเบียน → สร้าง Pending → ชำระเงิน → ยืนยัน → ประวัติ
 */
export const useExamStore = defineStore('exam', () => {
  // ============================================================================
  // 1. SCHEDULE STATE (ข้อมูลตารางสอบ)
  // ============================================================================

  /** ข้อมูลหลักของการสอบ (แสดงใน ExamDetail) */
  const examInfo = ref<ExamInfo>({ ...defaultExamInfo });

  /** วันที่เลือก (Default เป็นวันนี้) */
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');

  /** ข้อมูลรายวัน (สถาบันภาษา ม.บูรพา) — โหลดจาก service */
  const scheduleData = ref<Record<string, DayData>>(structuredClone(mockScheduleData));

  // ============================================================================
  // 2. HISTORY STATE (ข้อมูลประวัติการสอบ)
  // ============================================================================

  /** Auto-increment ID สำหรับ history item ใหม่ */
  const nextHistoryId = ref(100);

  /** รายการสอบที่รอชำระเงิน */
  const pendingRegistrations = ref<ExamHistoryItem[]>([]);

  /** รายการสอบที่ผ่านมาแล้ว (ชำระเงินแล้ว / ยกเลิก / สอบเสร็จ) — โหลดจาก service */
  const historyRecords = ref<ExamHistoryItem[]>(structuredClone(mockHistoryRecords));

  // ============================================================================
  // 3. SCHEDULE COMPUTED
  // ============================================================================

  /** กรองรอบสอบตามวันที่เลือก */
  const selectedDateRounds = computed((): ExamRound[] => {
    return scheduleData.value[selectedDate.value]?.rounds || [];
  });

  /** ข้อมูลสถานที่และค่าธรรมเนียมตามวันที่เลือก */
  const currentDayDetails = computed(() => {
    return (
      scheduleData.value[selectedDate.value] || {
        location: 'กรุณาเลือกวันที่เพื่อดูสถานที่สอบ',
        fee: 'Fee : - ฿',
      }
    );
  });

  /** Badge Text เปลี่ยนตามข้อมูลรอบสอบในวันที่เลือก */
  const dynamicBadgeText = computed((): string => {
    const rounds = selectedDateRounds.value;
    return rounds[0]?.roundTypeLabel ?? 'ไม่มีรอบสอบ';
  });

  /** คำนวณสถานะจุดในปฏิทิน */
  const calendarAvailability = computed((): Record<string, 'available' | 'full' | null> => {
    const result: Record<string, 'available' | 'full' | null> = {};
    Object.entries(scheduleData.value).forEach(([date, data]) => {
      const hasAvailable = data.rounds.some((r) => r.availableSeats > 0);
      result[date] = hasAvailable ? 'available' : 'full';
    });
    return result;
  });

  /** แปลง selectedDate เป็นรูปแบบไทย */
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

  // ============================================================================
  // 4. ACTIONS
  // ============================================================================

  /**
   * โหลดข้อมูลตารางสอบจาก API
   */
  async function initSchedule(): Promise<void> {
    try {
      const data = await fetchScheduleData();
      scheduleData.value = data;

      // อัปเดตข้อมูลหน้าปก (ExamDetail) จากรอบสอบแรกที่ดึงมาได้
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
            // ตั้งค่าวันที่เลือกเริ่มต้นเป็นวันที่ของรอบแรก
            selectedDate.value = firstDate;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  }

  /**
   * ยืนยันการลงทะเบียนสอบ (รอบทั่วไป)
   * - ลดจำนวนที่นั่งว่าง
   * - สร้าง Pending Registration ใน History
   */
  function confirmRegistration(round: ExamRound): void {
    // ลดจำนวนที่นั่งว่าง
    const dayData = scheduleData.value[selectedDate.value];
    if (dayData) {
      const targetRound = dayData.rounds.find((r) => r.id === round.id);
      if (targetRound && targetRound.availableSeats > 0) {
        targetRound.availableSeats -= 1;
      }
    }

    // สร้าง pending registration
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

  /**
   * ยืนยันการลงทะเบียนสอบ (รอบพิเศษ — ผ่าน Passcode)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function confirmSpecialRegistration(round: ExamRound, passcode: string): void {
    // ในอนาคต: ตรวจสอบ Passcode กับ API — จะใช้ passcode ตรวจสอบกับ backend
    confirmRegistration(round);
  }

  /**
   * ยกเลิกการลงทะเบียนสอบ
   */
  function cancelRegistration(examId: number): void {
    const index = pendingRegistrations.value.findIndex((e) => e.id === examId);
    if (index !== -1) {
      const cancelled = pendingRegistrations.value.splice(index, 1)[0];
      if (cancelled) {
        // ย้ายไป history พร้อมเปลี่ยนสถานะ (ไม่ส่ง fee/deadline/actions)
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

  /**
   * ยืนยันการชำระเงิน → ย้ายจาก Pending → History (สถานะ: กำลังตรวจสอบ)
   */
  function confirmPayment(examId: number): void {
    const index = pendingRegistrations.value.findIndex((e) => e.id === examId);
    if (index !== -1) {
      const paid = pendingRegistrations.value.splice(index, 1)[0];
      if (paid) {
        // ย้ายไป history (ไม่ส่ง fee/deadline/actions)
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

  /**
   * เพิ่มรอบสอบใหม่ (จากหน้า Create Exam)
   */
  function addExamRound(payload: {
    examName: string;
    location: string;
    examType: string;
    fee: string | number;
    seats: number;
    examDate: string; // Format: DD/MM/YYYY (Buddhist)
    timeRanges: string[];
  }): void {
    const [dd, mm, yyyy] = payload.examDate.split('/');
    if (!dd || !mm || !yyyy) return;

    const gregorianYear = parseInt(yyyy) - 543;
    const dateKey = `${gregorianYear}-${mm}-${dd}`;

    let formattedFee = `Fee : ${payload.fee} ฿`;
    if (payload.fee === '0.00' || !payload.fee) {
      formattedFee = 'Fee : 500 ฿'; // fallback
    }

    if (!scheduleData.value[dateKey]) {
      scheduleData.value[dateKey] = {
        location: payload.location || 'Computer Center, BUU',
        fee: formattedFee,
        rounds: [],
      };
    } else {
      if (payload.location) scheduleData.value[dateKey].location = payload.location;
      if (payload.fee && payload.fee !== '0.00') scheduleData.value[dateKey].fee = formattedFee;
    }

    const day = scheduleData.value[dateKey];
    if (!day) return;

    payload.timeRanges.forEach((timeRange) => {
      let maxId = 0;
      Object.values(scheduleData.value).forEach((d) => {
        d.rounds.forEach((r) => {
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

    // Automatically select the newly created date
    selectedDate.value = dateKey;
  }

  return {
    // Schedule State
    examInfo,
    selectedDate,
    scheduleData,

    // Schedule Computed
    selectedDateRounds,
    currentDayDetails,
    dynamicBadgeText,
    calendarAvailability,
    formattedSelectedDate,

    // History State
    pendingRegistrations,
    historyRecords,

    // Actions
    confirmRegistration,
    confirmSpecialRegistration,
    cancelRegistration,
    confirmPayment,
    addExamRound,
    initSchedule,
  };
});
