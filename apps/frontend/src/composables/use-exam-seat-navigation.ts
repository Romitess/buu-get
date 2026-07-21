import { useRouter } from 'vue-router';
import { fetchExamById } from 'src/services/exam.service';
import type { BackendExam, BackendSession } from 'src/types/exam';

const SESSION_STATUS_SEAT_ALLOCATED = 2;
const SESSION_STATUS_VOUCHER_SENT = 3;

export function useExamSeatNavigation() {
  const router = useRouter();

  const hasSeatAllocationConfirmed = (exam: BackendExam): boolean => {
    return (exam.SESSIONS || []).some(
      (session) => Number(session.SS_SESSION_STATUS) >= SESSION_STATUS_SEAT_ALLOCATED,
    );
  };

  const isSeatEditingLocked = (targetSessions: BackendSession[]): boolean => {
    return targetSessions.some(
      (session) => Number(session.SS_SESSION_STATUS) >= SESSION_STATUS_VOUCHER_SENT,
    );
  };

  const navigateFromSeatAction = async (examId: number | string): Promise<void> => {
    const exam = await fetchExamById(Number(examId));
    await router.push({
      name: hasSeatAllocationConfirmed(exam)
        ? 'admin-exam-seat-candidates'
        : 'admin-exam-seat-management',
      params: { examId: String(examId) },
    });
  };

  return {
    hasSeatAllocationConfirmed,
    isSeatEditingLocked,
    navigateFromSeatAction,
  };
}
