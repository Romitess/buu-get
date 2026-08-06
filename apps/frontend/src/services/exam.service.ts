import { api } from 'src/boot/axios';
import axios from 'axios';
import type {
  DayData,
  ExamRound,
  BackendExam,
  BackendSession,
  BackendLocation,
  BackendBlockedSeat,
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
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import type { PasscodeLog } from 'src/types/common';
// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_DURATION_MS = 90_000; // align with schedule poll — avoid cache miss every tick
/** Timeout สำหรับ multi-write save path (สูงกว่า default 30s ของ Axios) */
const EXAM_ROUND_WRITE_TIMEOUT_MS = 60_000;

type ExamWriteRequestConfig = { timeout?: number; signal?: AbortSignal };

// In-memory cache for exam data
let examsCache: BackendExam[] | null = null;
let lastFetchTimestamp = 0;
/** Single-flight — concurrent callers share one GET /exam */
let examsFetchInFlight: Promise<BackendExam[]> | null = null;

type BackendSessionLocation = NonNullable<BackendSession['SESSION_LOCATIONS']>[number];

export const invalidateExamCache = (): void => {
  examsCache = null;
  lastFetchTimestamp = 0;
  examsFetchInFlight = null;
};

const isActiveEnrollment = (enrollment: { ERM_STATUS: number }): boolean =>
  enrollment.ERM_STATUS !== ENROLLMENT_STATUS.CANCELLED;

const getActiveEnrollmentCount = (session: BackendSession): number => {
  if (typeof session.ACTIVE_ENROLLMENT_COUNT === 'number') {
    return session.ACTIVE_ENROLLMENT_COUNT;
  }
  return (session.ENROLLMENTS || []).filter(isActiveEnrollment).length;
};

const isRequestCanceled = (error: unknown): boolean => {
  if (axios.isCancel(error)) return true;
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; name?: string; message?: string };
  if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError' || err.name === 'AbortError') {
    return true;
  }
  return typeof err.message === 'string' && /abort|cancel/i.test(err.message);
};

export { isRequestCanceled };

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

  if (examsFetchInFlight) {
    if (!force) {
      return examsFetchInFlight;
    }
    // force: wait for current flight, then start a fresh request below
    try {
      await examsFetchInFlight;
    } catch {
      // ignore prior failure — force path starts a new request
    }
  }

  // Another caller may have populated cache (or started a flight) while we waited
  if (!force && examsCache && Date.now() - lastFetchTimestamp < CACHE_DURATION_MS) {
    return examsCache;
  }
  if (examsFetchInFlight) {
    return examsFetchInFlight;
  }

  const fetchPromise = retryAsync(async () => {
    const response = await api.get<BackendExam[]>('/exam');
    examsCache = response.data;
    lastFetchTimestamp = Date.now();
    return examsCache;
  }).finally(() => {
    if (examsFetchInFlight === fetchPromise) {
      examsFetchInFlight = null;
    }
  });

  examsFetchInFlight = fetchPromise;
  return fetchPromise;
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
      // Do not retry aborted/canceled requests — fail fast
      if (isRequestCanceled(error)) {
        throw error;
      }

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

export const parseBangkokDate = (dateStr: string): { year: number; month: number; day: number } => {
  if (!dateStr) return { year: 1970, month: 1, day: 1 };
  // If it's a date-only string like YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return { year: y || 1970, month: m || 1, day: d || 1 };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { year: 1970, month: 1, day: 1 };
  }

  // Adjust to UTC+7 (Bangkok)
  const bangkokTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    year: bangkokTime.getUTCFullYear(),
    month: bangkokTime.getUTCMonth() + 1,
    day: bangkokTime.getUTCDate(),
  };
};

export const formatBackendDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const { year, month, day } = parseBangkokDate(dateStr);
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    seatOverrides?: Record<number, number>;
    sessionLocationSnapshot?: SessionLocationSnapshotPayload;
  }[];
  fundSourceId?: number | null;
  srbId: number;
  examRound?: string;
  examFiscalYear?: string;
}

interface GroupedSessionTimeRange {
  startTime: string;
  endTime: string;
  seats: number;
  locations: {
    locationId: number;
    proctorName: string | null;
    seatOverrides?: Record<number, number>;
    sessionLocationSnapshot?: SessionLocationSnapshotPayload;
  }[];
  sessionId?: number;
}

export interface FundSource {
  FS_ID: number;
  FS_NAME: string;
  FS_ACCOUNT_CODE: string;
  FS_OPEN_STATUS?: boolean;
}

