import { api } from 'src/boot/axios';
import type {
  ExamHistoryItem,
  DayData,
  ExamRound,
  BackendExam,
  BackendLocation,
  ExamInfo,
  AdmissionVoucherData,
} from 'src/types/exam';
import type { ExamSchedule } from 'src/types/exam.types';
import {
  BUDDHIST_YEAR_OFFSET,
  SESSION_STATUS_OPEN,
  DEFAULT_EXAM_INFO,
  EXAM_TYPE_GENERAL,
} from 'src/constants/exam';

/** Constants to prevent hard-coding */
const DEFAULT_EXAM_TITLE = 'BUU - GET';
const DEFAULT_LOCATION_TEXT = 'TBA';

/** Helper to clean and format time strings to HH:mm */
export const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '00:00';
  return timeStr.replace(/\s/g, '').substring(0, 5);
};

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
          : DEFAULT_LOCATION_TEXT;

        schedule[date] = {
          location: locationLabel,
          fee: `Fee : ${exam.EXAM_FEE} ฿`,
          rounds: [],
        };
      }

      const dayData = schedule[date];
      if (!dayData) return;

      sortedSessions.forEach((session) => {
        const startTime = formatTime(session.SS_START_TIME);
        const endTime = formatTime(session.SS_END_TIME);

        const round: ExamRound = {
          id: session.SS_ID,
          title: exam.EXAM_NAME || DEFAULT_EXAM_TITLE,
          timeRange: `${startTime} - ${endTime}`,
          roundTypeLabel: exam.EXAM_TYPE || EXAM_TYPE_GENERAL,
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
 * Fetches all exams and maps them to the ExamSchedule interface for the management table.
 */
export const fetchExamSchedules = async (): Promise<ExamSchedule[]> => {
  try {
    const response = await api.get<BackendExam[]>('/exam');
    const exams = response.data;

    return exams.map((exam) => {
      // Calculate total capacity and registered count across all sessions
      let capacity = 0;
      let registeredCount = 0;
      let locationName = DEFAULT_LOCATION_TEXT;

      if (exam.SESSIONS && exam.SESSIONS.length > 0) {
        exam.SESSIONS.forEach((session) => {
          capacity += session.SS_CAPACITY || 0;
          registeredCount += session.ENROLLMENTS?.length || 0;
        });

        const firstLoc = exam.SESSIONS[0]?.LOCATION;
        if (firstLoc) {
          locationName = `${firstLoc.LOCATION_NAME}${firstLoc.LOCATION_ROOM_NO ? ` (${firstLoc.LOCATION_ROOM_NO})` : ''}`;
        }
      }

      return {
        id: String(exam.EXAM_ID),
        examName: exam.EXAM_NAME || DEFAULT_EXAM_TITLE,
        examType:
          exam.EXAM_TYPE === EXAM_TYPE_GENERAL || exam.EXAM_TYPE === 'general'
            ? 'general'
            : 'special',
        examDate: exam.EXAM_DATE, // assuming it's in YYYY-MM-DD or ISO format from backend
        examLocation: locationName,
        registeredCount,
        capacity,
        status: exam.EXAM_PUBLISHED === false ? 'unpublished' : 'published',
      };
    });
  } catch (error) {
    console.error('Error fetching exam schedules:', error);
    throw error;
  }
};

/**
 * Fetches a single exam by ID with all relations (sessions, locations, fund source)
 */
export const fetchExamById = async (id: number): Promise<BackendExam> => {
  try {
    const response = await api.get<BackendExam>(`/exam/${id}`);
    return response.data;
  } catch (error) {
    // Fallback: If /exam/:id fails, try fetching all and filtering
    const response = await api.get<BackendExam[]>('/exam');
    const found = response.data.find((e) => e.EXAM_ID === id);
    if (found) return found;
    console.error(`Error fetching exam ${id}:`, error);
    throw error;
  }
};

const buddhistToGregorian = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('/')) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  const gregorianYear = parseInt(y as string) - BUDDHIST_YEAR_OFFSET;
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
      FUND_SOURCE_ID: Number(payload.fundSourceId),
    });

    const examId = examResponse.data.EXAM_ID;

    // 2. Create Sessions for each time range
    const sessionPromises = payload.timeRanges.map((range) => {
      return api.post('/exam-sessions', {
        EXAM_ID: Number(examId),
        LOCATION_ID: Number(payload.locationId),
        SS_START_TIME: formatTime(range.startTime),
        SS_END_TIME: formatTime(range.endTime),
        SS_CAPACITY: Number(payload.seats),
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

/** Payload for updating an existing exam round */
export interface UpdateExamPayload extends CreateExamPayload {
  examId: number;
  /** Existing session IDs to keep/update */
  existingSessionIds?: number[];
}

/**
 * Updates an existing Exam and synchronizes its Sessions.
 * - Updates core exam data via PATCH /exam/:id
 * - Deletes sessions that were removed
 * - Updates existing sessions
 * - Creates new sessions
 */
export const updateExamRound = async (payload: UpdateExamPayload): Promise<void> => {
  try {
    // 1. Update the Exam core data
    await api.patch(`/exam/${payload.examId}`, {
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
      FUND_SOURCE_ID: Number(payload.fundSourceId),
    });

    // 2. Synchronize sessions ONLY if timeRanges are provided (not locked)
    if (payload.timeRanges && payload.timeRanges.length > 0) {
      // Fetch current sessions to diff
      const currentExam = await fetchExamById(payload.examId);
      const currentSessionIds = (currentExam.SESSIONS || []).map((s) => s.SS_ID);
      const keepIds = payload.existingSessionIds || [];

      // 3. Delete sessions that were removed by the user
      const deleteIds = currentSessionIds.filter((id) => !keepIds.includes(id));
      const deletePromises = deleteIds.map((id) => api.delete(`/exam-sessions/${id}`));
      await Promise.all(deletePromises);

      // 4. Update existing sessions & Create new ones
      const sessionPromises = payload.timeRanges.map((range, index) => {
        const existingId = keepIds[index];
        const sessionPayload = {
          LOCATION_ID: Number(payload.locationId),
          SS_START_TIME: formatTime(range.startTime),
          SS_END_TIME: formatTime(range.endTime),
          SS_CAPACITY: Number(payload.seats),
        };

        if (existingId) {
          // Update existing session
          return api.patch(`/exam-sessions/${existingId}`, sessionPayload);
        } else {
          // Create new session
          return api.post('/exam-sessions', {
            ...sessionPayload,
            EXAM_ID: Number(payload.examId),
            SS_SESSION_STATUS: SESSION_STATUS_OPEN,
          });
        }
      });

      await Promise.all(sessionPromises);
    }
  } catch (error) {
    console.error('Error updating exam round:', error);
    throw error;
  }
};

/**
 * Deletes an exam round by ID.
 * @param id - The ID of the exam to delete
 */
export const deleteExam = async (id: number | string): Promise<void> => {
  try {
    await api.delete(`/exam/${id}`);
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};

/**
 * Fetches admission voucher data for a specific enrollment.
 * @param enrollmentId - The ID of the enrollment record
 */
export const fetchAdmissionVoucher = async (
  enrollmentId: number | string,
): Promise<AdmissionVoucherData> => {
  try {
    const response = await api.get<AdmissionVoucherData>(`/enrollments/${enrollmentId}/voucher`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching admission voucher for enrollment ${enrollmentId}:`, error);
    throw error;
  }
};
