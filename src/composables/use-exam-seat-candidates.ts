import { ref, computed } from 'vue';
import type { BackendExam, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamById } from 'src/services/exam.service';
import { fetchRawEnrollmentsByExamId } from 'src/services/enrollment.service';

/** Row shape for the seat-candidates table */
export interface SeatCandidateRow {
  index: number;
  ermId: number;
  nationalId: string;
  titleTh: string;
  fullnameTh: string;
  seatNumber: string;
  sessionId: number;
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

  // Derived: sessions list from exam
  const sessions = computed((): BackendSession[] => exam.value?.SESSIONS ?? []);

  // Derived: active session object
  const activeSession = computed((): BackendSession | null => {
    return sessions.value.find((s) => s.SS_ID === selectedSessionId.value) ?? null;
  });

  // Enrollments filtered to the active session that have a seat assignment (status SEAT_ASSIGNED = 2)
  const STATUS_SEAT_ASSIGNED = 2;
  const STATUS_CANCELLED = 5;

  const sessionEnrollments = computed((): BackendEnrollmentDetail[] => {
    if (!selectedSessionId.value) return [];
    return allEnrollments.value.filter(
      (e) =>
        e.SESSION_ID === selectedSessionId.value &&
        Number(e.ERM_STATUS) >= STATUS_SEAT_ASSIGNED &&
        Number(e.ERM_STATUS) !== STATUS_CANCELLED &&
        e.LS_ID,
    );
  });

  const getSeatLabel = (enrollment: BackendEnrollmentDetail): string => {
    const seat = activeSession.value?.LOCATION?.SEATS?.find((s) => s.LS_ID === enrollment.LS_ID);
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

  // Map raw enrollment data to table rows
  const tableRows = computed((): SeatCandidateRow[] => {
    return sessionEnrollments.value.map(
      (e, idx): SeatCandidateRow => ({
        index: idx + 1,
        ermId: e.ERM_ID,
        nationalId: e.USER?.USER_NATIONAL_ID || '-',
        titleTh: e.USER?.PROFILE?.userTitleTh || '-',
        fullnameTh: e.USER?.PROFILE?.userFullnameTh || '-',
        seatNumber: getSeatLabel(e),
        sessionId: e.SESSION_ID,
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
    if (!activeSession.value?.LOCATION) return '-';
    const loc = activeSession.value.LOCATION;
    return `${loc.LOCATION_NAME}${loc.LOCATION_ROOM_NO ? ` (${loc.LOCATION_ROOM_NO})` : ''}`;
  });

  const sessionCapacity = computed((): number => activeSession.value?.SS_CAPACITY ?? 0);

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
    fetchData,
  };
}
