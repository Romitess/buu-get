import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useExamStore } from 'src/stores/exam.store';
import type { ExamSchedule } from 'src/types/exam.types';

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
const MAX_DISPLAY_ROUNDS = 4 as const;

export function useAvailableExamRounds() {
  const store = useExamStore();
  const { t } = useI18n();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Filter rounds with available seats & upcoming exam date, sort by nearest, limit to 4.
   * Logic is performed on the managementSchedules from the store to leverage caching.
   */
  const filteredRounds = computed((): AvailableExamRound[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Filter and Sort raw schedules first to minimize mapping overhead
    const upcomingSchedules = store.managementSchedules
      .filter((s: ExamSchedule) => {
        const examDate = new Date(s.examDate);
        return s.status === 'published' && s.capacity - s.registeredCount > 0 && examDate >= today;
      })
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      .slice(0, MAX_DISPLAY_ROUNDS);

    // 2. Map only the limited subset to the final structure
    // roundNumber shows create-form exam name + round (already combined in schedule.examName)
    return upcomingSchedules.map(
      (schedule: ExamSchedule): AvailableExamRound => ({
        id: schedule.id,
        roundNumber: schedule.examName,
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
  });

  const fetchAvailableRounds = async (force = false): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      // Use store's management schedules which now has centralized caching
      await store.loadManagementSchedules(force);

      if (filteredRounds.value.length === 0) {
        error.value = t('home.availableRounds.noData');
      }
    } catch (err) {
      console.error('Error fetching available exam rounds:', err);
      error.value = t('home.availableRounds.errorFetch');
    } finally {
      isLoading.value = false;
    }
  };

  return {
    filteredRounds,
    isLoading,
    error,
    fetchAvailableRounds,
  };
}
