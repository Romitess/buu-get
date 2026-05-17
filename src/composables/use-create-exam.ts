import { ref, computed, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useExamStore } from 'src/stores/exam.store';
import {
  BUDDHIST_YEAR_OFFSET,
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  EXAM_FORMAT_COMPUTER,
  MAX_EXAM_SESSIONS,
  MIN_EXAM_SESSIONS,
  NOTIFY_MSG,
} from 'src/constants/exam';
import type { CreateExamPayload, ExamLocationOption, FundSource } from 'src/services/exam.service';
import {
  fetchExamLocations,
  fetchFundSources,
  fetchExamById,
  updateExamRound,
  formatTime,
  buddhistToGregorian,
} from 'src/services/exam.service';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  /** Session ID from backend (only exists for existing sessions) */
  sessionId?: number;
  /** Number of enrolled candidates in this session */
  enrollmentCount?: number;
}

export interface CreateExamForm {
  examName: string;
  locationId: number | null;
  examType: string;
  fundSourceId: number | null;
  fee: string | number;
  seats: number;
  isPublished: boolean;
  examDate: string;
  timeSlots: TimeSlot[];
  regStartDate: string;
  regEndDate: string;
  payStartDate: string;
  payEndDate: string;
}

/** Options for the composable to support both Create and Edit modes */
export interface UseExamFormOptions {
  /** If provided, the composable will operate in Edit Mode */
  examId?: number | undefined;
}

/**
 * Composable for managing exam creation/editing logic.
 * @param externalForm - Optional external form ref (useful for injecting initial data or v-model syncing)
 * @param options - Options to configure mode (create vs edit)
 */
