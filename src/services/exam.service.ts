import type { ExamInfo, ExamHistoryItem, DayData } from 'src/types/exam';

/** ข้อมูลหลักของการสอบ (แสดงใน ExamDetail) */
export const defaultExamInfo: ExamInfo = {
  badgeText: 'รอบทั่วไป',
  title: 'การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET',
  subtitle: 'เลือกวันที่และเวลาที่สะดวกในการมาทดสอบ โดยตรวจสอบจำนวนที่นั่งว่างในแต่ละช่วงเวลา',
  locationText: 'Computer Center , BUU (201)',
  feeText: 'Fee : 500 ฿',
};

/**
 * Mockup ข้อมูลรายวัน (สถาบันภาษา ม.บูรพา)
 * แบ่งตามสถานที่สอบและประเภทการสอบที่สมจริง
 */
export const mockScheduleData: Record<string, DayData> = {
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
      {
        id: 203,
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
  '2026-05-14': {
    location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
    fee: 'Fee : 800 ฿',
    rounds: [
      {
        id: 701,
        title: 'BUU - GET (Special)',
        timeRange: '08:00 - 10:00',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 10,
        totalSeats: 20,
      },
      {
        id: 702,
        title: 'BUU - GET (Special)',
        timeRange: '10:30 - 12:30',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 5,
        totalSeats: 20,
      },
      {
        id: 703,
        title: 'BUU - GET (Special)',
        timeRange: '13:30 - 15:30',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 0,
        totalSeats: 20,
      },
      {
        id: 704,
        title: 'BUU - GET (Special)',
        timeRange: '16:00 - 18:00',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 8,
        totalSeats: 20,
      },
    ],
  },
  '2026-05-15': {
    location: 'Computer Center , BUU (อาคารสำนักคอมพิวเตอร์ ชั้น 2)',
    fee: 'Fee : 500 ฿',
    rounds: [
      {
        id: 801,
        title: 'BUU - GET (General)',
        timeRange: '09:00 - 11:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 15,
        totalSeats: 30,
      },
      {
        id: 802,
        title: 'BUU - GET (General)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 22,
        totalSeats: 30,
      },
      {
        id: 803,
        title: 'BUU - GET (General)',
        timeRange: '15:30 - 17:30',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 10,
        totalSeats: 30,
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
        availableSeats: 5,
        totalSeats: 30,
      },
    ],
  },
  '2026-05-21': {
    location: 'QS Building (อาคารเฉลิมพระเกียรติ คณะศึกษาศาสตร์)',
    fee: 'Fee : 500 ฿',
    rounds: [
      {
        id: 901,
        title: 'BUU - GET (General)',
        timeRange: '08:00 - 10:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 10,
        totalSeats: 30,
      },
      {
        id: 902,
        title: 'BUU - GET (General)',
        timeRange: '10:00 - 12:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 5,
        totalSeats: 30,
      },
      {
        id: 903,
        title: 'BUU - GET (General)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 0,
        totalSeats: 30,
      },
      {
        id: 904,
        title: 'BUU - GET (General)',
        timeRange: '15:00 - 17:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 12,
        totalSeats: 30,
      },
      {
        id: 905,
        title: 'BUU - GET (General)',
        timeRange: '17:00 - 19:00',
        roundTypeLabel: 'รอบทั่วไป',
        availableSeats: 30,
        totalSeats: 30,
      },
    ],
  },
  '2026-05-25': {
    location: 'Building 600 (อาคารปฏิบัติการรวม คณะวิทยาศาสตร์)',
    fee: 'Fee : 800 ฿',
    rounds: [
      {
        id: 1001,
        title: 'BUU - GET (Special)',
        timeRange: '09:00 - 11:00',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 8,
        totalSeats: 25,
      },
      {
        id: 1002,
        title: 'BUU - GET (Special)',
        timeRange: '13:00 - 15:00',
        roundTypeLabel: 'รอบพิเศษ',
        availableSeats: 15,
        totalSeats: 25,
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
  '2026-05-22': {
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
};

/** รายการสอบที่ผ่านมาแล้ว (mock — ชำระเงินแล้ว / ยกเลิก / สอบเสร็จ) */
export const mockHistoryRecords: ExamHistoryItem[] = [
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
];
