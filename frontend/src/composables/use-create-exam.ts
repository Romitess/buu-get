import { ref, computed, nextTick, type Ref } from 'vue';
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
  VALIDATION_MSG,
} from 'src/constants/exam';
import type { CreateExamPayload, ExamLocationOption, FundSource } from 'src/services/exam.service';
import type { PasscodeType } from 'src/types/exam';
import {
  fetchExamLocations,
  fetchFundSources,
  fetchExamById,
  updateExamRound,
  formatTime,
  buddhistToGregorian,
  createExamPasscodes,
} from 'src/services/exam.service';
import { getUsersFromApi } from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';

/** A single room within a time slot */
export interface ExamRoom {
  /** Location ID (dropdown) */
  locationId: number | null;
  /** Proctor name (dropdown) */
  proctorName: string | null;
  /** Selected proctors array */
  proctors?: string[];
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
  nationalId?: string | undefined;
  /** Passport number for foreign candidates */
  passportNo?: string | undefined;
  /** Full name in Thai */
  fullName?: string | undefined;
  /** Full name in English */
  fullNameEn?: string | undefined;
  /** Generated passcode */
  passcode: string;
}

export interface CreateExamForm {
  examName: string;
  examRound: string;
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
  const isEditMode = computed<boolean>(() => !!examId);

  const wasOriginallyPublished = ref(false);
  const originalExamDate = ref('');

  /** Published exams keep non-schedule sections read-only. */
  const isPublishedSectionLocked = computed<boolean>(() => {
    return isEditMode.value && (wasOriginallyPublished.value || form.value.isPublished);
  });

  /** The schedule remains editable in edit mode, including after enrollment starts. */
  const isScheduleLocked = computed<boolean>(() => false);