export function useCreateExam(externalForm?: Ref<CreateExamForm>, options?: UseExamFormOptions) {
  const router = useRouter();
  const $q = useQuasar();
  const examStore = useExamStore();

  const examId = options?.examId;
  const isEditMode = computed(() => !!examId);

  const wasOriginallyPublished = ref(false);

  /** Whether the schedule section should be locked (published exam or has enrollments) */
  const isScheduleLocked = computed(() => {
    if (!isEditMode.value) return false;
    const hasEnrollments = form.value.timeSlots.some((slot) => (slot.enrollmentCount || 0) > 0);
    // Lock permanently if it was originally published, is currently published, or has enrollments
    return wasOriginallyPublished.value || form.value.isPublished || hasEnrollments;
  });

  /** Checks if the schedule is locked specifically due to existing enrollments */
  const isLockedByEnrollment = computed(() => {
    return form.value.timeSlots.some((slot) => (slot.enrollmentCount || 0) > 0);
  });

  const today = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${d}/${m}/${y}`;
  })();

  const examTypeOptions: string[] = [EXAM_TYPE_GENERAL, EXAM_TYPE_SPECIAL];
  const locationOptions = ref<ExamLocationOption[]>([]);
  const fundSourceOptions = ref<{ label: string; value: number }[]>([]);
  const isLoadingData = ref(false);

  // Use external form if provided, otherwise create a new one
  const form =
    externalForm ||
    ref<CreateExamForm>({
      examName: '',
      locationId: null,
      examType: EXAM_TYPE_GENERAL,
      fundSourceId: null,
      fee: '0.00',
      seats: 1,
      isPublished: true,
      examDate: today,
      timeSlots: [
        { startTime: '08 : 00', endTime: '10 : 00' },
        { startTime: '10 : 00', endTime: '12 : 00' },
      ],
      regStartDate: today,
      regEndDate: today,
      payStartDate: today,
      payEndDate: today,
    });

  /**
   * Converts a backend date (YYYY-MM-DD or ISO) to DD/MM/YYYY Buddhist Era.
   */
  const gregorianToBuddhistDisplay = (dateStr: string | null | undefined): string => {
    if (!dateStr) return today;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return today;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${d}/${m}/${y}`;
  };

  const loadInitialData = async () => {
    isLoadingData.value = true;
    try {
      const [locations, fundSources] = await Promise.all([
        fetchExamLocations(),
        fetchFundSources(),
      ]);
      locationOptions.value = locations;
      fundSourceOptions.value = fundSources.map((fs: FundSource) => ({
        label: `${fs.FS_NAME} (${fs.FS_ACCOUNT_CODE})`,
        value: fs.FS_ID,
      }));

      // If in edit mode, load the existing exam data into the form
      if (examId) {
        const exam = await fetchExamById(examId);

        form.value.examName = exam.EXAM_NAME || '';
        form.value.examType = exam.EXAM_TYPE || EXAM_TYPE_GENERAL;
        form.value.fee = exam.EXAM_FEE ?? '0.00';
        form.value.isPublished = exam.EXAM_PUBLISHED ?? false;
        wasOriginallyPublished.value = exam.EXAM_PUBLISHED ?? false;
        form.value.examDate = gregorianToBuddhistDisplay(exam.EXAM_DATE);
        form.value.regStartDate = gregorianToBuddhistDisplay(exam.EXAM_REG_START_DATE);
        form.value.regEndDate = gregorianToBuddhistDisplay(exam.EXAM_REG_END_DATE);
        form.value.payStartDate = gregorianToBuddhistDisplay(exam.EXAM_PAY_START_DATE);
        form.value.payEndDate = gregorianToBuddhistDisplay(exam.EXAM_PAY_END_DATE);
        form.value.fundSourceId = exam.FUND_SOURCE_ID ?? null;

        // Load location from the first session
        const firstSession = exam.SESSIONS?.[0];
        if (firstSession) {
          form.value.locationId = firstSession.LOCATION_ID ?? null;
          form.value.seats = firstSession.SS_CAPACITY ?? 1;
        }

        // Load time slots from sessions
        if (exam.SESSIONS && exam.SESSIONS.length > 0) {
          form.value.timeSlots = exam.SESSIONS.map((session) => ({
            startTime: session.SS_START_TIME ? session.SS_START_TIME.substring(0, 5) : '',
            endTime: session.SS_END_TIME ? session.SS_END_TIME.substring(0, 5) : '',
            sessionId: session.SS_ID,
            enrollmentCount: session.ENROLLMENTS?.length || 0,
          }));
        }

        // The schedule lock is now handled by the computed property 'isScheduleLocked'
        // based on exam.EXAM_PUBLISHED and session enrollment counts.
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      $q.notify({
        type: 'negative',
        message: NOTIFY_MSG.LOAD_ERROR,
        position: 'top',
      });
    } finally {
      isLoadingData.value = false;
    }
  };

  const addTimeSlot = () => {
    if (isScheduleLocked.value) return;
    if (form.value.timeSlots.length < MAX_EXAM_SESSIONS) {
      form.value.timeSlots.push({
        startTime: '',
        endTime: '',
      });
    } else {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.MAX_SESSIONS(MAX_EXAM_SESSIONS),
        position: 'top',
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    if (isScheduleLocked.value) return;
    if (form.value.timeSlots.length > MIN_EXAM_SESSIONS) {
      form.value.timeSlots.splice(index, 1);
    } else {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.MIN_SESSIONS(MIN_EXAM_SESSIONS),
        position: 'top',
      });
    }
  };

  const handleCancel = () => {
    void router.push('/admin/exam-management');
  };

  /**
   * Saves the exam round (create or update depending on mode).
   * @returns Promise<boolean> - true if saved successfully, false otherwise
   */
  const handleSave = async (): Promise<boolean> => {
    const timeRanges = form.value.timeSlots
      .filter((slot) => slot.startTime && slot.endTime)
      .map((slot) => ({
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
      }));

    if (timeRanges.length === 0) {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.PROVIDE_TIME,
        position: 'top',
      });
      return false;
    }

    if (!form.value.locationId || form.value.locationId === null) {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.SELECT_LOCATION,
        position: 'top',
      });
      return false;
    }

    if (!form.value.fundSourceId) {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.SELECT_FUND,
        position: 'top',
      });
      return false;
    }

    // === BUSINESS RULE VALIDATION: Strictly 1 Exam Per Day ===
    const targetDateGregorian = buddhistToGregorian(form.value.examDate);

    // Make sure we have the latest schedules to check against
    await examStore.loadManagementSchedules();

    const hasConflict = examStore.managementSchedules.some((exam) => {
      // Skip checking against itself if in edit mode
      if (isEditMode.value && String(exam.id) === String(examId)) return false;

      // Match date - ANY exam on the same date is a conflict!
      return exam.examDate === targetDateGregorian;
    });

    if (hasConflict) {
      $q.notify({
        type: 'negative',
        message: NOTIFY_MSG.CONFLICT_DATE(form.value.examDate),
        position: 'top',
        timeout: 5000,
        actions: [{ icon: 'close', color: 'white' }],
      });
      return false;
    }

    try {
      if (isEditMode.value && examId) {
        // === EDIT MODE ===
        const existingSessionIds = form.value.timeSlots
          .filter((slot) => slot.sessionId)
          .map((slot) => slot.sessionId as number);

        await updateExamRound({
          examId,
          examName: form.value.examName,
          locationId: Number(form.value.locationId),
          examType: form.value.examType,
          examFormat: EXAM_FORMAT_COMPUTER,
          fee: Number(form.value.fee),
          seats: Number(form.value.seats),
          isPublished: form.value.isPublished,
          examDate: form.value.examDate,
          regStartDate: form.value.regStartDate,
          regEndDate: form.value.regEndDate,
          payStartDate: form.value.payStartDate,
          payEndDate: form.value.payEndDate,
          timeRanges,
          fundSourceId: Number(form.value.fundSourceId),
          existingSessionIds,
        });

        // Refresh the management schedules in the store after successful edit
        await examStore.loadManagementSchedules();

        $q.notify({
          type: 'positive',
          message: NOTIFY_MSG.UPDATE_SUCCESS,
          position: 'top',
          timeout: 2000,
        });
      } else {
        // === CREATE MODE ===
        const payload: CreateExamPayload = {
          examName: form.value.examName,
          locationId: form.value.locationId,
          examType: form.value.examType,
          examFormat: EXAM_FORMAT_COMPUTER,
          fee: form.value.fee,
          seats: form.value.seats,
          isPublished: form.value.isPublished,
          examDate: form.value.examDate,
          regStartDate: form.value.regStartDate,
          regEndDate: form.value.regEndDate,
          payStartDate: form.value.payStartDate,
          payEndDate: form.value.payEndDate,
          timeRanges,
          fundSourceId: form.value.fundSourceId,
        };

        await examStore.addExamRound(payload);
        // Refresh the management schedules in the store after successful creation
        await examStore.loadManagementSchedules();

        $q.notify({
          type: 'positive',
          message: NOTIFY_MSG.CREATE_SUCCESS,
          position: 'top',
          timeout: 2000,
        });
      }

      void router.push('/admin/exam-management');
      return true;
    } catch (error) {
      console.error('Save error:', error);
      $q.notify({
        type: 'negative',
        message: isEditMode.value ? NOTIFY_MSG.UPDATE_ERROR : NOTIFY_MSG.CREATE_ERROR,
        position: 'top',
      });
      return false;
    }
  };

  return {
    form,
    examTypeOptions,
    locationOptions,
    fundSourceOptions,
    isLoadingData,
    isEditMode,
    isScheduleLocked,
    isLockedByEnrollment,
    wasOriginallyPublished,
    loadInitialData,
    addTimeSlot,
    removeTimeSlot,
    handleCancel,
    handleSave,
  };
}
