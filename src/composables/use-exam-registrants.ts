import { ref, computed } from 'vue';
import type { EnrollmentTableRow } from 'src/types/enrollment.types';
import {
  PAYMENT_STATUS_LABELS,
  VERIFY_STATUS_LABELS,
  EnrollmentStatus,
} from 'src/types/enrollment.types';
import type { BackendExam } from 'src/types/exam';
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

  const filteredEnrollments = computed((): EnrollmentTableRow[] => {
    // Filter out cancelled enrollments
    let list = enrollments.value.filter((e) => e.paymentStatus !== CANCELLED_STATUS);

    if (selectedSessionId.value) {
      list = list.filter((e) => e.sessionId === selectedSessionId.value);
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
    return activeEnrollments.filter((e) => e.sessionId === selectedSessionId.value).length;
  });

  const sessionPaidCount = computed((): number => {
    const list = selectedSessionId.value
      ? enrollments.value.filter((e) => e.sessionId === selectedSessionId.value)
      : enrollments.value;
    return list.filter((e) => e.paymentStatus >= 1 && e.paymentStatus !== CANCELLED_STATUS).length;
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
    filteredEnrollments,
    sessionTotalCount,
    sessionPaidCount,
    fetchEnrollments,
  };
}
