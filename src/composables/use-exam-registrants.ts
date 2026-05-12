import { ref, computed } from 'vue';
import type { EnrollmentTableRow } from 'src/types/enrollment.types';
import { fetchEnrollmentsByExamId } from 'src/services/enrollment.service';

/**
 * Composable for managing exam registrants data.
 * Used only in exam-registrants-page — no Pinia store needed (per CONTRIBUTING.md guidelines).
 */
export function useExamRegistrants() {
  // State
  const enrollments = ref<EnrollmentTableRow[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const searchQuery = ref('');

  // Computed
  const filteredEnrollments = computed((): EnrollmentTableRow[] => {
    if (!searchQuery.value) return enrollments.value;

    const query = searchQuery.value.toLowerCase();
    return enrollments.value.filter(
      (row: EnrollmentTableRow) =>
        row.nationalId.toLowerCase().includes(query) ||
        row.fullnameTh.toLowerCase().includes(query) ||
        row.titleTh.toLowerCase().includes(query),
    );
  });

  const totalCount = computed((): number => enrollments.value.length);

  const paidCount = computed((): number => {
    // ERM_STATUS >= 1 means PAID or higher (PAID, SEAT_ASSIGNED, ATTENDED)
    return enrollments.value.filter(
      (row: EnrollmentTableRow) => row.paymentStatus >= 1 && row.paymentStatus !== 4,
    ).length;
  });

  // Methods
  const fetchEnrollments = async (examId: number): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      enrollments.value = await fetchEnrollmentsByExamId(examId);
    } catch {
      error.value = 'เกิดข้อผิดพลาดในการโหลดข้อมูลผู้สมัครสอบ';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    enrollments,
    isLoading,
    error,
    searchQuery,
    filteredEnrollments,
    totalCount,
    paidCount,
    fetchEnrollments,
  };
}
