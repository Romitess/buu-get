import { ref, computed, onBeforeUnmount } from 'vue';
import type { BackendExam, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { EnrollmentStatus } from 'src/types/enrollment.types';
import { fetchExamById, isRequestCanceled } from 'src/services/exam.service';
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
  TOTAL_ROWS?: number | null;
  TOTAL_COLS?: number | null;
  AISLE_AFTER?: { after_cols: number[]; after_rows: number[] } | null;
  LOCATION_SEAT_DIRECTION?: 'HORIZONTAL' | 'VERTICAL';
  LOCATION_SEAT_CAPACITY?: number | null;
  SEATS_SNAPSHOT?:
    | {
        label: string | null;
        status: 'AVAILABLE' | 'BROKEN' | 'BLOCKED';
        sortorder: number | null;
      }[]
    | null;
  LOCATION: NonNullable<BackendSession['LOCATION']>;
}

/** Row shape for the seat-candidates table */
export interface SeatCandidateRow {
  index: number;
  ermId: number;
  nationalId: string;
  titleTh: string;
  fullnameTh: string;
  fullnameEn: string;
  seatNumber: string;
  roomLabel: string;
  sessionLocationId: number | null;
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
  let loadGeneration = 0;
  let abortController: AbortController | null = null;

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

  const formatLocationLabel = (location: NonNullable<BackendSession['LOCATION']>): string =>
    `${location.LOCATION_NAME}${location.LOCATION_ROOM_NO ? ` (${location.LOCATION_ROOM_NO})` : ''}`;

  const roomOptions = computed<SessionLocationOption[]>(() =>
    sessionLocations.value.map((item) => ({
      value: item.SL_ID,
      label: formatLocationLabel(item.LOCATION),
    })),
  );

  /** All rooms in the active time slot, joined for display (no room picker). */
  const sessionLocationsLabel = computed((): string => {
    const labels = roomOptions.value.map((option) => option.label);
    if (labels.length === 0) return '-';
    return labels.join(', ');
  });

  const getRoomCapacity = (item: SeatCandidateSessionLocation): number => {
    if (item.LOCATION_SEAT_CAPACITY != null) return item.LOCATION_SEAT_CAPACITY;
    if (item.SEATS_SNAPSHOT && item.SEATS_SNAPSHOT.length > 0) return item.SEATS_SNAPSHOT.length;
    return item.LOCATION.SEATS?.length ?? 0;
  };

  /** Sum of seat capacity across every room in the active time slot. */
  const timeSlotCapacity = computed((): number =>
    sessionLocations.value.reduce((sum, item) => sum + getRoomCapacity(item), 0),
  );

  const getEnrollmentRoomLabel = (enrollment: BackendEnrollmentDetail): string => {
    if (enrollment.SL_ID != null) {
      const matched = sessionLocations.value.find((item) => item.SL_ID === enrollment.SL_ID);
      if (matched) return formatLocationLabel(matched.LOCATION);
    }

    const sessionOnly = sessionLocations.value.filter(
      (location) => location.SS_ID === enrollment.SESSION_ID,
    );
    if (sessionOnly.length === 1 && sessionOnly[0]) {
      return formatLocationLabel(sessionOnly[0].LOCATION);
    }

    return 'ยังไม่จัดห้อง';
  };

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

  const activeSessionSeatSnapshot = computed(
    () => activeSessionLocation.value?.SEATS_SNAPSHOT ?? [],
  );

  // Eligible enrollments: paid / seat-assigned / seat-published (exclude unpaid & cancelled)
  const STATUS_PAID = Number(EnrollmentStatus.PAID);
  const STATUS_SEAT_PUBLISHED = Number(EnrollmentStatus.SEAT_PUBLISHED);

  const isEligibleEnrollment = (enrollment: BackendEnrollmentDetail): boolean => {
    const status = Number(enrollment.ERM_STATUS);
    return status >= STATUS_PAID && status <= STATUS_SEAT_PUBLISHED;
  };

  const hasAssignedSeat = (enrollment: BackendEnrollmentDetail): boolean =>
    Boolean(enrollment.ERM_SEAT_LABEL && enrollment.SL_ID != null);

  /** All eligible applicants in the active time slot (all rooms) */
  const timeSlotEligibleEnrollments = computed((): BackendEnrollmentDetail[] => {
    if (activeSessionIds.value.length === 0) return [];
    return allEnrollments.value.filter(
      (enrollment) =>
        activeSessionIds.value.includes(enrollment.SESSION_ID) && isEligibleEnrollment(enrollment),
    );
  });

