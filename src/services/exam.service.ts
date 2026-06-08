import { api } from 'src/boot/axios';
import type {
  DayData,
  ExamRound,
  BackendExam,
  BackendLocation,
  AdmissionVoucherData,
  ExamEnrollment,
} from 'src/types/exam';
import type { ExamSchedule } from 'src/types/exam.types';
import {
  BUDDHIST_YEAR_OFFSET,
  SESSION_STATUS_OPEN,
  EXAM_TYPE_GENERAL,
  DEFAULT_EXAM_TITLE,
  DEFAULT_LOCATION_TEXT,
  formatFee,
  formatLocationWithRoom,
  INTERNAL_EXAM_TYPE_GENERAL,
  INTERNAL_EXAM_TYPE_SPECIAL,
  EXAM_STATUS_PUBLISHED,
  EXAM_STATUS_UNPUBLISHED,
  ENROLLMENT_STATUS,
} from 'src/constants/exam';
import type { PasscodeLog } from 'src/types/common';
// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_DURATION_MS = 30000; // 30 seconds short-term cache

// In-memory cache for exam data
let examsCache: BackendExam[] | null = null;
let lastFetchTimestamp = 0;

/**
 * Centrally fetch all exams with a short-term in-memory cache.
 * This prevents redundant large downloads of the /exam endpoint when multiple
 * components or stores request it simultaneously.
 */
export const fetchAllExamsRaw = async (force = false): Promise<BackendExam[]> => {
  const now = Date.now();
  if (!force && examsCache && now - lastFetchTimestamp < CACHE_DURATION_MS) {
    return examsCache;
  }

  return retryAsync(async () => {
    const response = await api.get<BackendExam[]>('/exam');
    examsCache = response.data;
    lastFetchTimestamp = Date.now();
    return examsCache;
  });
};