export interface SessionLocationSnapshotPayload {
  TOTAL_ROWS: number | null;
  TOTAL_COLS: number | null;
  AISLE_AFTER: { after_cols: number[]; after_rows: number[] } | null;
  LOCATION_SEAT_DIRECTION: 'HORIZONTAL' | 'VERTICAL';
  LOCATION_SEAT_CAPACITY: number | null;
  SEATS_SNAPSHOT:
    | {
        label: string | null;
        status: 'AVAILABLE' | 'BROKEN' | 'BLOCKED';
        sortorder: number | null;
      }[]
    | null;
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
        title:
          formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
          DEFAULT_EXAM_TITLE,
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

      const activeCount = getActiveEnrollmentCount(session);

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
          title:
            formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
            DEFAULT_EXAM_TITLE,
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
        const activeCount = getActiveEnrollmentCount(session);
        registeredCount += activeCount;
      });

      const firstLoc = exam.SESSIONS[0]?.LOCATION;
      if (firstLoc) {
        locationName = formatLocationWithRoom(firstLoc.LOCATION_NAME, firstLoc.LOCATION_ROOM_NO);
      }
    }

    return {
      id: String(exam.EXAM_ID),
      examName:
        formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
        DEFAULT_EXAM_TITLE,
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

export const fetchExamById = async (
  id: number,
  requestConfig?: ExamWriteRequestConfig,
): Promise<BackendExam> => {
  return retryAsync(async () => {
    const response = await api.get<BackendExam>(`/exam/${id}`, requestConfig);
    return response.data;
  });
};

/** ดึง exam พร้อม LOCATION.SEATS — ใช้เฉพาะหน้าจัดที่นั่ง / สร้าง-แก้ไขรอบสอบ */
export const fetchExamWithSeats = async (
  id: number,
  requestConfig?: ExamWriteRequestConfig,
): Promise<BackendExam> => {
  return retryAsync(async () => {
    const response = await api.get<BackendExam>(`/exam/${id}/with-seats`, requestConfig);
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

/** แปลงวันที่ปิดช่วง (BE) เป็น timestamp สิ้นวัน 23:59:59 (+07:00) */
export const buddhistToGregorianPeriodEnd = (dateStr: string): string => {
  const dateOnly = buddhistToGregorian(dateStr);
  if (!dateOnly) return '';
  return `${dateOnly}T23:59:59+07:00`;
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
    const seatOverrides = range.seatOverrides ?? {};
    const sessionLocationSnapshot = range.sessionLocationSnapshot;

    const existingRange = groupedRanges.get(key);
    if (existingRange) {
      existingRange.seats += seats;
      const existingLoc = existingRange.locations.find((l) => l.locationId === locationId);
      if (!existingLoc) {
        existingRange.locations.push({
          locationId,
          proctorName,
          seatOverrides,
          ...(sessionLocationSnapshot ? { sessionLocationSnapshot } : {}),
        });
      } else {
        if (proctorName) {
          existingLoc.proctorName = existingLoc.proctorName
            ? `${existingLoc.proctorName}, ${proctorName}`
            : proctorName;
        }
        existingLoc.seatOverrides = {
          ...(existingLoc.seatOverrides ?? {}),
          ...seatOverrides,
        };
        if (sessionLocationSnapshot) {
          existingLoc.sessionLocationSnapshot = sessionLocationSnapshot;
        }
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
      locations: [
        {
          locationId,
          proctorName,
          seatOverrides,
          ...(sessionLocationSnapshot ? { sessionLocationSnapshot } : {}),
        },
      ],
      ...(range.sessionId ? { sessionId: range.sessionId } : {}),
    });
  });

  return Array.from(groupedRanges.values());
};

const createSessionLocations = async (
  sessionId: number,
  locations: {
    locationId: number;
    proctorName: string | null;
    sessionLocationSnapshot?: SessionLocationSnapshotPayload;
  }[],
  requestConfig?: ExamWriteRequestConfig,
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
      api.post(
        '/exam-session-locations',
        {
          SS_ID: sessionId,
          LOCATION_ID: loc.locationId,
          SS_NAME: loc.proctorName,
          ...(loc.sessionLocationSnapshot ?? {}),
        },
        requestConfig,
      ),
    ),
  );
};

const normalizeJson = (value: unknown): string => JSON.stringify(value ?? null);

