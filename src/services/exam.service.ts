import { api } from 'src/boot/axios';
import type {
  ExamHistoryItem,
  DayData,
  ExamRound,
  BackendExam,
  ExamInfo,
  BackendLocation,
} from 'src/types/exam';
import { BUDDHIST_YEAR_OFFSET, SESSION_STATUS_OPEN, DEFAULT_EXAM_INFO } from 'src/constants/exam';

/** Payload for creating a new exam round (Frontend form structure) */
export interface CreateExamPayload {
  examName: string;
  locationId: number;
  examType: string;
  examFormat: string;
  fee: string | number;
  seats: number;
  isPublished: boolean;
  examDate: string; // DD/MM/YYYY (Buddhist)
  regStartDate: string; // DD/MM/YYYY (Buddhist)
  regEndDate: string; // DD/MM/YYYY (Buddhist)
  payStartDate: string; // DD/MM/YYYY (Buddhist)
  payEndDate: string; // DD/MM/YYYY (Buddhist)
  timeRanges: { startTime: string; endTime: string }[];
  fundSourceId?: number;
}

/** Interface for FundSource from Backend */
export interface FundSource {
  FS_ID: number;
  FS_NAME: string;
  FS_ACCOUNT_CODE: string;
}

/** Interface for ExamLocation option used in dropdowns */
export interface ExamLocationOption {
  label: string;
  value: number;
  raw: BackendLocation;
}

export const defaultExamInfo: ExamInfo = DEFAULT_EXAM_INFO;

export const fetchScheduleData = async (): Promise<Record<string, DayData>> => {
  try {
    const response = await api.get<BackendExam[]>('/exam');
    const exams: BackendExam[] = response.data;
    const schedule: Record<string, DayData> = {};

    exams.forEach((exam: BackendExam) => {
      const date = exam.EXAM_DATE;

      const sortedSessions = [...(exam.SESSIONS || [])].sort((a, b) =>
        (a.SS_START_TIME || '').localeCompare(b.SS_START_TIME || ''),
      );

      if (!schedule[date]) {
        const firstLocation = sortedSessions[0]?.LOCATION;
        const locationLabel = firstLocation
          ? `${firstLocation.LOCATION_NAME}${firstLocation.LOCATION_ROOM_NO ? ` (${firstLocation.LOCATION_ROOM_NO})` : ''}`
          : 'TBA';

        schedule[date] = {
          location: locationLabel,
          fee: `Fee : ${exam.EXAM_FEE} ฿`,
          rounds: [],
        };
      }

      const dayData = schedule[date];
      if (!dayData) return;

      sortedSessions.forEach((session) => {
        const startTime = session.SS_START_TIME ? session.SS_START_TIME.substring(0, 5) : '00:00';
        const endTime = session.SS_END_TIME ? session.SS_END_TIME.substring(0, 5) : '00:00';

        const round: ExamRound = {
          id: session.SS_ID,
          title: exam.EXAM_NAME || 'BUU - GET',
          timeRange: `${startTime} - ${endTime}`,
          roundTypeLabel: exam.EXAM_TYPE || 'รอบทั่วไป',
          availableSeats: (session.SS_CAPACITY || 0) - (session.ENROLLMENTS?.length || 0),
          totalSeats: session.SS_CAPACITY || 0,
        };
        dayData.rounds.push(round);
      });
    });

    Object.values(schedule).forEach((day: DayData) => {
      day.rounds.sort((a, b) => a.timeRange.localeCompare(b.timeRange));
    });

    return schedule;
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    throw error;
  }
};

/**
 * Converts DD/MM/YYYY (Buddhist) to YYYY-MM-DD (Gregorian)
 */
const buddhistToGregorian = (dateStr: string): string => {
  if (!dateStr) return '';
  const [d, m, y] = dateStr.split('/');
  if (!d || !m || !y) return '';
  const gregorianYear = parseInt(y) - BUDDHIST_YEAR_OFFSET;
  return `${gregorianYear}-${m}-${d}`;
};

/**
 * Creates a new Exam and its corresponding Sessions
 */
export const createExamRound = async (payload: CreateExamPayload): Promise<void> => {
  try {
    // 1. Create the Exam
    const examResponse = await api.post<BackendExam>('/exam', {
      EXAM_NAME: payload.examName,
      EXAM_TYPE: payload.examType,
      EXAM_FORMAT: payload.examFormat,
      EXAM_FEE: Number(payload.fee),
      EXAM_DATE: buddhistToGregorian(payload.examDate),
      EXAM_REG_START_DATE: buddhistToGregorian(payload.regStartDate),
      EXAM_REG_END_DATE: buddhistToGregorian(payload.regEndDate),
      EXAM_PAY_START_DATE: buddhistToGregorian(payload.payStartDate),
      EXAM_PAY_END_DATE: buddhistToGregorian(payload.payEndDate),
      EXAM_PUBLISHED: payload.isPublished,
      FUND_SOURCE_ID: payload.fundSourceId,
    });

    const examId = examResponse.data.EXAM_ID;

    // 2. Create Sessions for each time range
    const sessionPromises = payload.timeRanges.map((range) => {
      return api.post('/exam-sessions', {
        EXAM_ID: examId,
        LOCATION_ID: payload.locationId,
        SS_START_TIME: range.startTime.replace(/\s/g, ''),
        SS_END_TIME: range.endTime.replace(/\s/g, ''),
        SS_CAPACITY: payload.seats,
        SS_SESSION_STATUS: SESSION_STATUS_OPEN,
      });
    });

    await Promise.all(sessionPromises);
  } catch (error) {
    console.error('Error creating exam round:', error);
    throw error;
  }
};

/**
 * Fetches all fund sources from the backend
 */
export const fetchFundSources = async (): Promise<FundSource[]> => {
  try {
    const response = await api.get<FundSource[]>('/fund-sources');
    return response.data;
  } catch (error) {
    console.error('Error fetching fund sources:', error);
    return [];
  }
};

/**
 * Fetches all exam locations from the backend
 */
export const fetchExamLocations = async (): Promise<ExamLocationOption[]> => {
  try {
    const response = await api.get<BackendLocation[]>('/exam-locations');
    return response.data.map((loc) => ({
      label: `${loc.LOCATION_NAME}${loc.LOCATION_ROOM_NO ? ` (${loc.LOCATION_ROOM_NO})` : ''}`,
      value: loc.LOCATION_ID,
      raw: loc,
    }));
  } catch (error) {
    console.error('Error fetching exam locations:', error);
    return [];
  }
};

export const mockScheduleData: Record<string, DayData> = {};

export const mockHistoryRecords: ExamHistoryItem[] = [];