/**
 * Retry helper function - retries a function with exponential backoff
 * Use only for GET requests (idempotent operations)
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS,
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === maxAttempts - 1;

      if (!isLastAttempt) {
        // Exponential backoff: delay increases with each retry
        const delay = delayMs * Math.pow(2, attempt);
        console.warn(
          `Attempt ${attempt + 1}/${maxAttempts} failed. Retrying in ${delay}ms...`,
          error,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
};

export const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '00:00';
  return timeStr.replace(/\s/g, '').substring(0, 5);
};

export const formatBackendDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  return dateStr.includes('T') ? (dateStr.split('T')[0] ?? '') : dateStr;
};

export interface CreateExamPayload {
  examName: string;
  locationId: number;
  examType: string;
  examFormat: string;
  fee: string | number;
  seats: number;
  isPublished: boolean;
  examDate: string;
  regStartDate: string;
  regEndDate: string;
  payStartDate: string;
  payEndDate: string;
  timeRanges: {
    startTime: string;
    endTime: string;
    locationId?: number;
    seats?: number;
    proctorName?: string;
  }[];
  fundSourceId?: number | null;
}

export interface FundSource {
  FS_ID: number;
  FS_NAME: string;
  FS_ACCOUNT_CODE: string;
  FS_FACULTY?: string;
}

export interface ExamLocationOption {
  label: string;
  value: number;
  raw: BackendLocation;
}

export const fetchScheduleData = async (force = false): Promise<Record<string, DayData>> => {
  const allExams = await fetchAllExamsRaw(force);
  const exams: BackendExam[] = allExams.filter((e) => e.EXAM_PUBLISHED === true);
  const schedule: Record<string, DayData> = {};

  exams.forEach((exam: BackendExam) => {
    const date = formatBackendDate(exam.EXAM_DATE);

    const sortedSessions = [...(exam.SESSIONS || [])].sort((a, b) =>
      (a.SS_START_TIME || '').localeCompare(b.SS_START_TIME || ''),
    );

    if (!schedule[date]) {
      const firstLocation = sortedSessions[0]?.LOCATION;
      const locationLabel = firstLocation
        ? `${firstLocation.LOCATION_NAME}${firstLocation.LOCATION_ROOM_NO ? ` (${firstLocation.LOCATION_ROOM_NO})` : ''}`
        : DEFAULT_LOCATION_TEXT;

      schedule[date] = {
        examId: exam.EXAM_ID,
        title: exam.EXAM_NAME || DEFAULT_EXAM_TITLE,
        subtitle: firstLocation?.LOCATION_NAME || '',
        location: locationLabel,
        fee: formatFee(exam.EXAM_FEE),
        formatText: exam.EXAM_FORMAT || '',
        rounds: [],
      };
    }

    const dayData = schedule[date];
    if (!dayData || dayData.examId !== exam.EXAM_ID) return;

    sortedSessions.forEach((session) => {
      const startTime = formatTime(session.SS_START_TIME);
      const endTime = formatTime(session.SS_END_TIME);
      const timeRange = `${startTime} - ${endTime}`;

      const activeCount = (session.ENROLLMENTS || []).reduce(
        (acc, e) => (e.ERM_STATUS !== ENROLLMENT_STATUS.CANCELLED ? acc + 1 : acc),
        0,
      );

      const currentAvailable = (session.SS_CAPACITY || 0) - activeCount;
      const currentTotal = session.SS_CAPACITY || 0;

      const existingRound = dayData.rounds.find((r) => r.timeRange === timeRange);

      if (existingRound) {
        existingRound.availableSeats += currentAvailable;
        existingRound.totalSeats += currentTotal;
        if (existingRound.availableSeats - currentAvailable <= 0 && currentAvailable > 0) {
          existingRound.id = session.SS_ID;
        }
      } else {
        const round: ExamRound = {
          id: session.SS_ID,
          title: exam.EXAM_NAME || DEFAULT_EXAM_TITLE,
          timeRange,
          roundTypeLabel: exam.EXAM_TYPE || EXAM_TYPE_GENERAL,
          availableSeats: currentAvailable,
          totalSeats: currentTotal,
          regStartDate: exam.EXAM_REG_START_DATE,
          regEndDate: exam.EXAM_REG_END_DATE,
          examDate: formatBackendDate(exam.EXAM_DATE),
        };
        dayData.rounds.push(round);
      }
    });
  });

  Object.values(schedule).forEach((day: DayData) => {
    day.rounds.sort((a, b) => a.timeRange.localeCompare(b.timeRange));
  });

  return schedule;
};

export const fetchExamSchedules = async (force = false): Promise<ExamSchedule[]> => {
  const exams = await fetchAllExamsRaw(force);

  return exams.map((exam) => {
    let capacity = 0;
    let registeredCount = 0;
    let locationName = DEFAULT_LOCATION_TEXT;

    if (exam.SESSIONS && exam.SESSIONS.length > 0) {
      exam.SESSIONS.forEach((session) => {
        capacity += session.SS_CAPACITY || 0;
        const activeCount = (session.ENROLLMENTS || []).reduce(
          (acc, e) => (e.ERM_STATUS !== ENROLLMENT_STATUS.CANCELLED ? acc + 1 : acc),
          0,
        );
        registeredCount += activeCount;
      });

      const firstLoc = exam.SESSIONS[0]?.LOCATION;
      if (firstLoc) {
        locationName = formatLocationWithRoom(firstLoc.LOCATION_NAME, firstLoc.LOCATION_ROOM_NO);
      }
    }

    return {
      id: String(exam.EXAM_ID),
      examName: exam.EXAM_NAME || DEFAULT_EXAM_TITLE,
      examType:
        exam.EXAM_TYPE === EXAM_TYPE_GENERAL || exam.EXAM_TYPE === INTERNAL_EXAM_TYPE_GENERAL
          ? INTERNAL_EXAM_TYPE_GENERAL
          : INTERNAL_EXAM_TYPE_SPECIAL,
      examDate: formatBackendDate(exam.EXAM_DATE),
      regStartDate: formatBackendDate(exam.EXAM_REG_START_DATE),
      regEndDate: formatBackendDate(exam.EXAM_REG_END_DATE),
      examLocation: locationName,
      registeredCount,
      capacity,
      status: exam.EXAM_PUBLISHED === false ? EXAM_STATUS_UNPUBLISHED : EXAM_STATUS_PUBLISHED,
    };
  });
};

export const fetchExamById = async (id: number): Promise<BackendExam> => {
  return retryAsync(async () => {
    const response = await api.get<BackendExam>(`/exam/${id}`);
    return response.data;
  });
};

export const buddhistToGregorian = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('/')) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  if (d === undefined || m === undefined || y === undefined) return '';
  const rawYear = parseInt(y.trim().split(' ')[0] || y);
  const gregorianYear = rawYear >= 2400 ? rawYear - BUDDHIST_YEAR_OFFSET : rawYear;
  const day = d.trim().split(' ')[0] || d;
  return `${gregorianYear}-${m}-${day}`;
};

export const createExamRound = async (payload: CreateExamPayload): Promise<number> => {
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
      FUND_SOURCE_ID: payload.fundSourceId ? Number(payload.fundSourceId) : null,
    });

    const examId = examResponse.data.EXAM_ID;

    // 2. Create Sessions for each time range (each range may represent a room)
    const sessionPromises = payload.timeRanges.map((range) => {
      return api.post('/exam-sessions', {
        EXAM_ID: Number(examId),
        LOCATION_ID: Number(range.locationId || payload.locationId),
        SS_START_TIME: formatTime(range.startTime),
        SS_END_TIME: formatTime(range.endTime),
        SS_CAPACITY: Number(range.seats || payload.seats),
        SS_NAME: range.proctorName || '',
        SS_SESSION_STATUS: SESSION_STATUS_OPEN,
      });
    });

    await Promise.all(sessionPromises);
    return examId;
  } catch (error) {
    console.error('Error creating exam round:', error);
    throw error;
  }
};

export const fetchFundSources = async (): Promise<FundSource[]> => {
  try {
    const response = await api.get<FundSource[]>('/fund-sources');
    return response.data;
  } catch (error) {
    console.error('Error fetching fund sources:', error);
    return [];
  }
};

export const fetchExamLocations = async (): Promise<ExamLocationOption[]> => {
  try {
    const response = await api.get<BackendLocation[]>('/exam-locations');
    return response.data.map((loc) => ({
      label: formatLocationWithRoom(loc.LOCATION_NAME, loc.LOCATION_ROOM_NO),
      value: loc.LOCATION_ID,
      raw: loc,
    }));
  } catch (error) {
    console.error('Error fetching exam locations:', error);
    return [];
  }
};

export interface UpdateExamPayload extends CreateExamPayload {
  examId: number;
  /** Existing session IDs to keep/update */
  existingSessionIds?: number[];
}

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
      FUND_SOURCE_ID: payload.fundSourceId ? Number(payload.fundSourceId) : null,
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
          LOCATION_ID: Number(range.locationId || payload.locationId),
          SS_START_TIME: formatTime(range.startTime),
          SS_END_TIME: formatTime(range.endTime),
          SS_CAPACITY: Number(range.seats || payload.seats),
          SS_NAME: range.proctorName || '',
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