const sessionLocationMatches = (
  existing: BackendSessionLocation,
  desired: {
    proctorName: string | null;
    sessionLocationSnapshot?: SessionLocationSnapshotPayload;
  },
): boolean => {
  const snapshot = desired.sessionLocationSnapshot;
  return (
    (existing.SS_NAME ?? null) === (desired.proctorName ?? null) &&
    (existing.TOTAL_ROWS ?? null) === (snapshot?.TOTAL_ROWS ?? null) &&
    (existing.TOTAL_COLS ?? null) === (snapshot?.TOTAL_COLS ?? null) &&
    normalizeJson(existing.AISLE_AFTER) === normalizeJson(snapshot?.AISLE_AFTER) &&
    (existing.LOCATION_SEAT_DIRECTION ?? null) === (snapshot?.LOCATION_SEAT_DIRECTION ?? null) &&
    (existing.LOCATION_SEAT_CAPACITY ?? null) === (snapshot?.LOCATION_SEAT_CAPACITY ?? null) &&
    normalizeJson(existing.SEATS_SNAPSHOT) === normalizeJson(snapshot?.SEATS_SNAPSHOT)
  );
};

const syncSessionLocations = async (
  sessionId: number,
  currentLocations: BackendSession['SESSION_LOCATIONS'] | undefined,
  locations: {
    locationId: number;
    proctorName: string | null;
    sessionLocationSnapshot?: SessionLocationSnapshotPayload;
  }[],
  requestConfig?: ExamWriteRequestConfig,
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
      promises.push(api.delete(`/exam-session-locations/${item.SL_ID}`, requestConfig));
    }
  }

  for (const loc of uniqueLocations) {
    const existing = currentMap.get(loc.locationId);
    if (!existing) {
      promises.push(
        api.post(
          '/exam-session-locations',
          {
            SS_ID: sessionId,
            LOCATION_ID: loc.locationId,
            SS_NAME: loc.proctorName,
            ...(loc.sessionLocationSnapshot ?? {}),
          },
          requestConfig,
        ),
      );
    } else {
      if (sessionLocationMatches(existing, loc)) {
        continue;
      }

      promises.push(
        api.patch(
          `/exam-session-locations/${existing.SL_ID}`,
          {
            SS_NAME: loc.proctorName,
            ...(loc.sessionLocationSnapshot ?? {}),
          },
          requestConfig,
        ),
      );
    }
  }

  await Promise.all(promises);
};

const buildBlockedSeatPayload = (
  locations: { seatOverrides?: Record<number, number> }[],
): { LS_ID: number; BLOCK_STATUS: number }[] => {
  const mergedOverrides = new Map<number, number>();

  locations.forEach((location) => {
    Object.entries(location.seatOverrides ?? {}).forEach(([seatId, status]) => {
      mergedOverrides.set(Number(seatId), Number(status));
    });
  });

  return Array.from(mergedOverrides.entries()).map(([LS_ID, BLOCK_STATUS]) => ({
    LS_ID,
    BLOCK_STATUS,
  }));
};

const snapshotStatusToCode = (status: 'AVAILABLE' | 'BROKEN' | 'BLOCKED'): number => {
  if (status === 'BROKEN') return 1;
  if (status === 'BLOCKED') return 2;
  return 0;
};

const buildBlockedSeatPayloadFromSession = (
  session: BackendSession | undefined,
): { LS_ID: number; BLOCK_STATUS: number }[] | null => {
  if (!session?.SESSION_LOCATIONS?.length) return null;

  const mergedOverrides = new Map<number, number>();
  for (const relation of session.SESSION_LOCATIONS) {
    if (!relation.SEATS_SNAPSHOT?.length || !relation.LOCATION?.SEATS?.length) return null;

    relation.SEATS_SNAPSHOT.forEach((snapshotSeat) => {
      const baseSeat = relation.LOCATION.SEATS?.find(
        (seat) => seat.LS_SEAT_LABEL === snapshotSeat.label,
      );
      if (!baseSeat) return;

      const snapshotStatus = snapshotStatusToCode(snapshotSeat.status);
      if (baseSeat.LS_SEAT_STATUS !== snapshotStatus) {
        mergedOverrides.set(baseSeat.LS_ID, snapshotStatus);
      }
    });
  }

  return Array.from(mergedOverrides.entries()).map(([LS_ID, BLOCK_STATUS]) => ({
    LS_ID,
    BLOCK_STATUS,
  }));
};

const blockedSeatPayloadMatches = (
  currentPayload: { LS_ID: number; BLOCK_STATUS: number }[] | null,
  desiredPayload: { LS_ID: number; BLOCK_STATUS: number }[],
): boolean => {
  if (currentPayload === null) return false;

  const serialize = (payload: { LS_ID: number; BLOCK_STATUS: number }[]): string =>
    JSON.stringify(
      [...payload]
        .map((seat) => ({ LS_ID: Number(seat.LS_ID), BLOCK_STATUS: Number(seat.BLOCK_STATUS) }))
        .sort((a, b) => a.LS_ID - b.LS_ID),
    );

  return serialize(currentPayload) === serialize(desiredPayload);
};

