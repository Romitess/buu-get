import { ref, computed, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useExamStore } from 'src/stores/exam.store';
import {
  BUDDHIST_YEAR_OFFSET,
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  EXAM_FORMAT_COMPUTER,
  EXAM_FORMAT_PAPER,
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
import { getUsersFromApi } from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';

/** A single room within a time slot */
export interface ExamRoom {
  /** Location ID (dropdown) */
  locationId: number | null;
  /** Proctor name (dropdown) */
  proctorName: string;
  /** Number of seats */
  seats: number;
  /** Backend session ID (only for existing sessions in edit mode) */
  sessionId?: number;
  /** Enrollment count (for locking) */
  enrollmentCount?: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  /** Rooms within this time slot */
  rooms: ExamRoom[];
}

/** An eligible candidate for special rounds */
export interface EligibleCandidate {
  /** Row index (display only) */
  index?: number;
  /** National ID or student ID */
  nationalId: string;
  /** Full name */
  fullName: string;
  /** Generated passcode */
  passcode: string;
}

export interface CreateExamForm {
  examName: string;
  examType: string;
  examFormat: string;
  fundSourceId: number | null;
  fee: string | number;
  isPublished: boolean;
  examDate: string;
  timeSlots: TimeSlot[];
  regStartDate: string;
  regEndDate: string;
  payStartDate: string;
  payEndDate: string;
  /** Eligible candidates for special rounds */
  eligibleCandidates: EligibleCandidate[];
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
    const hasEnrollments = form.value.timeSlots.some((slot) =>
      slot.rooms.some((room) => (room.enrollmentCount || 0) > 0),
    );
    // Lock permanently if it was originally published, is currently published, or has enrollments
    return wasOriginallyPublished.value || form.value.isPublished || hasEnrollments;
  });

  /** Checks if the schedule is locked specifically due to existing enrollments */
  const isLockedByEnrollment = computed(() => {
    return form.value.timeSlots.some((slot) =>
      slot.rooms.some((room) => (room.enrollmentCount || 0) > 0),
    );
  });

  const today = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${d}/${m}/${y}`;
  })();

  const examTypeOptions: string[] = [EXAM_TYPE_GENERAL, EXAM_TYPE_SPECIAL];
  const examFormatOptions: string[] = [EXAM_FORMAT_COMPUTER, EXAM_FORMAT_PAPER];
  const proctorOptions = ref<{ label: string; value: string }[]>([]);
  const locationOptions = ref<ExamLocationOption[]>([]);
  const fundSourceOptions = ref<{ label: string; value: number }[]>([]);
  const isLoadingData = ref(false);
  const error = ref<string | null>(null);

  /** Currently active time slot tab index */
  const activeSlotIndex = ref(0);

  /** Search query for eligible candidates table */
  const candidateSearch = ref('');

  // Use external form if provided, otherwise create a new one
  const form =
    externalForm ||
    ref<CreateExamForm>({
      examName: '',
      examType: EXAM_TYPE_GENERAL,
      examFormat: EXAM_FORMAT_COMPUTER,
      fundSourceId: null,
      fee: '0.00',
      isPublished: true,
      examDate: today,
      timeSlots: [
        {
          startTime: '08 : 00',
          endTime: '10 : 00',
          rooms: [{ locationId: null, proctorName: '', seats: 40 }],
        },
      ],
      regStartDate: today,
      regEndDate: today,
      payStartDate: today,
      payEndDate: today,
      eligibleCandidates: [],
    });

  /** Whether the current exam type is special */
  const isSpecialRound = computed<boolean>(() => form.value.examType === EXAM_TYPE_SPECIAL);

  /** Filtered candidates based on search query */
  const filteredCandidates = computed<EligibleCandidate[]>(() => {
    const q = candidateSearch.value.trim().toLowerCase();
    if (!q) return form.value.eligibleCandidates;
    return form.value.eligibleCandidates.filter(
      (c) =>
        c.nationalId.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.passcode.toLowerCase().includes(q),
    );
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

  const loadInitialData = async (): Promise<void> => {
    isLoadingData.value = true;
    error.value = null;
    try {
      const [locations, fundSources, proctors] = await Promise.all([
        fetchExamLocations(),
        fetchFundSources(),
        getUsersFromApi(ROLES.PROCTOR),
      ]);
      locationOptions.value = locations;
      fundSourceOptions.value = fundSources.map((fs: FundSource) => ({
        label: `${fs.FS_NAME} (${fs.FS_ACCOUNT_CODE})`,
        value: fs.FS_ID,
      }));
      proctorOptions.value = proctors.map((u) => {
        const displayName = u.fullNameTH ? `${u.titleTH || ''} ${u.fullNameTH}`.trim() : u.email;
        return {
          label: displayName || 'ไม่ระบุชื่อ',
          value: u.email || '',
        };
      });

      // If in edit mode, load the existing exam data into the form
      if (examId) {
        const exam = await fetchExamById(examId);

        form.value.examName = exam.EXAM_NAME || '';
        form.value.examType = exam.EXAM_TYPE || EXAM_TYPE_GENERAL;
        form.value.examFormat = exam.EXAM_FORMAT || EXAM_FORMAT_COMPUTER;
        form.value.fee = exam.EXAM_FEE ?? '0.00';
        form.value.isPublished = exam.EXAM_PUBLISHED ?? false;
        wasOriginallyPublished.value = exam.EXAM_PUBLISHED ?? false;
        form.value.examDate = gregorianToBuddhistDisplay(exam.EXAM_DATE);
        form.value.regStartDate = gregorianToBuddhistDisplay(exam.EXAM_REG_START_DATE);
        form.value.regEndDate = gregorianToBuddhistDisplay(exam.EXAM_REG_END_DATE);
        form.value.payStartDate = gregorianToBuddhistDisplay(exam.EXAM_PAY_START_DATE);
        form.value.payEndDate = gregorianToBuddhistDisplay(exam.EXAM_PAY_END_DATE);
        form.value.fundSourceId = exam.FUND_SOURCE_ID ?? null;

        // Group sessions by time range into time slots with rooms
        if (exam.SESSIONS && exam.SESSIONS.length > 0) {
          const slotMap = new Map<string, TimeSlot>();

          exam.SESSIONS.forEach((session) => {
            const start = session.SS_START_TIME ? session.SS_START_TIME.substring(0, 5) : '';
            const end = session.SS_END_TIME ? session.SS_END_TIME.substring(0, 5) : '';
            const key = `${start}-${end}`;

            if (!slotMap.has(key)) {
              slotMap.set(key, {
                startTime: start,
                endTime: end,
                rooms: [],
              });
            }

            const slot = slotMap.get(key)!;
            slot.rooms.push({
              locationId: session.LOCATION?.LOCATION_ID ?? session.LOCATION_ID ?? null,
              proctorName: session.SS_NAME || '',
              seats: session.SS_CAPACITY ?? 40,
              sessionId: session.SS_ID,
              enrollmentCount: session.ENROLLMENTS?.length || 0,
            });
          });

          form.value.timeSlots = Array.from(slotMap.values());
        }

        // The schedule lock is now handled by the computed property 'isScheduleLocked'
        // based on exam.EXAM_PUBLISHED and session enrollment counts.
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      const msg = NOTIFY_MSG.LOAD_ERROR;
      error.value = msg;
      $q.notify({
        type: 'negative',
        message: msg,
        position: 'top',
      });
    } finally {
      isLoadingData.value = false;
    }
  };

  const addTimeSlot = (): void => {
    if (isScheduleLocked.value) return;
    if (form.value.timeSlots.length < MAX_EXAM_SESSIONS) {
      form.value.timeSlots.push({
        startTime: '',
        endTime: '',
        rooms: [{ locationId: null, proctorName: '', seats: 40 }],
      });
      // Switch to the newly added tab
      activeSlotIndex.value = form.value.timeSlots.length - 1;
    } else {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.MAX_SESSIONS(MAX_EXAM_SESSIONS),
        position: 'top',
      });
    }
  };

  const removeTimeSlot = (index: number): void => {
    if (isScheduleLocked.value) return;
    if (form.value.timeSlots.length > MIN_EXAM_SESSIONS) {
      form.value.timeSlots.splice(index, 1);
      // Adjust active tab if needed
      if (activeSlotIndex.value >= form.value.timeSlots.length) {
        activeSlotIndex.value = form.value.timeSlots.length - 1;
      }
    } else {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.MIN_SESSIONS(MIN_EXAM_SESSIONS),
        position: 'top',
      });
    }
  };

  /** Add a room to a specific time slot */
  const addRoom = (slotIndex: number): void => {
    if (isScheduleLocked.value) return;
    form.value.timeSlots[slotIndex]?.rooms.push({
      locationId: null,
      proctorName: '',
      seats: 40,
    });
  };

  /** Remove a room from a specific time slot */
  const removeRoom = (slotIndex: number, roomIndex: number): void => {
    if (isScheduleLocked.value) return;
    const slot = form.value.timeSlots[slotIndex];
    if (slot && slot.rooms.length > 1) {
      slot.rooms.splice(roomIndex, 1);
    } else {
      $q.notify({
        type: 'warning',
        message: 'ต้องมีห้องสอบอย่างน้อย 1 ห้อง',
        position: 'top',
      });
    }
  };

  /** Import mock candidates for special rounds */
  const importCandidates = (file?: File): void => {
    try {
      if (!file) return;
      $q.loading.show({ message: 'กำลังเตรียมนำเข้าข้อมูล...' });

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          const candidates: EligibleCandidate[] = [];

          // Assume format: nationalId,fullName
          // Skip header
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const cols = line.split(',');
            if (cols.length >= 2) {
              const nationalId = cols[0];
              const fullName = cols[1];
              if (nationalId !== undefined && fullName !== undefined) {
                candidates.push({
                  nationalId: nationalId.trim(),
                  fullName: fullName.trim(),
                  passcode: '',
                });
              }
            }
          }

          form.value.eligibleCandidates = candidates;
          $q.notify({
            type: 'positive',
            message: `นำเข้าข้อมูลรายชื่อสำเร็จ ${candidates.length} รายการ`,
          });
        } catch {
          $q.notify({ type: 'negative', message: 'รูปแบบไฟล์ไม่ถูกต้อง' });
        } finally {
          $q.loading.hide();
        }
      };
      reader.readAsText(file);
    } catch {
      $q.loading.hide();
      $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
    }
  };

  /** Generate random 6-digit passcodes for all eligible candidates */
  const generatePasscodes = (): void => {
    if (form.value.eligibleCandidates.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'กรุณานำเข้ารายชื่อก่อนสร้าง Passcode',
        position: 'top',
      });
      return;
    }
    form.value.eligibleCandidates = form.value.eligibleCandidates.map((c) => ({
      ...c,
      passcode: String(Math.floor(100000 + Math.random() * 900000)),
    }));
    $q.notify({
      type: 'positive',
      message: `สร้าง Passcode สำเร็จ ${form.value.eligibleCandidates.length} รายการ`,
      position: 'top',
      timeout: 2000,
    });
  };

  const handleCancel = (): void => {
    void router.push('/admin/exam-management');
  };

  /** Auto-formats a time string (e.g. "10" -> "10:00") */
  const autoFormatTime = (time: string): string => {
    if (!time) return '';
    const digits = time.replace(/\D/g, '');
    if (digits.length === 1 || digits.length === 2) {
      return `${digits.padStart(2, '0')}:00`;
    }
    if (digits.length === 3) {
      return `0${digits.substring(0, 1)}:${digits.substring(1, 3)}`;
    }
    if (digits.length >= 4) {
      return `${digits.substring(0, 2)}:${digits.substring(2, 4)}`;
    }
    return time;
  };

  /**
   * Flatten all rooms from all time slots into a single array of time-range + room data
   * for backend submission.
   */
  const flattenRoomsToTimeRanges = () => {
    const result: {
      startTime: string;
      endTime: string;
      locationId: number;
      seats: number;
      proctorName: string;
      sessionId?: number;
    }[] = [];

    form.value.timeSlots.forEach((slot) => {
      if (!slot.startTime || !slot.endTime) return;
      slot.rooms.forEach((room) => {
        result.push({
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          locationId: Number(room.locationId),
          seats: Number(room.seats),
          proctorName: room.proctorName || '',
          ...(room.sessionId != null ? { sessionId: room.sessionId } : {}),
        });
      });
    });

    return result;
  };

  /**
   * Saves the exam round (create or update depending on mode).
   * @returns Promise<boolean> - true if saved successfully, false otherwise
   */
  const handleSave = async (): Promise<boolean> => {
    const flatRooms = flattenRoomsToTimeRanges();

    if (flatRooms.length === 0) {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.PROVIDE_TIME,
        position: 'top',
      });
      return false;
    }

    // Validate that all rooms have a location
    const missingLocation = flatRooms.some((r) => !r.locationId);
    if (missingLocation) {
      $q.notify({
        type: 'warning',
        message: NOTIFY_MSG.SELECT_LOCATION,
        position: 'top',
      });
      return false;
    }

    // Fund source is required only for general rounds
    if (!isSpecialRound.value && !form.value.fundSourceId) {
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

    // Build time ranges from flat rooms (for backward compatible payload)
    const timeRanges = flatRooms.map((r) => ({
      startTime: r.startTime,
      endTime: r.endTime,
      locationId: r.locationId,
      seats: r.seats,
      proctorName: r.proctorName,
    }));

    try {
      if (isEditMode.value && examId) {
        // === EDIT MODE ===
        const existingSessionIds = flatRooms
          .filter((r) => r.sessionId)
          .map((r) => r.sessionId as number);

        await updateExamRound({
          examId,
          examName: form.value.examName,
          locationId: Number(flatRooms[0]?.locationId || 0),
          examType: form.value.examType,
          examFormat: form.value.examFormat,
          fee: Number(form.value.fee),
          seats: Number(flatRooms[0]?.seats || 1),
          isPublished: form.value.isPublished,
          examDate: form.value.examDate,
          regStartDate: form.value.regStartDate,
          regEndDate: form.value.regEndDate,
          payStartDate: form.value.payStartDate,
          payEndDate: form.value.payEndDate,
          timeRanges,
          fundSourceId: Number(form.value.fundSourceId || 0),
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
          locationId: flatRooms[0]?.locationId || 0,
          examType: form.value.examType,
          examFormat: form.value.examFormat,
          fee: form.value.fee,
          seats: flatRooms[0]?.seats || 1,
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
    } catch (err) {
      console.error('Save error:', err);
      const msg = isEditMode.value ? NOTIFY_MSG.UPDATE_ERROR : NOTIFY_MSG.CREATE_ERROR;
      error.value = msg;
      $q.notify({
        type: 'negative',
        message: msg,
        position: 'top',
      });
      return false;
    }
  };

  return {
    form,
    examTypeOptions,
    examFormatOptions,
    proctorOptions,
    locationOptions,
    fundSourceOptions,
    isLoadingData,
    error,
    isEditMode,
    isScheduleLocked,
    isLockedByEnrollment,
    isSpecialRound,
    wasOriginallyPublished,
    activeSlotIndex,
    candidateSearch,
    filteredCandidates,
    loadInitialData,
    addTimeSlot,
    removeTimeSlot,
    addRoom,
    removeRoom,
    importCandidates,
    generatePasscodes,
    handleCancel,
    handleSave,
    autoFormatTime,
  };
}
