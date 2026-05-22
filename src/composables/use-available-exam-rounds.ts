import { ref, computed } from 'vue';
import type { ExamSchedule } from 'src/types/exam.types';
import { fetchExamSchedules } from 'src/services/exam.service';

export interface AvailableExamRound {
  id: string;
  roundNumber: string;
  examDate: string;
  regStartDate: string;
  regEndDate: string;
  examName: string;
  examLocation: string;
  availableSeats: number;
  totalSeats: number;
  registeredCount: number;
}

// Constants
const ERROR_FETCH_MESSAGE = 'เกิดข้อผิดพลาดในการดึงข้อมูล' as const;
const NO_DATA_MESSAGE = 'ไม่พบข้อมูลตารางสอบ' as const;
const MAX_DISPLAY_ROUNDS = 4 as const;

export function useAvailableExamRounds() {
  const rounds = ref<AvailableExamRound[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Filter rounds with available seats & upcoming exam date, sort by nearest, limit to 4
  const filteredRounds = computed((): AvailableExamRound[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rounds.value
      .filter((round) => {
        const examDate = new Date(round.examDate);
        return round.availableSeats > 0 && examDate >= today;
      })
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .slice(0, MAX_DISPLAY_ROUNDS);
  });

  const fetchAvailableRounds = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const schedules = await fetchExamSchedules();

      // Filter only published exams
      const publishedSchedules = schedules.filter(
        (schedule: ExamSchedule) => schedule.status === 'published',
      );

      // Map exam schedules to available rounds
      const mappedRounds: AvailableExamRound[] = publishedSchedules.map(
        (schedule: ExamSchedule, index: number): AvailableExamRound => ({
          id: schedule.id,
          roundNumber: `${index + 1}/${new Date(schedule.examDate).getFullYear() + 543}`,
          examDate: schedule.examDate,
          regStartDate: schedule.regStartDate ?? '',
          regEndDate: schedule.regEndDate ?? '',
          examName: schedule.examName,
          examLocation: schedule.examLocation,
          availableSeats: schedule.capacity - schedule.registeredCount,
          totalSeats: schedule.capacity,
          registeredCount: schedule.registeredCount,
        }),
      );

      rounds.value = mappedRounds;

      if (mappedRounds.length === 0) {
        error.value = NO_DATA_MESSAGE;
      }
    } catch (err) {
      console.error('Error fetching available exam rounds:', err);
      error.value = ERROR_FETCH_MESSAGE;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    rounds,
    filteredRounds,
    isLoading,
    error,
    fetchAvailableRounds,
  };
}
