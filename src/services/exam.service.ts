import { api } from 'src/boot/axios';
import type {
  DayData,
  ExamRound,
  BackendExam,
  BackendSession,
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

export const invalidateExamCache = (): void => {
  examsCache = null;
  lastFetchTimestamp = 0;
};

const isActiveEnrollment = (enrollment: { ERM_STATUS: number }): boolean =>
  enrollment.ERM_STATUS !== ENROLLMENT_STATUS.CANCELLED;

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
    proctorName?: string | null;
    sessionId?: number;
  }[];
  fundSourceId?: number | null;
}

interface GroupedSessionTimeRange {
  startTime: string;
  endTime: string;
  seats: number;
  locations: { locationId: number; proctorName: string | null }[];
  sessionId?: number;
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

      const activeCount = (session.ENROLLMENTS || []).filter(isActiveEnrollment).length;

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
        const activeCount = (session.ENROLLMENTS || []).filter(isActiveEnrollment).length;
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

export const updateExamSessionStatus = async (sessionId: number, status: number): Promise<void> => {
  await api.patch(`/exam-sessions/${sessionId}`, {
    SS_SESSION_STATUS: status,
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

const groupTimeRangesByTime = (payload: CreateExamPayload): GroupedSessionTimeRange[] => {
  const groupedRanges = new Map<string, GroupedSessionTimeRange>();

  payload.timeRanges.forEach((range) => {
    const startTime = formatTime(range.startTime);
    const endTime = formatTime(range.endTime);
    const key = `${startTime}-${endTime}`;
    const locationId = Number(range.locationId || payload.locationId);
    const seats = Number(range.seats || payload.seats || 0);
    const proctorName = range.proctorName?.trim() || null;

    const existingRange = groupedRanges.get(key);
    if (existingRange) {
      existingRange.seats += seats;
      const existingLoc = existingRange.locations.find((l) => l.locationId === locationId);
      if (!existingLoc) {
        existingRange.locations.push({ locationId, proctorName });
      } else if (proctorName) {
        existingLoc.proctorName = existingLoc.proctorName
          ? `${existingLoc.proctorName}, ${proctorName}`
          : proctorName;
      }
      if (!existingRange.sessionId && range.sessionId) {
        existingRange.sessionId = range.sessionId;
      }
      return;
    }

    groupedRanges.set(key, {
      startTime,
      endTime,
      seats,
      locations: [{ locationId, proctorName }],
      ...(range.sessionId ? { sessionId: range.sessionId } : {}),
    });
  });

  return Array.from(groupedRanges.values());
};

const createSessionLocations = async (
  sessionId: number,
  locations: { locationId: number; proctorName: string | null }[],
): Promise<void> => {
  const uniqueLocations = [];
  const seenIds = new Set<number>();
  for (const loc of locations) {
    if (loc.locationId > 0 && !seenIds.has(loc.locationId)) {
      uniqueLocations.push(loc);
      seenIds.add(loc.locationId);
    }
  }

  await Promise.all(
    uniqueLocations.map((loc) =>
      api.post('/exam-session-locations', {
        SS_ID: sessionId,
        LOCATION_ID: loc.locationId,
        SS_NAME: loc.proctorName,
      }),
    ),
  );
};

const syncSessionLocations = async (
  sessionId: number,
  currentLocations: BackendSession['SESSION_LOCATIONS'] | undefined,
  locations: { locationId: number; proctorName: string | null }[],
): Promise<void> => {
  const uniqueLocations = [];
  const seenIds = new Set<number>();
  for (const loc of locations) {
    if (loc.locationId > 0 && !seenIds.has(loc.locationId)) {
      uniqueLocations.push(loc);
      seenIds.add(loc.locationId);
    }
  }

  const current = currentLocations || [];
  const desiredSet = new Set(uniqueLocations.map((l) => l.locationId));
  const currentMap = new Map(current.map((item) => [item.LOCATION_ID, item]));

  const promises: Promise<unknown>[] = [];

  for (const item of current) {
    if (!desiredSet.has(item.LOCATION_ID)) {
      promises.push(api.delete(`/exam-session-locations/${item.SL_ID}`));
    }
  }

  for (const loc of uniqueLocations) {
    const existing = currentMap.get(loc.locationId);
    if (!existing) {
      promises.push(
        api.post('/exam-session-locations', {
          SS_ID: sessionId,
          LOCATION_ID: loc.locationId,
          SS_NAME: loc.proctorName,
        }),
      );
    } else if (existing.SS_NAME !== loc.proctorName) {
      promises.push(
        api.patch(`/exam-session-locations/${existing.SL_ID}`, {
          SS_NAME: loc.proctorName,
        }),
      );
    }
  }

  await Promise.all(promises);
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

    // 2. Create one session per time range, then attach all rooms to that session.
    const groupedRanges = groupTimeRangesByTime(payload);
    const sessionPromises = groupedRanges.map(async (range) => {
      const primaryLocationId = range.locations[0]?.locationId || Number(payload.locationId);
      const sessionResponse = await api.post<BackendExam['SESSIONS'][number]>('/exam-sessions', {
        EXAM_ID: Number(examId),
        LOCATION_ID: primaryLocationId,
        SS_START_TIME: range.startTime,
        SS_END_TIME: range.endTime,
        SS_CAPACITY: range.seats,
        SS_SESSION_STATUS: SESSION_STATUS_OPEN,
      });

      await createSessionLocations(sessionResponse.data.SS_ID, range.locations);
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
    const locations = await Promise.all(
      response.data.map(async (location) => {
        try {
          const detailResponse = await api.get<BackendLocation>(
            `/exam-locations/${location.LOCATION_ID}`,
          );
          return detailResponse.data;
        } catch {
          return location;
        }
      }),
    );

    return locations.map((loc) => ({
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
      const currentSessionsById = new Map(
        (currentExam.SESSIONS || []).map((session) => [session.SS_ID, session]),
      );
      const groupedRanges = groupTimeRangesByTime(payload);
      const keepIds = [
        ...new Set(
          groupedRanges.map((range) => range.sessionId).filter((id): id is number => Boolean(id)),
        ),
      ];

      // 3. Delete sessions that were removed by the user
      const deleteIds = currentSessionIds.filter((id) => !keepIds.includes(id));
      const deletePromises = deleteIds.map((id) => api.delete(`/exam-sessions/${id}`));
      await Promise.all(deletePromises);

      // 4. Update existing sessions & create new ones, one row per time range.
      const sessionPromises = groupedRanges.map(async (range) => {
        const existingId = range.sessionId;
        const primaryLocationId = range.locations[0]?.locationId || Number(payload.locationId);
        const sessionPayload = {
          LOCATION_ID: primaryLocationId,
          SS_START_TIME: range.startTime,
          SS_END_TIME: range.endTime,
          SS_CAPACITY: range.seats,
        };

        if (existingId) {
          // Update existing session
          await api.patch(`/exam-sessions/${existingId}`, sessionPayload);
          await syncSessionLocations(
            existingId,
            currentSessionsById.get(existingId)?.SESSION_LOCATIONS,
            range.locations,
          );
          return;
        }

        // Create new session
        const sessionResponse = await api.post<BackendExam['SESSIONS'][number]>('/exam-sessions', {
          ...sessionPayload,
          EXAM_ID: Number(payload.examId),
          SS_SESSION_STATUS: SESSION_STATUS_OPEN,
        });

        await createSessionLocations(sessionResponse.data.SS_ID, range.locations);
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
    invalidateExamCache();
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
    invalidateExamCache();
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
    invalidateExamCache();
    return response.data;
  } catch (error) {
    console.error(`Error updating enrollment ${enrollmentId}:`, error);
    throw error;
  }
};

export interface CreatePasscodeItemDto {
  nationalId?: string | undefined;
  passportNo?: string | undefined;
  fullName?: string | undefined;
  fullNameEn?: string | undefined;
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
