import { useRouter } from 'vue-router';
import { fetchExamById } from 'src/services/exam.service';
import type { BackendExam } from 'src/types/exam';

const SESSION_STATUS_SEAT_ALLOCATED = 2;

export function useExamSeatNavigation() {
  const router = useRouter();

  const isSeatAllocationLocked = (exam: BackendExam): boolean => {
    return (exam.SESSIONS || []).some(
      (session) => Number(session.SS_SESSION_STATUS) >= SESSION_STATUS_SEAT_ALLOCATED,
    );
  };

  const navigateFromSeatAction = async (examId: number | string): Promise<void> => {
    const numericExamId = Number(examId);
    const exam = await fetchExamById(numericExamId);
    const isAllocated = isSeatAllocationLocked(exam);

    await router.push({
      name: isAllocated ? 'admin-exam-seat-candidates' : 'admin-exam-seat-management',
      params: { examId: String(examId) },
    });
  };

  return {
    isSeatAllocationLocked,
    navigateFromSeatAction,
  };
}
