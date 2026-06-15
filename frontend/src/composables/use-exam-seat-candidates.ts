import { ref, computed } from 'vue';
import type { BackendExam, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamById } from 'src/services/exam.service';
import { fetchRawEnrollmentsByExamId } from 'src/services/enrollment.service';

const SESSION_STATUS_VOUCHER_SENT = 3;

export interface SessionLocationOption {
  label: string;
  value: number;
}

interface SeatCandidateSessionLocation {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
  LOCATION: NonNullable<BackendSession['LOCATION']>;
}

/** Row shape for the seat-candidates table */
export interface SeatCandidateRow {
  index: number;
  ermId: number;
  nationalId: string;
  titleTh: string;
  fullnameTh: string;
  seatNumber: string;
  sessionId: number;
  enrollment: BackendEnrollmentDetail;
}

interface EnrollmentWithSeatOrder {
  enrollment: BackendEnrollmentDetail;
  seatOrder: number;
}

/**
 * Composable for the "รายชื่อและที่นั่งผู้เข้าสอบ" page.
 * Fetches exam + raw enrollments, then filters by session and search query.
 */
export function useExamSeatCandidates() {
  // State
  const exam = ref<BackendExam | null>(null);
  const allEnrollments = ref<BackendEnrollmentDetail[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const selectedSessionId = ref<number | null>(null);
  const selectedSessionLocationId = ref<number | null>(null);

  // Derived: sessions list from exam
  const sessions = computed((): BackendSession[] => exam.value?.SESSIONS ?? []);

  // Derived: active session object
  const activeSession = computed((): BackendSession | null => {
    return sessions.value.find((s) => s.SS_ID === selectedSessionId.value) ?? null;
  });

  const getSessionTimeKey = (session: BackendSession): string => {
    const start = String(session.SS_START_TIME || '').substring(0, 5);
    const end = String(session.SS_END_TIME || '').substring(0, 5);
    return `${start}-${end}`;
  };

  const sessionTimeTabs = computed<BackendSession[]>(() => {
    const seen = new Set<string>();
    return sessions.value.filter((session) => {
      const key = getSessionTimeKey(session);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  const activeTimeSessions = computed<BackendSession[]>(() => {
    if (!activeSession.value) return [];
    const activeKey = getSessionTimeKey(activeSession.value);
    return sessions.value.filter((session) => getSessionTimeKey(session) === activeKey);
  });

  const activeSessionIds = computed(() => activeTimeSessions.value.map((session) => session.SS_ID));

  const isVoucherSent = computed((): boolean => {
    return (
      activeTimeSessions.value.length > 0 &&
      activeTimeSessions.value.every(
        (session) => Number(session.SS_SESSION_STATUS) >= SESSION_STATUS_VOUCHER_SENT,
      )
    );
  });

  const sessionLocations = computed<SeatCandidateSessionLocation[]>(() => {
    return activeTimeSessions.value.flatMap((session) => {
      const relationLocations = session.SESSION_LOCATIONS || [];
      if (relationLocations.length > 0) {
        return relationLocations
          .filter((item) => item.LOCATION)
          .map((item) => ({ ...item, SS_ID: item.SS_ID || session.SS_ID }));
      }

      if (!session.LOCATION) return [];
      return [
        {
          SL_ID: -session.SS_ID,
          LOCATION_ID: session.LOCATION.LOCATION_ID,
          SS_ID: session.SS_ID,
          LOCATION: session.LOCATION,
        },
      ];
    });
  });

  const roomOptions = computed<SessionLocationOption[]>(() =>
    sessionLocations.value.map((item) => ({
      value: item.SL_ID,
      label: `${item.LOCATION.LOCATION_NAME}${item.LOCATION.LOCATION_ROOM_NO ? ` (${item.LOCATION.LOCATION_ROOM_NO})` : ''}`,
    })),
  );

  const effectiveSessionLocationId = computed<number | null>(() => {
    const selectedLocationExists = sessionLocations.value.some(
      (item) => item.SL_ID === selectedSessionLocationId.value,
    );

    if (selectedLocationExists) {
      return selectedSessionLocationId.value;
    }

    return sessionLocations.value[0]?.SL_ID ?? null;
  });

  const activeSessionLocation = computed(() => {
    return (
      sessionLocations.value.find((item) => item.SL_ID === effectiveSessionLocationId.value) ?? null
    );
  });

  const activeLocation = computed(() => {
    return activeSessionLocation.value?.LOCATION ?? activeSession.value?.LOCATION ?? null;
  });

  // Enrollments filtered to the active session that have a seat assignment (status SEAT_ASSIGNED = 2)
  const STATUS_SEAT_ASSIGNED = 2;
  const STATUS_CANCELLED = 5;

  const sessionEnrollments = computed((): BackendEnrollmentDetail[] => {
    if (activeSessionIds.value.length === 0) return [];

    return allEnrollments.value.filter((e) => {
      if (!activeSessionIds.value.includes(e.SESSION_ID)) return false;
      if (Number(e.ERM_STATUS) < STATUS_SEAT_ASSIGNED) return false;
      if (Number(e.ERM_STATUS) === STATUS_CANCELLED) return false;
      if (!e.LS_ID) return false;

      if (effectiveSessionLocationId.value === null) {
        return sessionLocations.value.length === 0;
      }

      if (e.SL_ID !== null && e.SL_ID !== undefined) {
        return e.SL_ID === effectiveSessionLocationId.value;
      }

      const seatLocation = sessionLocations.value.find((location) =>
        location.LOCATION.SEATS?.some((seat) => seat.LS_ID === e.LS_ID),
      );
      if (seatLocation) {
        return seatLocation.SL_ID === effectiveSessionLocationId.value;
      }

      const enrollmentSessionLocations = sessionLocations.value.filter(
        (location) => location.SS_ID === e.SESSION_ID,
      );
      return (
        enrollmentSessionLocations.length === 1 &&
        enrollmentSessionLocations[0]?.SL_ID === effectiveSessionLocationId.value
      );
    });
  });

  const getSeatLabel = (enrollment: BackendEnrollmentDetail): string => {
    const seat = activeLocation.value?.SEATS?.find((s) => s.LS_ID === enrollment.LS_ID);
    if (seat?.LS_SEAT_LABEL) {
      return seat.LS_SEAT_LABEL;
    }

    if (
      enrollment.LOCATION_SEAT?.LS_ID === enrollment.LS_ID &&
      enrollment.LOCATION_SEAT.LS_SEAT_LABEL
    ) {
      return enrollment.LOCATION_SEAT.LS_SEAT_LABEL;
    }

    return '-';
  };

  const getSeatOrder = (enrollment: BackendEnrollmentDetail): number => {
    const locationIndex = sessionLocations.value.findIndex((location) =>
      location.LOCATION.SEATS?.some((seat) => seat.LS_ID === enrollment.LS_ID),
    );
    const normalizedLocationIndex =
      locationIndex >= 0 ? locationIndex : Number.MAX_SAFE_INTEGER / 2;

    const seat =
      sessionLocations.value[locationIndex]?.LOCATION.SEATS?.find(
        (item) => item.LS_ID === enrollment.LS_ID,
      ) ??
      activeLocation.value?.SEATS?.find((item) => item.LS_ID === enrollment.LS_ID) ??
      null;

    if (seat) {
      return normalizedLocationIndex * 1_000_000 + seat.LS_ROW_NO * 1_000 + seat.LS_COL_NO;
    }

    const fallbackLabel = getSeatLabel(enrollment);
    const match = fallbackLabel.match(/^([A-Za-z]+)(\d+)$/);
    if (!match) return Number.MAX_SAFE_INTEGER;

    const [, letters, digits] = match;
    const rowOrder = (letters || '')
      .toUpperCase()
      .split('')
      .reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0);

    return normalizedLocationIndex * 1_000_000 + rowOrder * 1_000 + Number(digits);
  };

  // Map raw enrollment data to table rows
  const tableRows = computed((): SeatCandidateRow[] => {
    return sessionEnrollments.value
      .map(
        (enrollment): EnrollmentWithSeatOrder => ({
          enrollment,
          seatOrder: getSeatOrder(enrollment),
        }),
      )
      .sort((a, b) => {
        if (a.seatOrder !== b.seatOrder) return a.seatOrder - b.seatOrder;
        return a.enrollment.ERM_ID - b.enrollment.ERM_ID;
      })
      .map(
        ({ enrollment: e }, idx): SeatCandidateRow => ({
          index: idx + 1,
          ermId: e.ERM_ID,
          nationalId: e.ERM_TEST_TAKER || '-',
          titleTh: e.USER?.PROFILE?.userTitleTh || '-',
          fullnameTh: e.USER?.PROFILE?.userFullnameTh || '-',
          seatNumber: getSeatLabel(e),
          sessionId: e.SESSION_ID,
          enrollment: e,
        }),
      );
  });

  // Search-filtered rows
  const filteredRows = computed((): SeatCandidateRow[] => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return tableRows.value;
    return tableRows.value.filter(
      (row) =>
        row.nationalId.toLowerCase().includes(q) ||
        row.fullnameTh.toLowerCase().includes(q) ||
        row.titleTh.toLowerCase().includes(q) ||
        row.seatNumber.toLowerCase().includes(q),
    );
  });

  // Total candidates with seats in this session
  const candidateCount = computed((): number => sessionEnrollments.value.length);

  // Session helpers
  const sessionTime = computed((): string => {
    if (!activeSession.value) return '-';
    const start = (activeSession.value.SS_START_TIME || '').substring(0, 5);
    const end = (activeSession.value.SS_END_TIME || '').substring(0, 5);
    return `${start}-${end}`;
  });

  const sessionLocation = computed((): string => {
    if (!activeLocation.value) return '-';
    const loc = activeLocation.value;
    return `${loc.LOCATION_NAME}${loc.LOCATION_ROOM_NO ? ` (${loc.LOCATION_ROOM_NO})` : ''}`;
  });

  const sessionCapacity = computed((): number => activeLocation.value?.SEATS?.length ?? 0);

  const getTimeTabSessionId = (sessionId: number): number | null => {
    const session = sessions.value.find((item) => item.SS_ID === sessionId);
    if (!session) return null;

    const timeKey = getSessionTimeKey(session);
    return sessionTimeTabs.value.find((item) => getSessionTimeKey(item) === timeKey)?.SS_ID ?? null;
  };

  // Data fetching
  const fetchData = async (examId: number): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const [examData, enrollmentData] = await Promise.all([
        fetchExamById(examId).catch((err) => {
          console.error('Failed to fetch exam:', err);
          return null;
        }),
        fetchRawEnrollmentsByExamId(examId).catch((err) => {
          console.error('Failed to fetch enrollments:', err);
          return [];
        }),
      ]);

      exam.value = examData;
      allEnrollments.value = enrollmentData;

      // Auto-select first session
      if (examData?.SESSIONS?.length && !selectedSessionId.value) {
        const first = examData.SESSIONS[0];
        if (first) {
          selectedSessionId.value = first.SS_ID;
        }
      }

      if (!examData && enrollmentData.length === 0) {
        error.value = 'ไม่พบข้อมูลการสอบ';
      }
    } catch (err) {
      console.error('Critical error:', err);
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    exam,
    sessions,
    activeSession,
    sessionTimeTabs,
    selectedSessionLocationId,
    roomOptions,
    isLoading,
    error,
    searchQuery,
    selectedSessionId,
    filteredRows,
    candidateCount,
    sessionTime,
    sessionLocation,
    sessionCapacity,
    sessionEnrollments,
    activeSessionIds,
    isVoucherSent,
    getTimeTabSessionId,
    fetchData,
  };
}