export const replaceExamBlockedSeats = async (
  sessionId: number,
  seats: { LS_ID: number; BLOCK_STATUS: number }[],
  requestConfig?: ExamWriteRequestConfig,
): Promise<BackendBlockedSeat[]> => {
  const response = await api.post<BackendBlockedSeat[]>(
    `/exam-blocked-seats/session/${sessionId}/replace`,
    {
      seats,
    },
    requestConfig,
  );

  return response.data;
};

export const fetchExamBlockedSeats = async (sessionId: number): Promise<BackendBlockedSeat[]> => {
  const response = await api.get<BackendBlockedSeat[]>('/exam-blocked-seats', {
    params: { sessionId },
  });

  return response.data;
};

export const createExamRound = async (payload: CreateExamPayload): Promise<number> => {
  const writeOpts: ExamWriteRequestConfig = { timeout: EXAM_ROUND_WRITE_TIMEOUT_MS };

  try {
    // 1. Create the Exam
    const examResponse = await api.post<BackendExam>(
      '/exam',
      {
        EXAM_NAME: payload.examName,
        EXAM_TYPE: payload.examType,
        EXAM_FORMAT: payload.examFormat,
        EXAM_FEE: Number(payload.fee),
        EXAM_DATE: buddhistToGregorian(payload.examDate),
        EXAM_REG_START_DATE: buddhistToGregorian(payload.regStartDate),
        EXAM_REG_END_DATE: buddhistToGregorianPeriodEnd(payload.regEndDate),
        EXAM_PAY_START_DATE: buddhistToGregorian(payload.payStartDate),
        EXAM_PAY_END_DATE: buddhistToGregorianPeriodEnd(payload.payEndDate),
        EXAM_PUBLISHED: payload.isPublished,
        FUND_SOURCE_ID: payload.fundSourceId ? Number(payload.fundSourceId) : null,
        SRB_ID: Number(payload.srbId),
        EXAM_ROUND: payload.examRound,
        EXAM_FISCAL_YEAR: payload.examFiscalYear,
      },
      writeOpts,
    );

    const examId = examResponse.data.EXAM_ID;

    // 2. Create one session per time range, then attach all rooms to that session.
    const groupedRanges = groupTimeRangesByTime(payload);
    const sessionPromises = groupedRanges.map(async (range) => {
      const primaryLocationId = range.locations[0]?.locationId || Number(payload.locationId);
      const sessionResponse = await api.post<BackendExam['SESSIONS'][number]>(
        '/exam-sessions',
        {
          EXAM_ID: Number(examId),
          LOCATION_ID: primaryLocationId,
          SS_START_TIME: range.startTime,
          SS_END_TIME: range.endTime,
          SS_CAPACITY: range.seats,
          SS_SESSION_STATUS: SESSION_STATUS_OPEN,
        },
        writeOpts,
      );

      const blockedSeatPayload = buildBlockedSeatPayload(range.locations);
      await Promise.all([
        createSessionLocations(sessionResponse.data.SS_ID, range.locations, writeOpts),
        ...(blockedSeatPayload.length > 0
          ? [replaceExamBlockedSeats(sessionResponse.data.SS_ID, blockedSeatPayload, writeOpts)]
          : []),
      ]);
    });

    await Promise.all(sessionPromises);
    invalidateExamCache();
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
    // ดึง list + seats ใน request เดียว (เลิก N+1 แบบ GET /exam-locations/:id)
    const response = await api.get<BackendLocation[]>('/exam-locations', {
      params: { includeSeats: true },
    });

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
  const writeOpts: ExamWriteRequestConfig = { timeout: EXAM_ROUND_WRITE_TIMEOUT_MS };
  let step = 'patch-exam';

  try {
    // 1. Update the Exam core data
    await api.patch(
      `/exam/${payload.examId}`,
      {
        EXAM_NAME: payload.examName,
        EXAM_TYPE: payload.examType,
        EXAM_FORMAT: payload.examFormat,
        EXAM_FEE: Number(payload.fee),
        EXAM_DATE: buddhistToGregorian(payload.examDate),
        EXAM_REG_START_DATE: buddhistToGregorian(payload.regStartDate),
        EXAM_REG_END_DATE: buddhistToGregorianPeriodEnd(payload.regEndDate),
        EXAM_PAY_START_DATE: buddhistToGregorian(payload.payStartDate),
        EXAM_PAY_END_DATE: buddhistToGregorianPeriodEnd(payload.payEndDate),
        EXAM_PUBLISHED: payload.isPublished,
        FUND_SOURCE_ID: payload.fundSourceId ? Number(payload.fundSourceId) : null,
        SRB_ID: Number(payload.srbId),
        EXAM_ROUND: payload.examRound,
        EXAM_FISCAL_YEAR: payload.examFiscalYear,
      },
      writeOpts,
    );

    // 2. Synchronize sessions ONLY if timeRanges are provided (not locked)
    if (payload.timeRanges && payload.timeRanges.length > 0) {
      // ต้องโหลดพร้อม LOCATION.SEATS เพื่อให้ blocked-seat / snapshot diff ถูกต้อง
      // (ถ้าไม่มี seats จะถือว่า blocked seats เปลี่ยนทุกครั้ง → rewrite ช้าจน timeout)
      step = 'fetch-exam-with-seats';
      const currentExam = await fetchExamWithSeats(payload.examId, writeOpts);
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
      if (deleteIds.length > 0) {
        step = 'delete-sessions';
        await Promise.all(deleteIds.map((id) => api.delete(`/exam-sessions/${id}`, writeOpts)));
      }

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
          const currentSession = currentSessionsById.get(existingId);
          const isSessionUnchanged =
            currentSession &&
            currentSession.LOCATION_ID === sessionPayload.LOCATION_ID &&
            (currentSession.SS_START_TIME || '').substring(0, 5) === sessionPayload.SS_START_TIME &&
            (currentSession.SS_END_TIME || '').substring(0, 5) === sessionPayload.SS_END_TIME &&
            Number(currentSession.SS_CAPACITY) === Number(sessionPayload.SS_CAPACITY);
          const blockedSeatPayload = buildBlockedSeatPayload(range.locations);
          const currentBlockedSeatPayload = buildBlockedSeatPayloadFromSession(currentSession);
          const writePromises: Promise<unknown>[] = [
            syncSessionLocations(
              existingId,
              currentSession?.SESSION_LOCATIONS,
              range.locations,
              writeOpts,
            ),
          ];

          if (!isSessionUnchanged) {
            writePromises.push(
              api.patch(`/exam-sessions/${existingId}`, sessionPayload, writeOpts),
            );
          }
          if (!blockedSeatPayloadMatches(currentBlockedSeatPayload, blockedSeatPayload)) {
            writePromises.push(replaceExamBlockedSeats(existingId, blockedSeatPayload, writeOpts));
          }

          await Promise.all([...writePromises]);
          return;
        }

        // Create new session
        const sessionResponse = await api.post<BackendExam['SESSIONS'][number]>(
          '/exam-sessions',
          {
            ...sessionPayload,
            EXAM_ID: Number(payload.examId),
            SS_SESSION_STATUS: SESSION_STATUS_OPEN,
          },
          writeOpts,
        );

        const blockedSeatPayload = buildBlockedSeatPayload(range.locations);
        await Promise.all([
          createSessionLocations(sessionResponse.data.SS_ID, range.locations, writeOpts),
          ...(blockedSeatPayload.length > 0
            ? [replaceExamBlockedSeats(sessionResponse.data.SS_ID, blockedSeatPayload, writeOpts)]
            : []),
        ]);
      });

      step = 'sync-sessions';
      await Promise.all(sessionPromises);
    }

    invalidateExamCache();
  } catch (error) {
    console.error(`Error updating exam round [${step}]:`, error);
    throw error;
  }
};

/** รายการการเปลี่ยนแปลงรอบสอบ (สำหรับแจ้งเตือนผู้เข้าสอบ) */
export interface ExamChangeItem {
  label: string;
  oldValue: string;
  newValue: string;
}

/**
 * แจ้งเตือนผู้เข้าสอบทุกคนในรอบสอบทางอีเมล เมื่อมีการแก้ไขรายละเอียดรอบสอบ
 * ฝั่ง backend จะตอบกลับทันทีและส่งอีเมลแบบเบื้องหลัง
 */
export const notifyExamChanges = async (
  examId: number,
  changes: ExamChangeItem[],
): Promise<void> => {
  await api.post(`/exam/${examId}/notify-changes`, { changes });
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

export const validateExamPasscode = async (sessionId: number, passcode: string): Promise<void> => {
  await api.post<{ valid: true }>('/exam-enrollments/validate-passcode', {
    SESSION_ID: sessionId,
    PASSCODE: passcode,
  });
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

export const fetchEnrollmentById = async (enrollmentId: number): Promise<ExamEnrollment> => {
  try {
    const response = await api.get<ExamEnrollment>(`/exam-enrollments/${enrollmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching enrollment ${enrollmentId}:`, error);
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