  /** Checks if the schedule is locked specifically due to existing enrollments */
  const isLockedByEnrollment = computed<boolean>(() => {
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
      examRound: '',
      examType: EXAM_TYPE_GENERAL,
      examFormat: EXAM_FORMAT_COMPUTER,
      fundSourceId: null,
      fee: '0.00',
      isPublished: false,
      examDate: today,
      timeSlots: [
        {
          startTime: '08:00',
          endTime: '10:00',
          rooms: [{ locationId: null, proctorName: '', proctors: [], seats: 40 }],
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
    return form.value.eligibleCandidates.filter((c) => {
      const id = c.nationalId?.toLowerCase() ?? '';
      const name = c.fullName?.toLowerCase() ?? '';
      const passport = c.passportNo?.toLowerCase() ?? '';
      const nameEn = c.fullNameEn?.toLowerCase() ?? '';
      return (
        id.includes(q) ||
        passport.includes(q) ||
        name.includes(q) ||
        nameEn.includes(q) ||
        c.passcode.toLowerCase().includes(q)
      );
    });
  });

  // Helper to convert DD/MM/YYYY to numeric value for comparison
  const dateToCompareValue = (dateStr: string): number => {
    if (!dateStr || !dateStr.includes('/')) return 0;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return 0;
    const d = parts[0];
    const m = parts[1];
    const y = parts[2];
    if (!d || !m || !y) return 0;
    return parseInt(y, 10) * 10000 + parseInt(m, 10) * 100 + parseInt(d, 10);
  };

  const dateErrors = computed<Record<string, string>>(() => {
    const errors = {
      regStartDate: '',
      regEndDate: '',
      payStartDate: '',
      payEndDate: '',
      examDate: '',
    };

    const todayVal = dateToCompareValue(today);
    const regStartVal = dateToCompareValue(form.value.regStartDate);
    const regEndVal = dateToCompareValue(form.value.regEndDate);
    const payStartVal = dateToCompareValue(form.value.payStartDate);
    const payEndVal = dateToCompareValue(form.value.payEndDate);
    const examVal = dateToCompareValue(form.value.examDate);

    // 1. วันที่เริ่มต้นลงทะเบียนต้องไม่เป็นวันที่ผ่านไปแล้ว (เฉพาะสร้างใหม่)
    if (!isEditMode.value && regStartVal > 0 && regStartVal < todayVal) {
      errors.regStartDate = 'วันที่เริ่มต้นลงทะเบียนต้องไม่เป็นวันที่ผ่านไปแล้ว';
    }

    // 2. วันที่สิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน
    if (regEndVal > 0 && regStartVal > 0 && regEndVal < regStartVal) {
      errors.regEndDate = 'วันที่สิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน';
    }

    // 3. วันที่เริ่มต้นชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน (เว้นแต่เป็นรอบพิเศษ)
    if (!isSpecialRound.value && payStartVal > 0 && regStartVal > 0 && payStartVal < regStartVal) {
      errors.payStartDate = 'วันที่เริ่มต้นชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน';
    }

    // 4. วันที่สิ้นสุดการชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นชำระเงิน
    if (!isSpecialRound.value && payEndVal > 0 && payStartVal > 0 && payEndVal < payStartVal) {
      errors.payEndDate = 'วันที่สิ้นสุดการชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นชำระเงิน';
    }

    // 5. วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการลงทะเบียน
    if (examVal > 0 && regEndVal > 0 && examVal < regEndVal) {
      errors.examDate = 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการลงทะเบียน';
    }

    // 6. วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน (รอบทั่วไป)
    if (!isSpecialRound.value && examVal > 0 && payEndVal > 0 && examVal < payEndVal) {
      if (errors.examDate) {
        errors.examDate += ' และต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน';
      } else {
        errors.examDate = 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน';
      }
    }
    // 7. วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว (เฉพาะกรณีสร้างใหม่ หรือมีการแก้ไขวันที่สอบ)
    const isExamDateChanged = !isEditMode.value || form.value.examDate !== originalExamDate.value;
    if (examVal > 0 && examVal < todayVal && isExamDateChanged) {
      if (errors.examDate) {
        errors.examDate += ' และต้องไม่เป็นวันที่ผ่านไปแล้ว';
      } else {
        errors.examDate = 'วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว';
      }
    }

    return errors;
  });

  const getLocationMaxSeats = (locationId: number | null): number => {
    if (!locationId) return 9999;
    const option = locationOptions.value.find((opt) => opt.value === locationId);
    if (!option || !option.raw) return 9999;
    const seats = option.raw.SEATS;
    if (seats) {
      return seats.filter((seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2).length;
    }
    if (
      option.raw.LOCATION_SEAT_CAPACITY !== undefined &&
      option.raw.LOCATION_SEAT_CAPACITY !== null
    ) {
      return option.raw.LOCATION_SEAT_CAPACITY;
    }
    return 0;
  };

  // ── Field-level validation (required fields) ──
  /** Reactive object holding per-field validation error messages */
  const fieldErrors = ref<Record<string, string>>({});

  /** Counter to re-trigger shake animation (increment to re-animate) */
  const shakeKey = ref(0);

  /**
   * Validate required fields and populate fieldErrors.
   * @returns true if all required fields are filled, false otherwise.
   */
  const timeToMinutes = (timeStr: string | undefined): number => {
    if (!timeStr) return 9999;
    const cleaned = timeStr.replace(/\s/g, '');
    if (!cleaned) return 9999;
    const parts = cleaned.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // ── Card 1: ข้อมูลพื้นฐาน ──
    if (!form.value.examName || !form.value.examName.trim()) {
      errors.examName = VALIDATION_MSG.EXAM_NAME;
    }
    if (!form.value.examRound || !form.value.examRound.trim()) {
      errors.examRound = VALIDATION_MSG.EXAM_ROUND;
    }
    if (!form.value.examType) {
      errors.examType = VALIDATION_MSG.EXAM_TYPE;
    }
    if (!form.value.examFormat) {
      errors.examFormat = VALIDATION_MSG.EXAM_FORMAT;
    }
    if (!isSpecialRound.value && !form.value.fundSourceId) {
      errors.fundSourceId = VALIDATION_MSG.FUND_SOURCE;
    }

    // ── Card 2: กำหนดการสอบ ──
    if (!form.value.examDate || !form.value.examDate.trim()) {
      errors.examDate = VALIDATION_MSG.EXAM_DATE;
    }
    // Validate time slots
    form.value.timeSlots.forEach((slot, slotIdx) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      let hasValidStartTime = false;
      let hasValidEndTime = false;
      const selectedLocationIds = new Set<number>();

      if (!slot.startTime || !slot.startTime.trim()) {
        errors[`startTime_${slotIdx}`] = VALIDATION_MSG.START_TIME;
      } else if (!timeRegex.test(slot.startTime)) {
        errors[`startTime_${slotIdx}`] = 'รูปแบบเวลาไม่ถูกต้อง (ต้องอยู่ระหว่าง 00:00 - 23:59)';
      } else {
        hasValidStartTime = true;
      }

      if (!slot.endTime || !slot.endTime.trim()) {
        errors[`endTime_${slotIdx}`] = VALIDATION_MSG.END_TIME;
      } else if (!timeRegex.test(slot.endTime)) {
        errors[`endTime_${slotIdx}`] = 'รูปแบบเวลาไม่ถูกต้อง (ต้องอยู่ระหว่าง 00:00 - 23:59)';
      } else {
        hasValidEndTime = true;
      }

      if (hasValidStartTime && hasValidEndTime) {
        if (timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)) {
          errors[`endTime_${slotIdx}`] = 'เวลาสิ้นสุดต้องหลังจากเวลาเริ่ม';
        }
      }

      slot.rooms.forEach((room, roomIdx) => {
        if (!room.locationId) {
          errors[`locationId_${slotIdx}_${roomIdx}`] = VALIDATION_MSG.LOCATION;
        } else if (selectedLocationIds.has(room.locationId)) {
          errors[`locationId_${slotIdx}_${roomIdx}`] =
            'ไม่สามารถเลือกห้องสอบซ้ำในช่วงเวลาเดียวกันได้';
        } else {
          selectedLocationIds.add(room.locationId);
        }
        if (!room.seats || room.seats <= 0) {
          errors[`seats_${slotIdx}_${roomIdx}`] = VALIDATION_MSG.SEATS;
        } else if (room.locationId) {
          const maxSeats = getLocationMaxSeats(room.locationId);
          if (room.seats > maxSeats) {
            errors[`seats_${slotIdx}_${roomIdx}`] =
              `เกินขอบเขตความจุที่นั่งของห้องสอบ มีที่นั่งได้ไม่เกิน ${maxSeats} ที่นั่ง ในสถานที่นี้`;
          }
        }
      });
    });

    // ── Card 3: กำหนดการลงทะเบียน ──
    if (!form.value.regStartDate || !form.value.regStartDate.trim()) {
      errors.regStartDate = VALIDATION_MSG.REG_START_DATE;
    }
    if (!form.value.regEndDate || !form.value.regEndDate.trim()) {
      errors.regEndDate = VALIDATION_MSG.REG_END_DATE;
    }
    if (!isSpecialRound.value) {
      if (!form.value.payStartDate || !form.value.payStartDate.trim()) {
        errors.payStartDate = VALIDATION_MSG.PAY_START_DATE;
      }
      if (!form.value.payEndDate || !form.value.payEndDate.trim()) {
        errors.payEndDate = VALIDATION_MSG.PAY_END_DATE;
      }
    }

    fieldErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  /**
   * Re-trigger the shake animation by incrementing shakeKey.
   * Used to replay the animation even if the same fields are still invalid.
   */
  const triggerShake = (): void => {
    shakeKey.value++;
  };

  /**
   * Clear a specific field error when the user fills in the field.
   */
  const clearFieldError = (fieldName: string): void => {
    if (fieldErrors.value[fieldName]) {
      const newErrors = { ...fieldErrors.value };
      delete newErrors[fieldName];
      fieldErrors.value = newErrors;
    }
  };

  /**
   * Scroll smoothly to the first field with a validation error.
   * Uses data-field attribute to find the DOM element.
   */
  const scrollToFirstError = async (): Promise<void> => {
    await nextTick();

    const firstErrorKey = Object.keys(fieldErrors.value)[0];
    if (!firstErrorKey) return;

    const el = document.querySelector(`[data-field="${firstErrorKey}"]`) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the input inside if possible
      await nextTick();
      const input = el.querySelector('input, select, .q-field__native') as HTMLElement;
      if (input && typeof input.focus === 'function') {
        input.focus();
      }
    }
  };

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
        const finalName = displayName || 'ไม่ระบุชื่อ';
        return {
          label: finalName,
          value: finalName,
        };
      });

      // If in edit mode, load the existing exam data into the form
      if (examId) {
        const exam = await fetchExamById(examId);

        form.value.examName = exam.EXAM_NAME || '';
        form.value.examRound = exam.EXAM_ROUND || '';
        form.value.examType = exam.EXAM_TYPE || EXAM_TYPE_GENERAL;
        form.value.examFormat = exam.EXAM_FORMAT || EXAM_FORMAT_COMPUTER;
        form.value.fee = Number(exam.EXAM_FEE ?? 0).toFixed(2);
        form.value.isPublished = exam.EXAM_PUBLISHED ?? false;
        wasOriginallyPublished.value = exam.EXAM_PUBLISHED ?? false;
        form.value.examDate = gregorianToBuddhistDisplay(exam.EXAM_DATE);
        originalExamDate.value = form.value.examDate;
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
            const relationLocations = session.SESSION_LOCATIONS || [];
            if (relationLocations.length > 0) {
              relationLocations
                .filter((relation) => relation.LOCATION)
                .forEach((relation) => {
                  const relationProctors: string[] = [];
                  if (relation.SS_NAME) {
                    const customNames = relation.SS_NAME.split(',')
                      .map((name) => name.trim())
                      .filter(Boolean);
                    relationProctors.push(...customNames);
                  }

                  slot.rooms.push({
                    locationId: relation.LOCATION_ID ?? relation.LOCATION.LOCATION_ID ?? null,
                    proctorName: relation.SS_NAME || '',
                    proctors: Array.from(new Set(relationProctors)),
                    seats:
                      relation.LOCATION.SEATS?.filter(
                        (seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2,
                      ).length ||
                      relation.LOCATION.LOCATION_SEAT_CAPACITY ||
                      40,
                    sessionId: session.SS_ID,
                    enrollmentCount:
                      session.ENROLLMENTS?.filter(
                        (enrollment) => enrollment.SL_ID === relation.SL_ID,
                      ).length || 0,
                  });
                });
              return;
            }

            slot.rooms.push({
              locationId: session.LOCATION?.LOCATION_ID ?? session.LOCATION_ID ?? null,
              proctorName: '',
              proctors: [],
              seats: session.SS_CAPACITY ?? 40,
              sessionId: session.SS_ID,
              enrollmentCount: session.ENROLLMENTS?.length || 0,
            });
          });

          form.value.timeSlots = Array.from(slotMap.values());
          sortTimeSlots();
        }

        // Load passcodes into eligibleCandidates for special rounds
        if (exam.PASSCODES && exam.PASSCODES.length > 0) {
          form.value.eligibleCandidates = exam.PASSCODES.map((p, idx) => ({
            index: idx + 1,
            nationalId: p.NATIONAL_ID,
            fullName: p.FULL_NAME,
            passcode: p.PASSCODE,
          }));
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

  const sortTimeSlots = (): void => {
    if (form.value.timeSlots.length <= 1) return;

    const currentActiveSlot = form.value.timeSlots[activeSlotIndex.value];

    form.value.timeSlots.sort((a, b) => {
      const aStart = timeToMinutes(a.startTime);
      const bStart = timeToMinutes(b.startTime);

      if (aStart !== bStart) {
        return aStart - bStart;
      }

      const aEnd = timeToMinutes(a.endTime);
      const bEnd = timeToMinutes(b.endTime);
      return aEnd - bEnd;
    });

    if (currentActiveSlot) {
      const newIndex = form.value.timeSlots.indexOf(currentActiveSlot);
      if (newIndex !== -1) {
        activeSlotIndex.value = newIndex;
      }
    }
  };

  const addTimeSlot = (): void => {
    if (isScheduleLocked.value) return;
    if (form.value.timeSlots.length < MAX_EXAM_SESSIONS) {
      form.value.timeSlots.push({
        startTime: '',
        endTime: '',
        rooms: [{ locationId: null, proctorName: '', proctors: [], seats: 40 }],
      });
      sortTimeSlots();
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
      sortTimeSlots();
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
      proctors: [],
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

  /**
   * Strip UTF-8 BOM (byte order mark) from the start of text.
   * BOM character is \uFEFF and appears when files are saved as "UTF-8 with BOM".
   */
  const stripBom = (text: string): string => {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  };

  /**
   * Parse CSV content into rows and columns, handling quotes and literal newlines.
   */
  const parseCsvRows = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let col = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            col += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          col += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(col.trim());
          col = '';
        } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
          row.push(col.trim());
          result.push(row);
          row = [];
          col = '';
          if (char === '\r') i++;
        } else {
          col += char;
        }
      }
    }
    if (row.length > 0 || col !== '') {
      row.push(col.trim());
      result.push(row);
    }
    return result.filter((r) => r.some((cell) => cell !== ''));
  };

  /**
   * Find column index by matching header text against known keywords.
   * Returns -1 if no match is found.
   */
  const findColumnIndex = (headers: string[], keywords: string[]): number => {
    return headers.findIndex((h) => {
      const normalized = h.replace(/["\s]/g, '').toLowerCase();
      return keywords.some((kw) => normalized.includes(kw));
    });
  };

  /** Import candidates from CSV file for special rounds */
  const importCandidates = (file?: File): void => {
    try {
      if (!file) return;
      $q.loading.show({ message: 'กำลังเตรียมนำเข้าข้อมูล...' });

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const rawText = e.target?.result as string;
          const text = stripBom(rawText);
          const rows = parseCsvRows(text);

          if (rows.length < 2) {
            $q.notify({
              type: 'warning',
              message: 'ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย header + 1 แถว)',
            });
            $q.loading.hide();
            return;
          }

          // ── Header detection ──
          const headerCols = rows[0] ?? [];

          // Keywords for matching columns
          const idKeywords = [
            'รหัสประชาชน',
            'รหัสประจำตัว',
            'รหัส',
            'nationalid',
            'studentid',
            'id',
          ];
          const nameKeywords = ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'ชื่อ', 'fullname', 'name'];

          let idColIndex = findColumnIndex(headerCols, idKeywords);
          let nameColIndex = findColumnIndex(headerCols, nameKeywords);

          // Fallback: if header detection fails, assume positional mapping
          if (idColIndex === -1 || nameColIndex === -1) {
            if (headerCols.length === 2) {
              // 2 columns → [รหัสประจำตัว, ชื่อ-นามสกุล]
              idColIndex = 0;
              nameColIndex = 1;
            } else if (headerCols.length >= 3) {
              // 3+ columns → assume [ลำดับ, รหัสประจำตัว, ชื่อ-นามสกุล, ...]
              idColIndex = 1;
              nameColIndex = 2;
            } else {
              $q.notify({
                type: 'negative',
                message: 'ไฟล์ต้องมีอย่างน้อย 2 คอลัมน์ (รหัสประจำตัว, ชื่อ-นามสกุล)',
              });
              $q.loading.hide();
              return;
            }
          }

          // ── Parse data rows ──
          const candidates: EligibleCandidate[] = [];

          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            if (!cols) continue;

            const nationalId = cols[idColIndex];
            const fullName = cols[nameColIndex];

            if (nationalId && fullName && nationalId.trim().length > 0) {
              candidates.push({
                nationalId: nationalId.trim(),
                fullName: fullName.trim(),
                passcode: '',
              });
            }
          }

          if (candidates.length === 0) {
            $q.notify({ type: 'warning', message: 'ไม่พบข้อมูลรายชื่อในไฟล์' });
            $q.loading.hide();
            return;
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
      reader.readAsText(file, 'UTF-8');
    } catch {
      $q.loading.hide();
      $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
    }
  };


  /** Export candidates to CSV */
  const exportCandidates = (): void => {
    if (form.value.eligibleCandidates.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'ไม่มีข้อมูลให้ส่งออก',
        position: 'top',
      });
      return;
    }

    const BOM = '\ufeff';
    const header = '"ลำดับ","รหัสประชาชน","ชื่อ-นามสกุล","Passcode"';
    const rows = form.value.eligibleCandidates.map((c, idx) => {
      const index = idx + 1;
      const id = `"${c.nationalId || ''}"`;
      const name = `"${c.fullName || ''}"`;
      const code = `"${c.passcode || ''}"`;
      return `${index},${id},${name},${code}`;
    });

    const content = BOM + [header, ...rows].join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `passcodes_${examId || 'new'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** Generate random 6-digit passcodes for all eligible candidates */
  const generatePasscodes = (type: PasscodeType = 'individual'): void => {
    if (form.value.eligibleCandidates.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'กรุณานำเข้ารายชื่อก่อนสร้าง Passcode',
        position: 'top',
      });
      return;
    }

    if (type === 'single') {
      const singlePasscode = String(Math.floor(100000 + Math.random() * 900000));
      form.value.eligibleCandidates = form.value.eligibleCandidates.map((c) => ({
        ...c,
        passcode: singlePasscode,
      }));
    } else {
      form.value.eligibleCandidates = form.value.eligibleCandidates.map((c) => ({
        ...c,
        passcode: String(Math.floor(100000 + Math.random() * 900000)),
      }));
    }

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

  /** Auto-formats a time string (e.g. "10" -> "10:00") and caps hour at 23 and minute at 59 */
  const autoFormatTime = (time: string): string => {
    if (!time) return '';
    const digits = time.replace(/\D/g, '');
    let hh = 0;
    let mm = 0;
    if (digits.length === 1 || digits.length === 2) {
      hh = parseInt(digits, 10);
      mm = 0;
    } else if (digits.length === 3) {
      hh = parseInt(digits.substring(0, 1), 10);
      mm = parseInt(digits.substring(1, 3), 10);
    } else if (digits.length >= 4) {
      hh = parseInt(digits.substring(0, 2), 10);
      mm = parseInt(digits.substring(2, 4), 10);
    } else {
      return time;
    }

    if (hh > 23) hh = 23;
    if (mm > 59) mm = 59;

    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  /**
   * Flatten all rooms from all time slots into a single array of time-range + room data
   * for backend submission.
   */
  const flattenRoomsToTimeRanges = (): {
    startTime: string;
    endTime: string;
    locationId: number;
    seats: number;
    proctorName: string | null;
    sessionId?: number;
  }[] => {
    const result: {
      startTime: string;
      endTime: string;
      locationId: number;
      seats: number;
      proctorName: string | null;
      sessionId?: number;
    }[] = [];

    form.value.timeSlots.forEach((slot) => {
      if (!slot.startTime || !slot.endTime) return;
      slot.rooms.forEach((room) => {
        const proctorName =
          room.proctors && room.proctors.length > 0 ? room.proctors.join(', ') : null;
        result.push({
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          locationId: Number(room.locationId),
          seats: Number(room.seats),
          proctorName,
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
    // ── Step 0: Required-field validation with scroll-to-error ──
    const isValid = validateForm();
    if (!isValid) {
      triggerShake();
      await scrollToFirstError();
      return false;
    }

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

    // === DATE LOGICAL VALIDATION ===
    const todayVal = dateToCompareValue(today);
    const regStartVal = dateToCompareValue(form.value.regStartDate);
    const regEndVal = dateToCompareValue(form.value.regEndDate);
    const payStartVal = dateToCompareValue(form.value.payStartDate);
    const payEndVal = dateToCompareValue(form.value.payEndDate);
    const examVal = dateToCompareValue(form.value.examDate);

    // 1. วันที่เริ่มต้นลงทะเบียนต้องไม่เป็นวันที่ผ่านไปแล้ว (เฉพาะกรณีสร้างใหม่)
    if (!isEditMode.value && regStartVal < todayVal) {
      $q.notify({
        type: 'warning',
        message: 'วันที่เริ่มต้นลงทะเบียนต้องไม่เป็นวันที่ผ่านไปแล้ว',
        position: 'top',
      });
      return false;
    }

    // 2. วันที่สิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน
    if (regEndVal < regStartVal) {
      $q.notify({
        type: 'warning',
        message: 'วันที่สิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน',
        position: 'top',
      });
      return false;
    }

    // 3. วันที่เริ่มต้นชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน (เว้นแต่เป็นรอบพิเศษที่ไม่มีชำระเงิน)
    if (!isSpecialRound.value) {
      if (payStartVal < regStartVal) {
        $q.notify({
          type: 'warning',
          message: 'วันที่เริ่มต้นชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นลงทะเบียน',
          position: 'top',
        });
        return false;
      }

      // 4. วันที่สิ้นสุดการชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นชำระเงิน
      if (payEndVal < payStartVal) {
        $q.notify({
          type: 'warning',
          message: 'วันที่สิ้นสุดการชำระเงินต้องไม่มาก่อนวันที่เริ่มต้นชำระเงิน',
          position: 'top',
        });
        return false;
      }
    }

    // 5. วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการลงทะเบียน
    if (examVal < regEndVal) {
      $q.notify({
        type: 'warning',
        message: 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการลงทะเบียน',
        position: 'top',
      });
      return false;
    }

    // 6. วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน (รอบทั่วไป)
    if (!isSpecialRound.value && examVal < payEndVal) {
      $q.notify({
        type: 'warning',
        message: 'วันที่สอบต้องไม่มาก่อนวันที่สิ้นสุดการชำระเงิน',
        position: 'top',
      });
      return false;
    }

    // 7. วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว (เฉพาะกรณีสร้างใหม่ หรือมีการแก้ไขวันที่สอบ)
    const isExamDateChanged = !isEditMode.value || form.value.examDate !== originalExamDate.value;
    if (examVal < todayVal && isExamDateChanged) {
      $q.notify({
        type: 'warning',
        message: 'วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว',
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
      ...(r.sessionId != null ? { sessionId: r.sessionId } : {}),
    }));

    try {
      let targetExamId = isEditMode.value ? examId : null;
      const combinedExamName = form.value.examName.trim();

      if (isEditMode.value && examId) {
        // === EDIT MODE ===
        const existingSessionIds = flatRooms
          .filter((r) => r.sessionId)
          .map((r) => r.sessionId as number);

        await updateExamRound({
          examId,
          examName: combinedExamName,
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
          examRound: form.value.examRound,
          existingSessionIds,
        });

        // Refresh the management schedules in the store after successful edit
        await examStore.loadManagementSchedules(true);

        $q.notify({
          type: 'positive',
          message: NOTIFY_MSG.UPDATE_SUCCESS,
          position: 'top',
          timeout: 2000,
        });
      } else {
        // === CREATE MODE ===
        const payload: CreateExamPayload = {
          examName: combinedExamName,
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
          examRound: form.value.examRound,
        };

        targetExamId = await examStore.addExamRound(payload);
        // Refresh the management schedules in the store after successful creation
        await examStore.loadManagementSchedules(true);

        $q.notify({
          type: 'positive',
          message: NOTIFY_MSG.CREATE_SUCCESS,
          position: 'top',
          timeout: 2000,
        });
      }

      if (
        targetExamId &&
        form.value.examType === EXAM_TYPE_SPECIAL &&
        form.value.eligibleCandidates.length > 0
      ) {
        const passcodesPayload = form.value.eligibleCandidates.map((c) => ({
          nationalId: c.nationalId ?? undefined,
          passportNo: c.passportNo ?? undefined,
          fullName: c.fullName ?? undefined,
          fullNameEn: c.fullNameEn ?? undefined,
          passcode: c.passcode,
        }));
        await createExamPasscodes(targetExamId, passcodesPayload);
      }

      void router.push('/admin/exam-management');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      const errorObj = err as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
        message?: string;
      };
      const backendMsg = errorObj.response?.data?.message;
      const detailedMsg = Array.isArray(backendMsg)
        ? backendMsg.join(', ')
        : backendMsg || errorObj.message;
      const msg = detailedMsg
        ? `${isEditMode.value ? NOTIFY_MSG.UPDATE_ERROR : NOTIFY_MSG.CREATE_ERROR}: ${detailedMsg}`
        : isEditMode.value
          ? NOTIFY_MSG.UPDATE_ERROR
          : NOTIFY_MSG.CREATE_ERROR;
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
    isPublishedSectionLocked,
    isScheduleLocked,
    isLockedByEnrollment,
    isSpecialRound,
    wasOriginallyPublished,
    activeSlotIndex,
    candidateSearch,
    filteredCandidates,
    fieldErrors,
    shakeKey,
    loadInitialData,
    addTimeSlot,
    removeTimeSlot,
    addRoom,
    removeRoom,
    importCandidates,
    generatePasscodes,
    exportCandidates,
    handleCancel,
    handleSave,
    autoFormatTime,
    sortTimeSlots,
    dateErrors,
    clearFieldError,
  };
}
