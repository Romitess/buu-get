import { api } from 'src/boot/axios';
import type { ExamInfo, ExamHistoryItem, DayData, ExamRound } from 'src/types/exam';

/** Backend Exam interface matching the DTO/Entity */
interface BackendExam {
  EXAM_ID: number;
  EXAM_NAME: string;
  EXAM_TYPE: string;
  EXAM_FEE: number;
  EXAM_DATE: string;
  SESSIONS: {
    SS_ID: number;
    SS_START_TIME: string;
    SS_END_TIME: string;
    SS_CAPACITY: number;
    LOCATION_NAME: string;
  }[];
}

export const fetchScheduleData = async (): Promise<Record<string, DayData>> => {
  try {
    const response = await api.get<BackendExam[]>('/exam');
    const exams = response.data;
    const schedule: Record<string, DayData> = {};

    exams.forEach((exam) => {
      const date = exam.EXAM_DATE; // Format YYYY-MM-DD
      if (!schedule[date]) {
        schedule[date] = {
          location: exam.SESSIONS[0]?.LOCATION_NAME || 'TBA',
          fee: `Fee : ${exam.EXAM_FEE} ฿`,
          rounds: [],
        };
      }

      const dayData = schedule[date];
      if (!dayData) return;

      exam.SESSIONS?.forEach((session) => {
        // Map backend session to frontend ExamRound
        const startTime = session.SS_START_TIME ? session.SS_START_TIME.substring(0, 5) : '00:00';
        const endTime = session.SS_END_TIME ? session.SS_END_TIME.substring(0, 5) : '00:00';

        const round: ExamRound = {
          id: session.SS_ID,
          title: exam.EXAM_NAME || 'BUU - GET',
          // Format time from HH:MM:SS to HH:MM
          timeRange: `${startTime} - ${endTime}`,
          roundTypeLabel: exam.EXAM_TYPE || 'รอบทั่วไป',
          availableSeats: session.SS_CAPACITY || 0,
          totalSeats: session.SS_CAPACITY || 0,
        };
        dayData.rounds.push(round);
      });
    });

    return schedule;
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    throw error;
  }
};

/** ข้อมูลหลักของการสอบ (แสดงใน ExamDetail) */
export const defaultExamInfo: ExamInfo = {
  badgeText: 'รอบทั่วไป',
  title: 'การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET',
  subtitle: 'เลือกวันที่และเวลาที่สะดวกในการมาทดสอบ โดยตรวจสอบจำนวนที่นั่งว่างในแต่ละช่วงเวลา',
  locationText: 'Computer Center , BUU (201)',
  feeText: 'Fee : 500 ฿',
};

/**
 * ข้อมูลรายวัน (สถาบันภาษา ม.บูรพา) — ว่างไว้เพื่อให้ระบบโหลดจาก API เสมอ
 */
export const mockScheduleData: Record<string, DayData> = {};

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