export const deleteExam = async (id: number | string): Promise<void> => {
  try {
    await api.delete(`/exam/${id}`);
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};

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

export const createEnrollment = async (
  userId: number,
  sessionId: number,
  passcode?: string,
  physicalStatus?: string,
): Promise<ExamEnrollment> => {
  try {
    const response = await api.post<ExamEnrollment>('/exam-enrollments', {
      USER_ID: userId,
      SESSION_ID: sessionId,
      PASSCODE: passcode,
      PHYSICAL_STATUS: physicalStatus,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
};

export const fetchUserEnrollments = async (userId: number): Promise<ExamEnrollment[]> => {
  try {
    const response = await api.get<ExamEnrollment[]>(`/exam-enrollments/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching enrollments for user ${userId}:`, error);
    throw error;
  }
};

export const updateEnrollmentStatus = async (
  enrollmentId: number,
  status: number,
): Promise<ExamEnrollment> => {
  try {
    const response = await api.patch<ExamEnrollment>(`/exam-enrollments/${enrollmentId}`, {
      ERM_STATUS: status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating enrollment ${enrollmentId}:`, error);
    throw error;
  }
};

export interface CreatePasscodeItemDto {
  nationalId: string;
  fullName: string;
  passcode: string;
}

export const createExamPasscodes = async (
  examId: number,
  passcodes: CreatePasscodeItemDto[],
): Promise<void> => {
  try {
    await api.post(`/exam/${examId}/passcodes`, {
      passcodes,
    });
  } catch (error) {
    console.error(`Error creating passcodes for exam ${examId}:`, error);
    throw error;
  }
};
export const fetchPasscodeHistory = async (examId: number | string): Promise<PasscodeLog[]> => {
  try {
    const response = await api.get<PasscodeLog[]>(`/exam/${examId}/passcode-history`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching passcode history for exam ${examId}:`, error);
    throw error;
  }
};

export const logPasscodeUsage = async (
  examId: number | string,
  payload: {
    passcodeId: number;
    fullName: string;
    passcode: string;
  },
): Promise<void> => {
  try {
    await api.post(`/exam/${examId}/passcode-log`, payload);
  } catch (error) {
    console.error(`Error logging passcode usage for exam ${examId}:`, error);
    throw error;
  }
};
