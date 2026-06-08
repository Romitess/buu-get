import { ref, computed } from 'vue';
import type { AttendanceTableRow, BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { ExamAttendStatus } from 'src/types/enrollment.types';
import type { BackendExam } from 'src/types/exam';
import { fetchRawEnrollmentsByExamId } from 'src/services/enrollment.service';
import { fetchExamById } from 'src/services/exam.service';

export function useExamAttendances() {
  const attendances = ref<AttendanceTableRow[]>([]);
  const exam = ref<BackendExam | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');
  const selectedSessionId = ref<number | null>(null);

  const filteredAttendances = computed((): AttendanceTableRow[] => {
    let list = attendances.value;

    if (selectedSessionId.value) {
      list = list.filter((e) => e.sessionId === selectedSessionId.value);
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter((row: AttendanceTableRow) => {
        let statusLabel = 'ขาด';
        if (row.attendanceStatus === ExamAttendStatus.INTIME) statusLabel = 'เข้าสอบแล้ว';
        else if (row.attendanceStatus === ExamAttendStatus.LATE) statusLabel = 'สาย';

        return (
          row.nationalId.toLowerCase().includes(query) ||
          row.fullnameTh.toLowerCase().includes(query) ||
          row.titleTh.toLowerCase().includes(query) ||
          (row.seatNumber && row.seatNumber.toLowerCase().includes(query)) ||
          statusLabel.includes(query)
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
    if (!selectedSessionId.value) return attendances.value.length;
    return attendances.value.filter((e) => e.sessionId === selectedSessionId.value).length;
  });

  const sessionAttendedCount = computed((): number => {
    const list = selectedSessionId.value
      ? attendances.value.filter((e) => e.sessionId === selectedSessionId.value)
      : attendances.value;
    return list.filter(
      (e) =>
        e.attendanceStatus === ExamAttendStatus.INTIME ||
        e.attendanceStatus === ExamAttendStatus.LATE,
    ).length;
  });

  const formatCheckInTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const fetchAttendances = async (examId: number): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const rawEnrollmentsTask = fetchRawEnrollmentsByExamId(examId).catch((err) => {
        console.error('Failed to fetch raw enrollments:', err);
        return [] as BackendEnrollmentDetail[];
      });
      const examTask = fetchExamById(examId).catch((err) => {
        console.error('Failed to fetch exam details:', err);
        return null;
      });

      const [enrollmentData, examData] = await Promise.all([rawEnrollmentsTask, examTask]);

      exam.value = examData;

      // Filter only enrollments that are at least PAID or SEAT_ASSIGNED?
      // Usually attendance is for people who have seats assigned (SEAT_ASSIGNED = 2, ATTENDED = 3)
      // Let's include all for now or those with seat number

      const mappedAttendances = enrollmentData.map(
        (enrollment: BackendEnrollmentDetail, index: number): AttendanceTableRow => {
          const attendanceRecord =
            enrollment.ATTENDANCES && enrollment.ATTENDANCES.length > 0
              ? enrollment.ATTENDANCES[0]
              : null;

          // Default status if no attendance record could be MISSING
          const status: ExamAttendStatus = attendanceRecord
            ? attendanceRecord.ATTEND_STATUS
            : ExamAttendStatus.MISSING;
          const checkInTime = attendanceRecord ? attendanceRecord.ATTEND_CHECK_IN_TIME : null;

          return {
            index: index + 1,
            ermId: enrollment.ERM_ID,
            nationalId: enrollment.USER?.USER_NATIONAL_ID || '-',
            titleTh: enrollment.USER?.PROFILE?.userTitleTh || '-',
            fullnameTh: enrollment.USER?.PROFILE?.userFullnameTh || '-',
            seatNumber: enrollment.LOCATION_SEAT?.LS_SEAT_LABEL || '-',
            attendanceStatus: status,
            checkInTime: formatCheckInTime(checkInTime),
            sessionId: enrollment.SESSION_ID,
          };
        },
      );

      // Recalculate index
      attendances.value = mappedAttendances.map((item, idx) => ({ ...item, index: idx + 1 }));

      if (enrollmentData.length === 0 && !examData) {
        error.value = 'ไม่พบข้อมูลการสอบหรือรายชื่อผู้สมัคร';
      }
    } catch (err) {
      console.error('Critical error in fetchAttendances:', err);
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    attendances,
    exam,
    isLoading,
    error,
    searchQuery,
    selectedSessionId,
    filteredAttendances,
    sessionTotalCount,
    sessionAttendedCount,
    fetchAttendances,
  };
}
