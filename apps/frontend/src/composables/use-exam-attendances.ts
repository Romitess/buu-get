import { ref, computed, onBeforeUnmount } from 'vue';
import type { AttendanceTableRow, BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { ExamAttendStatus, EnrollmentStatus } from 'src/types/enrollment.types';
import type { BackendExam, BackendSession } from 'src/types/exam';
import { fetchRawEnrollmentsByExamId } from 'src/services/enrollment.service';
import { fetchExamById, isRequestCanceled } from 'src/services/exam.service';
import { formatExamInstanceLabel } from 'src/utils/exam-instance-label';

export function useExamAttendances() {
  const attendances = ref<AttendanceTableRow[]>([]);
  const exam = ref<BackendExam | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const selectedSessionId = ref<number | null>(null);
  /** null = ทุกห้องในรอบเวลาที่เลือก */
  const selectedSessionLocationId = ref<number | null>(null);
  let loadGeneration = 0;
  let abortController: AbortController | null = null;

  const getSessionTimeKey = (session: BackendSession): string =>
    `${session.SS_START_TIME || ''}-${session.SS_END_TIME || ''}`;

  const activeSessionIds = computed<Set<number>>(() => {
    const sessions = exam.value?.SESSIONS ?? [];
    const selectedSession = sessions.find((session) => session.SS_ID === selectedSessionId.value);
    if (!selectedSession) return new Set<number>();
    const activeKey = getSessionTimeKey(selectedSession);
    return new Set(
      sessions
        .filter((session) => getSessionTimeKey(session) === activeKey)
        .map((session) => session.SS_ID),
    );
  });

  const formatLocationLabel = (
    location?: BackendEnrollmentDetail['SESSION_LOCATION'] extends { LOCATION?: infer T }
      ? T | null
      : BackendSession['LOCATION'] | null,
  ): string => {
    if (!location) return '-';
    return `${location.LOCATION_NAME}${location.LOCATION_ROOM_NO ? ` (${location.LOCATION_ROOM_NO})` : ''}`;
  };

  const getAttendanceIdKey = (row: AttendanceTableRow): string =>
    (row.testTakerCode || row.nationalId || '').trim();

  const compareAttendanceId = (left: AttendanceTableRow, right: AttendanceTableRow): number => {
    const leftKey = getAttendanceIdKey(left);
    const rightKey = getAttendanceIdKey(right);
    if (!leftKey && !rightKey) return 0;
    if (!leftKey) return 1;
    if (!rightKey) return -1;
    return leftKey.localeCompare(rightKey, 'th', { numeric: true, sensitivity: 'base' });
  };

  const isActiveAttendanceRow = (row: AttendanceTableRow): boolean =>
    row.paymentStatus !== EnrollmentStatus.CANCELLED &&
    row.paymentStatus !== EnrollmentStatus.UNPAID;

  const sessionScopedAttendances = computed((): AttendanceTableRow[] => {
    return attendances.value.filter((e) => isActiveAttendanceRow(e));
  });

  const filteredAttendances = computed((): AttendanceTableRow[] => {
    let list = sessionScopedAttendances.value;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter((row: AttendanceTableRow) => {
        let statusLabel = 'ขาด';
        if (row.attendanceStatus === ExamAttendStatus.INTIME) statusLabel = 'เข้าสอบแล้ว';

        return (
          row.nationalId.toLowerCase().includes(query) ||
          (row.testTakerCode && row.testTakerCode.toLowerCase().includes(query)) ||
          row.fullnameTh.toLowerCase().includes(query) ||
          row.titleTh.toLowerCase().includes(query) ||
          row.location.toLowerCase().includes(query) ||
          (row.seatNumber && row.seatNumber.toLowerCase().includes(query)) ||
          statusLabel.includes(query)
        );
      });
    }

    list = [...list].sort((left, right) => compareAttendanceId(left, right));

    return list.map((item, index) => ({
      ...item,
      index: index + 1,
    }));
  });

  const sessionTotalCount = computed((): number => sessionScopedAttendances.value.length);

  const sessionAttendedCount = computed((): number => {
    return sessionScopedAttendances.value.filter(
      (e) => e.hasRecord && e.attendanceStatus === ExamAttendStatus.INTIME,
    ).length;
  });

  const formatCheckInTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const mapEnrollmentToRow = (
    enrollment: BackendEnrollmentDetail,
    index: number,
  ): AttendanceTableRow => {
    const checkInTimeStr = enrollment.ERM_ATTEND_CHECK_IN_TIME ?? null;
    const status: ExamAttendStatus =
      Number(enrollment.ERM_STATUS) === Number(EnrollmentStatus.ATTENDED)
        ? ExamAttendStatus.INTIME
        : ExamAttendStatus.MISSING;
    const hasRecord = status === ExamAttendStatus.INTIME || checkInTimeStr != null;

    return {
      index: index + 1,
      ermId: enrollment.ERM_ID,
      nationalId:
        enrollment.USER?.USER_NATIONAL_ID?.trim() ||
        enrollment.USER?.USER_PASSPORT_NO?.trim() ||
        '-',
      location: formatLocationLabel(
        enrollment.SESSION_LOCATION?.LOCATION ?? enrollment.SESSION?.LOCATION ?? null,
      ),
      passportNo: enrollment.USER?.USER_PASSPORT_NO || null,
      titleTh: enrollment.USER?.PROFILE?.userTitleTh || '-',
      fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh || '-',
      titleEn: enrollment.USER?.PROFILE?.userTitleEn || '',
      fullnameEn: enrollment.USER?.PROFILE?.userFullnameEn || '',
      seatNumber: enrollment.ERM_SEAT_LABEL || '-',
      attendanceStatus: status,
      checkInTime: formatCheckInTime(checkInTimeStr),
      sessionId: enrollment.SESSION_ID,
      sessionLocationId: enrollment.SL_ID ?? null,
      hasRecord,
      slId: enrollment.SL_ID,
      lsId: enrollment.LS_ID,
      profileImage:
        enrollment.USER?.IMAGE?.USER_IMAGE_URL || enrollment.USER?.PROFILE?.userImagePath || null,
      testSession:
        formatExamInstanceLabel(
          enrollment.SESSION?.EXAM?.EXAM_ROUND,
          enrollment.SESSION?.EXAM?.EXAM_FISCAL_YEAR,
        ) || '-',
      voucherNo: enrollment.VOUCHERS?.[0]?.VC_CODE || '-',
      examType: enrollment.SESSION?.EXAM?.EXAM_TYPE || '-',
      testTakerCode: enrollment.ERM_TEST_TAKER || null,
      paymentStatus: enrollment.ERM_STATUS,
    };
  };

  /** โหลดเฉพาะข้อมูลสอบ (รอบเวลา / ห้อง) — ไม่ดึงรายชื่อ */
  const fetchExam = async (examId: number): Promise<void> => {
    abortController?.abort();
    abortController = new AbortController();
    const { signal } = abortController;
    const generation = ++loadGeneration;

    isLoading.value = true;
    error.value = null;
    attendances.value = [];

    try {
      const examData = await fetchExamById(examId, { signal }).catch((err) => {
        if (isRequestCanceled(err)) throw err;
        console.error('Failed to fetch exam details:', err);
        return null;
      });
      if (generation !== loadGeneration) return;

      exam.value = examData;

      if (!selectedSessionId.value && examData?.SESSIONS?.length) {
        selectedSessionId.value = examData.SESSIONS[0]?.SS_ID ?? null;
      }

      if (!examData) {
        error.value = 'ไม่พบข้อมูลการสอบหรือรายชื่อผู้สมัคร';
      }
    } catch (err) {
      if (isRequestCanceled(err) || generation !== loadGeneration) return;
      console.error('Critical error in fetchExam:', err);
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      if (generation === loadGeneration) {
        isLoading.value = false;
      }
    }
  };

  /** ดึงรายชื่อตามห้องที่เลือก — null = ทุกห้องในรอบเวลา */
  const fetchAttendances = async (examId: number): Promise<void> => {
    abortController?.abort();
    abortController = new AbortController();
    const { signal } = abortController;
    const generation = ++loadGeneration;

    isLoading.value = true;
    error.value = null;

    try {
      const locationId = selectedSessionLocationId.value;
      const enrollmentData = await fetchRawEnrollmentsByExamId(examId, {
        sessionId: selectedSessionId.value,
        ...(locationId != null && locationId > 0 ? { sessionLocationId: locationId } : {}),
        signal,
      }).catch((err) => {
        if (isRequestCanceled(err)) throw err;
        console.error('Failed to fetch raw enrollments:', err);
        return [] as BackendEnrollmentDetail[];
      });
      if (generation !== loadGeneration) return;

      attendances.value = enrollmentData.map((enrollment, index) =>
        mapEnrollmentToRow(enrollment, index),
      );
    } catch (err) {
      if (isRequestCanceled(err) || generation !== loadGeneration) return;
      console.error('Critical error in fetchAttendances:', err);
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      attendances.value = [];
    } finally {
      if (generation === loadGeneration) {
        isLoading.value = false;
      }
    }
  };

  const clearAttendances = (): void => {
    attendances.value = [];
  };

  onBeforeUnmount(() => {
    abortController?.abort();
    loadGeneration += 1;
    isLoading.value = false;
  });

  return {
    attendances,
    exam,
    isLoading,
    error,
    searchQuery,
    selectedSessionId,
    selectedSessionLocationId,
    activeSessionIds,
    filteredAttendances,
    sessionTotalCount,
    sessionAttendedCount,
    fetchExam,
    fetchAttendances,
    clearAttendances,
  };
}
