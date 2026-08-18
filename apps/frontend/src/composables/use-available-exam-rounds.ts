import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchAllExamsRaw } from 'src/services/exam.service';
import {
  DEFAULT_EXAM_TITLE,
  DEFAULT_LOCATION_TEXT,
  EXAM_STATUS_PUBLISHED,
  formatLocationWithRoom,
} from 'src/constants/exam';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import { isActiveEnrollmentStatus } from 'src/utils/is-active-enrollment-status';
import type { BackendExam } from 'src/types/exam';
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

type AvailableRoundsErrorCode = 'noData' | 'fetch';

const mapPublishedSchedule = (exam: BackendExam): ExamSchedule => {
  let capacity = 0;
  let registeredCount = 0;
  let locationName = DEFAULT_LOCATION_TEXT;

  for (const session of exam.SESSIONS || []) {
    capacity += session.SS_CAPACITY || 0;
    const activeCount =
      typeof session.ACTIVE_ENROLLMENT_COUNT === 'number'
        ? session.ACTIVE_ENROLLMENT_COUNT
        : (session.ENROLLMENTS || []).filter((enrollment) =>
            isActiveEnrollmentStatus(enrollment.ERM_STATUS),
          ).length;
    registeredCount += activeCount;
  }

  const firstLoc = exam.SESSIONS?.[0]?.LOCATION;
  if (firstLoc) {
    locationName = formatLocationWithRoom(firstLoc.LOCATION_NAME, firstLoc.LOCATION_ROOM_NO);
  }

  return {
    id: String(exam.EXAM_ID),
    examName:
      formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
      DEFAULT_EXAM_TITLE,
    examType: 'general',
    examDate: exam.EXAM_DATE,
    regStartDate: exam.EXAM_REG_START_DATE,
    regEndDate: exam.EXAM_REG_END_DATE,
    examLocation: locationName,
    registeredCount,
    capacity,
    status: exam.EXAM_PUBLISHED === false ? 'unpublished' : EXAM_STATUS_PUBLISHED,
  };
};

export function useAvailableExamRounds() {
  const { t, locale } = useI18n();
  const isLoading = ref(false);
  const errorCode = ref<AvailableRoundsErrorCode | null>(null);
  const publishedSchedules = ref<ExamSchedule[]>([]);

  const error = computed((): string | null => {
    void locale.value;
    if (errorCode.value === 'noData') return t('home.availableRounds.noData');
    if (errorCode.value === 'fetch') return t('home.availableRounds.errorFetch');
    return null;
  });

  /**
   * Filter rounds with available seats & upcoming exam date, sort by nearest, limit to 4.
   * ใช้ public schedule (GET /exam/schedule) ไม่ใช่รายการแอดมิน
   */
  const filteredRounds = computed((): AvailableExamRound[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Filter and Sort raw schedules first to minimize mapping overhead
    const upcomingSchedules = publishedSchedules.value
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
    errorCode.value = null;
    try {
      const exams = await fetchAllExamsRaw(force);
      publishedSchedules.value = exams
        .filter((exam) => exam.EXAM_PUBLISHED === true)
        .map(mapPublishedSchedule);

      if (filteredRounds.value.length === 0) {
        errorCode.value = 'noData';
      }
    } catch (err) {
      console.error('Error fetching available exam rounds:', err);
      errorCode.value = 'fetch';
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
