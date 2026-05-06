import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ExamRound, ExamInfo, ExamHistoryItem, DayData } from 'src/components/models';

/**
 * useExamStore
 * ศูนย์กลางจัดการข้อมูลตารางสอบ (Schedule) และประวัติการสอบ (History)
 * - Mock Data ทั้งหมดรวมอยู่ที่นี่
 * - Business Logic: ลงทะเบียน → สร้าง Pending → ชำระเงิน → ยืนยัน → ประวัติ
 */
export const useExamStore = defineStore('exam', () => {
  // ============================================================================
  // 1. SCHEDULE STATE (ข้อมูลตารางสอบ)
  // ============================================================================

  /** ข้อมูลหลักของการสอบ (แสดงใน ExamDetail) */
  const examInfo = ref<ExamInfo>({
    badgeText: 'รอบทั่วไป',
    title: 'การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET',
    subtitle: 'เลือกวันที่และเวลาที่สะดวกในการมาทดสอบ โดยตรวจสอบจำนวนที่นั่งว่างในแต่ละช่วงเวลา',
    locationText: 'Computer Center , BUU (201)',
    feeText: 'Fee : 500 ฿',
  });

  /** วันที่เลือก (Default เป็นวันนี้) */
  const selectedDate = ref<string>(new Date().toISOString().split('T')[0] || '');

  /**
   * Mockup ข้อมูลรายวัน (สถาบันภาษา ม.บูรพา)
   * แบ่งตามสถานที่สอบและประเภทการสอบที่สมจริง
   */
  const scheduleData = ref<Record<string, DayData>>({
    // --- รอบทั่วไป: อาคารสำนักคอมพิวเตอร์ (Computer Center) ---
    '2026-05-06': {
      location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์ ชั้น 2)',
      fee: 'Fee : 500 ฿',
      rounds: [
        {
          id: 101,
          title: 'BUU - GET (General)',
          timeRange: '08:00 - 10:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 15,
          totalSeats: 30,
        },
        {
          id: 102,
          title: 'BUU - GET (General)',
          timeRange: '10:00 - 12:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 5,
          totalSeats: 30,
        },
        {
          id: 103,
          title: 'BUU - GET (General)',
          timeRange: '13:00 - 15:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 22,
          totalSeats: 30,
        },
      ],
    },
    '2026-05-13': {
      location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์ ชั้น 2)',
      fee: 'Fee : 500 ฿',
      rounds: [
        {
          id: 201,
          title: 'BUU - GET (General)',
          timeRange: '09:00 - 11:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 28,
          totalSeats: 30,
        },
        {
          id: 202,
          title: 'BUU - GET (General)',
          timeRange: '13:00 - 15:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 10,
          totalSeats: 30,
        },
      ],
    },

    // --- รอบพิเศษ: อาคารปฏิบัติการรวม (Building 600) ---
    '2026-05-11': {
      location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
      fee: 'Fee : 800 ฿',
      rounds: [
        {
          id: 501,
          title: 'BUU - GET (Special)',
          timeRange: '08:30 - 10:30',
          roundTypeLabel: 'รอบพิเศษ',
          availableSeats: 5,
          totalSeats: 20,
        },
        {
          id: 502,
          title: 'BUU - GET (Special)',
          timeRange: '13:30 - 15:30',
          roundTypeLabel: 'รอบพิเศษ',
          availableSeats: 12,
          totalSeats: 20,
        },
      ],
    },
    '2026-05-18': {
      location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
      fee: 'Fee : 800 ฿',
      rounds: [
        {
          id: 601,
          title: 'BUU - GET (Special)',
          timeRange: '10:00 - 12:00',
          roundTypeLabel: 'รอบพิเศษ',
          availableSeats: 2,
          totalSeats: 15,
        },
      ],
    },

    // --- รอบทั่วไป: อาคารเฉลิมพระเกียรติ (QS Building) ---
    '2026-05-20': {
      location: 'QS Building (อาคารเฉลิมพระเกียรติ คณะศึกษาศาสตร์)',
      fee: 'Fee : 500 ฿',
      rounds: [
        {
          id: 301,
          title: 'BUU - GET (General)',
          timeRange: '08:00 - 10:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 12,
          totalSeats: 30,
        },
        {
          id: 302,
          title: 'BUU - GET (General)',
          timeRange: '13:00 - 15:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 30,
          totalSeats: 30,
        },
      ],
    },

    // --- วันที่เต็มแล้ว (Fully Booked) ---
    '2026-05-08': {
      location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์)',
      fee: 'Fee : 500 ฿',
      rounds: [
        {
          id: 801,
          title: 'BUU - GET (General)',
          timeRange: '08:00 - 10:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 0,
          totalSeats: 30,
        },
        {
          id: 802,
          title: 'BUU - GET (General)',
          timeRange: '10:00 - 12:00',
          roundTypeLabel: 'รอบทั่วไป',
          availableSeats: 0,
          totalSeats: 30,
        },
      ],
    },
    '2026-05-15': {
      location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
      fee: 'Fee : 800 ฿',
      rounds: [
        {
          id: 901,
          title: 'BUU - GET (Special)',
          timeRange: '13:00 - 15:00',
          roundTypeLabel: 'รอบพิเศษ',
          availableSeats: 0,
          totalSeats: 20,
        },
      ],
    },
  });

  // ============================================================================
  // 2. HISTORY STATE (ข้อมูลประวัติการสอบ)
  // ============================================================================

  /** Auto-increment ID สำหรับ history item ใหม่ */
  const nextHistoryId = ref(100);

  /** รายการสอบที่รอชำระเงิน */
  const pendingRegistrations = ref<ExamHistoryItem[]>([]);

  /** รายการสอบที่ผ่านมาแล้ว (ชำระเงินแล้ว / ยกเลิก / สอบเสร็จ) */
  const historyRecords = ref<ExamHistoryItem[]>([
    {
      id: 2,
      title: 'การสอบวัดระดับภาษาอังกฤษ BUU-GET (General)',
      status: 'exam.status.verifying',
      statusType: 'primary',
      date: '15 พฤษภาคม 2569',
      time: '08:00-10:00',
      location: 'Computer Center, BUU (L201)',
    },
    {
      id: 3,
      title: 'การสอบวัดระดับภาษาอังกฤษ BUU-GET (General)',
      status: 'exam.status.verified',
      statusType: 'primary',
      date: '15 พฤษภาคม 2569',
      time: '08:00-10:00',
      location: 'Computer Center, BUU (L201)',
      actions: ['candidateCard', 'downloadReceipt'],
    },
    {
      id: 4,
      title: 'การสอบวัดระดับภาษาอังกฤษ BUU-GET (General)',
      status: 'exam.status.evaluating',
      statusType: 'primary',
      date: '15 พฤษภาคม 2569',
      time: '08:00-10:00',
      location: 'Computer Center, BUU (L201)',
    },
    {
      id: 5,
      title: 'การสอบวัดระดับภาษาอังกฤษ BUU-GET (General)',
      status: 'exam.status.completed',
      statusType: 'primary',
      date: '15 เมษายน 2569',
      time: '08:00-10:00',
      location: 'Computer Center, BUU (L201)',
      customStatus: {
        label: 'PLACEHOLDER_PASSED',
        type: 'success',
        icon: 'check',
      },
      actions: ['scoreDetails', 'certificate'],
    },
    {
      id: 6,
      title: 'การสอบวัดระดับภาษาอังกฤษ BUU-GET (General)',
      status: 'exam.status.completed',
      statusType: 'primary',
      date: '15 เมษายน 2569',
      time: '08:00-10:00',
      location: 'Computer Center, BUU (L201)',
      customStatus: {
        label: 'PLACEHOLDER_FAILED',
        type: 'error',
        icon: 'warning_amber',
      },
      actions: ['scoreDetails'],
    },
    {
      id: 7,
      title: 'การสอบวัดระดับภาษาอังกฤษ BUU-GET (General)',
      status: 'exam.status.cancelled',
      statusType: 'primary',
      date: '15 เมษายน 2569',
      time: '08:00-10:00',
      location: 'Computer Center, BUU (L201)',
      customStatus: {
        label: 'exam.status.paymentTimeout',
        type: 'error',
        icon: 'warning_amber',
      },
    },
  ]);

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
      fee: feeAmount ? Number(feeAmount) : 500,
      deadline: '29:30',
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
  };
});