  /**
   * True when every eligible applicant in the time slot already has a seat.
   * Used to enable the "ออกใบ Test Voucher" action.
   */
  const canIssueVoucher = computed((): boolean => {
    const enrollments = timeSlotEligibleEnrollments.value;
    return enrollments.length > 0 && enrollments.every((enrollment) => hasAssignedSeat(enrollment));
  });

  const belongsToSelectedRoom = (enrollment: BackendEnrollmentDetail): boolean => {
    if (effectiveSessionLocationId.value === null) {
      return sessionLocations.value.length === 0;
    }

    if (enrollment.SL_ID !== null && enrollment.SL_ID !== undefined) {
      return enrollment.SL_ID === effectiveSessionLocationId.value;
    }

    // Unassigned applicants (no seat / no room yet): keep them visible in every room
    // of the active time slot so admins can see who still needs a seat.
    if (!hasAssignedSeat(enrollment)) {
      return true;
    }

    const enrollmentSessionLocations = sessionLocations.value.filter(
      (location) => location.SS_ID === enrollment.SESSION_ID,
    );
    return (
      enrollmentSessionLocations.length === 1 &&
      enrollmentSessionLocations[0]?.SL_ID === effectiveSessionLocationId.value
    );
  };

  const sessionEnrollments = computed((): BackendEnrollmentDetail[] => {
    if (activeSessionIds.value.length === 0) return [];

    return allEnrollments.value.filter((enrollment) => {
      if (!activeSessionIds.value.includes(enrollment.SESSION_ID)) return false;
      if (!isEligibleEnrollment(enrollment)) return false;
      return belongsToSelectedRoom(enrollment);
    });
  });

  /** Seated applicants only — used when issuing vouchers for the whole time slot */
  const seatedTimeSlotEnrollments = computed((): BackendEnrollmentDetail[] =>
    timeSlotEligibleEnrollments.value.filter((enrollment) => hasAssignedSeat(enrollment)),
  );

  const getSeatLabel = (enrollment: BackendEnrollmentDetail): string => {
    return enrollment.ERM_SEAT_LABEL || '-';
  };

  const getSeatOrder = (enrollment: BackendEnrollmentDetail): number => {
    const locationIndex = sessionLocations.value.findIndex(
      (location) => location.SL_ID === enrollment.SL_ID,
    );
    const normalizedLocationIndex =
      locationIndex >= 0 ? locationIndex : Number.MAX_SAFE_INTEGER / 2;

    if (enrollment.ERM_SORT_ORDER !== null && enrollment.ERM_SORT_ORDER !== undefined) {
      return normalizedLocationIndex * 1_000_000 + enrollment.ERM_SORT_ORDER;
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

  // Map raw enrollment data to table rows — unassigned seats first, then seat order
  // Uses all rooms in the active time slot (not a single selected room).
  const tableRows = computed((): SeatCandidateRow[] => {
    return timeSlotEligibleEnrollments.value
      .map(
        (enrollment): EnrollmentWithSeatOrder => ({
          enrollment,
          seatOrder: getSeatOrder(enrollment),
        }),
      )
      .sort((a, b) => {
        const aHasSeat = hasAssignedSeat(a.enrollment);
        const bHasSeat = hasAssignedSeat(b.enrollment);
        if (aHasSeat !== bHasSeat) return aHasSeat ? 1 : -1;
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
          fullnameEn: e.USER?.PROFILE?.userFullnameEn || '-',
          seatNumber: getSeatLabel(e),
          roomLabel: getEnrollmentRoomLabel(e),
          sessionLocationId: e.SL_ID ?? null,
          sessionId: e.SESSION_ID,
          enrollment: e,
        }),
      );
  });

  /** Room-scoped rows (for print seat plan / single-room actions). */
  const roomTableRows = computed((): SeatCandidateRow[] => {
    return tableRows.value.filter((row) => {
      if (effectiveSessionLocationId.value === null) {
        return sessionLocations.value.length === 0;
      }
      return belongsToSelectedRoom(row.enrollment);
    });
  });

  // Search-filtered rows
  const filteredRows = computed((): SeatCandidateRow[] => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return tableRows.value;
    return tableRows.value.filter(
      (row) =>
        row.nationalId.toLowerCase().includes(q) ||
        row.fullnameTh.toLowerCase().includes(q) ||
        row.fullnameEn.toLowerCase().includes(q) ||
        row.titleTh.toLowerCase().includes(q) ||
        row.seatNumber.toLowerCase().includes(q) ||
        row.roomLabel.toLowerCase().includes(q),
    );
  });

