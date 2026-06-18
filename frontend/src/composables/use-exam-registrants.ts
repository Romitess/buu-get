import { ref, computed } from 'vue';
import type { EnrollmentTableRow } from 'src/types/enrollment.types';
import {
  PAYMENT_STATUS_LABELS,
  VERIFY_STATUS_LABELS,
  EnrollmentStatus,
} from 'src/types/enrollment.types';
import type { BackendExam, BackendSession } from 'src/types/exam';
import { fetchEnrollmentsByExamId } from 'src/services/enrollment.service';
import { fetchExamById } from 'src/services/exam.service';

export function useExamRegistrants() {
  const CANCELLED_STATUS: number = EnrollmentStatus.CANCELLED;
  const enrollments = ref<EnrollmentTableRow[]>([]);
  const exam = ref<BackendExam | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const selectedSessionId = ref<number | null>(null);
  const selectedSessionLocationId = ref<number | null>(null);

  const getSessionTimeKey = (session: BackendSession): string => {
    return `${session.SS_START_TIME || ''}-${session.SS_END_TIME || ''}`;
  };

  const sessionTimeTabs = computed<BackendSession[]>(() => {
    const seen = new Set<string>();
    return (exam.value?.SESSIONS ?? []).filter((session) => {
      const key = getSessionTimeKey(session);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  const activeSessionIds = computed<Set<number>>(() => {
    if (!selectedSessionId.value) return new Set<number>();
    const sessions = exam.value?.SESSIONS ?? [];
    const selectedSession = sessions.find((session) => session.SS_ID === selectedSessionId.value);
    if (!selectedSession) return new Set<number>([selectedSessionId.value]);
    const activeKey = getSessionTimeKey(selectedSession);
    return new Set(
      sessions
        .filter((session) => getSessionTimeKey(session) === activeKey)
        .map((session) => session.SS_ID),
    );
  });

  const sessionLocations = computed(() => {
    const sessions = exam.value?.SESSIONS ?? [];
    return sessions
      .filter((session) => activeSessionIds.value.has(session.SS_ID))
      .flatMap((session) => session.SESSION_LOCATIONS ?? []);
  });

  const roomOptions = computed(() =>
    sessionLocations.value
      .filter((item) => item.LOCATION)
      .map((item) => ({
        value: item.SL_ID,
        label: `${item.LOCATION.LOCATION_NAME}${
          item.LOCATION.LOCATION_ROOM_NO ? ` (${item.LOCATION.LOCATION_ROOM_NO})` : ''
        }`,
      })),
  );

  const filteredEnrollments = computed((): EnrollmentTableRow[] => {
    // Filter out cancelled enrollments
    let list = enrollments.value.filter((e) => e.paymentStatus !== CANCELLED_STATUS);

    if (selectedSessionId.value) {
      list = list.filter((e) => activeSessionIds.value.has(e.sessionId));
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter((row: EnrollmentTableRow) => {
        const paymentLabel = (PAYMENT_STATUS_LABELS[row.paymentStatus] || '').toLowerCase();
        const verifyLabel = (VERIFY_STATUS_LABELS[row.verifyStatus] || '').toLowerCase();
        const remarkLabel = (row.remark || '').toLowerCase();

        return (
          row.nationalId.toLowerCase().includes(query) ||
          row.fullnameTh.toLowerCase().includes(query) ||
          row.titleTh.toLowerCase().includes(query) ||
          paymentLabel.includes(query) ||
          verifyLabel.includes(query) ||
          remarkLabel.includes(query)
        );
      });
    }

    // Re-index sequentially for clean UI presentation
    return list.map((item, index) => ({
      ...item,
      index: index + 1,
    }));
  });

  const sessionTotalCount = computed((): number => {
    const activeEnrollments = enrollments.value.filter((e) => e.paymentStatus !== CANCELLED_STATUS);
    if (!selectedSessionId.value) return activeEnrollments.length;
    return activeEnrollments.filter(
      (e) =>
        activeSessionIds.value.has(e.sessionId) &&
        (selectedSessionLocationId.value === null ||
          e.sessionLocationId === selectedSessionLocationId.value),
    ).length;
  });

  const sessionPaidCount = computed((): number => {
    const list = selectedSessionId.value
      ? enrollments.value.filter((e) => activeSessionIds.value.has(e.sessionId))
      : enrollments.value;
    return list.filter(
      (e) =>
        e.paymentStatus >= 1 &&
        e.paymentStatus !== CANCELLED_STATUS &&
        (selectedSessionLocationId.value === null ||
          e.sessionLocationId === selectedSessionLocationId.value),
    ).length;
  });

  const fetchEnrollments = async (examId: number): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const enrollmentTask = fetchEnrollmentsByExamId(examId).catch((err) => {
        console.error('Failed to fetch enrollments:', err);
        return [];
      });
      const examTask = fetchExamById(examId).catch((err) => {
        console.error('Failed to fetch exam details:', err);
        return null;
      });

      const [enrollmentData, examData] = await Promise.all([enrollmentTask, examTask]);

      enrollments.value = enrollmentData;
      exam.value = examData;

      if (enrollmentData.length === 0 && !examData) {
        error.value = 'ไม่พบข้อมูลการสอบหรือรายชื่อผู้สมัคร';
      }
    } catch (err) {
      console.error('Critical error in fetchEnrollments:', err);
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    enrollments,
    exam,
    isLoading,
    error,
    searchQuery,
    selectedSessionId,
    selectedSessionLocationId,
    sessionTimeTabs,
    roomOptions,
    filteredEnrollments,
    sessionTotalCount,
    sessionPaidCount,
    fetchEnrollments,
  };
}