  // Total candidates in the active time slot (all rooms)
  const candidateCount = computed((): number => timeSlotEligibleEnrollments.value.length);

  // Session helpers
  const sessionTime = computed((): string => {
    if (!activeSession.value) return '-';
    const start = (activeSession.value.SS_START_TIME || '').substring(0, 5);
    const end = (activeSession.value.SS_END_TIME || '').substring(0, 5);
    return `${start}-${end}`;
  });

  const sessionLocation = computed((): string => sessionLocationsLabel.value);

  const sessionCapacity = computed((): number => timeSlotCapacity.value);

  const getTimeTabSessionId = (sessionId: number): number | null => {
    const session = sessions.value.find((item) => item.SS_ID === sessionId);
    if (!session) return null;

    const timeKey = getSessionTimeKey(session);
    return sessionTimeTabs.value.find((item) => getSessionTimeKey(item) === timeKey)?.SS_ID ?? null;
  };

  // Data fetching
  const fetchData = async (examId: number): Promise<void> => {
    abortController?.abort();
    abortController = new AbortController();
    const { signal } = abortController;
    const generation = ++loadGeneration;

    isLoading.value = true;
    error.value = null;
    try {
      const examData = await fetchExamById(examId, { signal }).catch((err) => {
        if (isRequestCanceled(err)) throw err;
        console.error('Failed to fetch exam:', err);
        return null;
      });
      if (generation !== loadGeneration) return;
      exam.value = examData;

      if (examData?.SESSIONS?.length && !selectedSessionId.value) {
        const first = examData.SESSIONS[0];
        if (first) {
          selectedSessionId.value = first.SS_ID;
        }
      }

      const enrollmentData = await fetchRawEnrollmentsByExamId(examId, {
        sessionId: selectedSessionId.value,
        signal,
      }).catch((err) => {
        if (isRequestCanceled(err)) throw err;
        console.error('Failed to fetch enrollments:', err);
        return [];
      });
      if (generation !== loadGeneration) return;
      allEnrollments.value = enrollmentData;

      if (!examData && enrollmentData.length === 0) {
        error.value = 'ไม่พบข้อมูลการสอบ';
      }
    } catch (err) {
      if (isRequestCanceled(err) || generation !== loadGeneration) return;
      console.error('Critical error:', err);
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      if (generation === loadGeneration) {
        isLoading.value = false;
      }
    }
  };

  onBeforeUnmount(() => {
    abortController?.abort();
    loadGeneration += 1;
    isLoading.value = false;
  });

  const applyVoucherIssuedState = (sessionIds: number[], ermIds: number[]): void => {
    const ermIdSet = new Set(ermIds);
    const sessionIdSet = new Set(sessionIds);

    if (exam.value?.SESSIONS) {
      exam.value = {
        ...exam.value,
        SESSIONS: exam.value.SESSIONS.map((session) =>
          sessionIdSet.has(session.SS_ID)
            ? { ...session, SS_SESSION_STATUS: SESSION_STATUS_VOUCHER_SENT }
            : session,
        ),
      };
    }

    allEnrollments.value = allEnrollments.value.map((enrollment) =>
      ermIdSet.has(enrollment.ERM_ID)
        ? { ...enrollment, ERM_STATUS: EnrollmentStatus.SEAT_PUBLISHED }
        : enrollment,
    );
  };

  return {
    exam,
    sessions,
    activeSession,
    activeSessionLocation,
    activeSessionSeatSnapshot,
    activeLocation,
    sessionTimeTabs,
    selectedSessionLocationId,
    roomOptions,
    sessionLocationsLabel,
    isLoading,
    error,
    searchQuery,
    selectedSessionId,
    sessionLocations,
    tableRows,
    filteredRows,
    roomTableRows,
    candidateCount,
    sessionTime,
    sessionLocation,
    sessionCapacity,
    sessionEnrollments,
    seatedTimeSlotEnrollments,
    activeSessionIds,
    isVoucherSent,
    canIssueVoucher,
    getTimeTabSessionId,
    fetchData,
    applyVoucherIssuedState,
  };
}
