import { ref, computed, nextTick, watch, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useExamStore } from 'src/stores/exam.store';
import {
  BUDDHIST_YEAR_OFFSET,
  DEFAULT_EXAM_FEE_THB,
  DEFAULT_EXAM_NAME,
  EXAM_FISCAL_YEAR_AD_REGEX,
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  EXAM_FORMAT_COMPUTER,
  EXAM_FORMAT_PAPER,
  MIN_EXAM_SESSIONS,
  NOTIFY_MSG,
  VALIDATION_MSG,
  getCurrentThaiFiscalYearAd,
} from 'src/constants/exam';
import type { CreateExamPayload, ExamLocationOption, FundSource } from 'src/services/exam.service';
import { fetchScoreRubrics } from 'src/services/score-rubric.service';
import type { PasscodeType, BackendExam, BackendLocation } from 'src/types/exam';
import {
  fetchExamLocations,
  fetchFundSources,
  fetchExamWithSeats,
  fetchAllExamsRaw,
  fetchExamBlockedSeats,
  updateExamRound,
  notifyExamChanges,
  formatTime,
  formatBackendDate,
  buddhistToGregorian,
  createExamPasscodes,
  parseBangkokDate,
  timestampToHhMm,
  type ExamChangeItem,
  type SessionLocationSnapshotPayload,
} from 'src/services/exam.service';
import { getUsersFromApi, checkUserIdentifiers } from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';
import { useUserStore } from 'src/stores/user.store';
import type { User } from 'src/types/user';

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
  /** Seat status overrides for this exam session, keyed by LS_ID */
  seatOverrides?: Record<number, number>;
  /** Session-specific room layout snapshot */
  sessionLocationSnapshot?: SessionLocationSnapshotPayload;
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
  /** true = มีในระบบ, false = ไม่มี, undefined = ยังไม่ตรวจสอบ */
  inSystem?: boolean;
}

const getEligibleCandidateKey = (
  candidate: Pick<EligibleCandidate, 'nationalId' | 'passportNo'>,
): string => candidate.nationalId?.trim() || candidate.passportNo?.trim() || '';

export { getEligibleCandidateKey };

export interface CreateExamForm {
  examName: string;
  examRound: string;
  examFiscalYear: string;
  examType: string;
  examFormat: string;
  fundSourceId: number | null;
  srbId: number | null;
  fee: string | number;
  isPublished: boolean;
  examDate: string;
  timeSlots: TimeSlot[];
  regStartDate: string;
  regStartTime: string;
  regEndDate: string;
  regEndTime: string;
  payStartDate: string;
  payStartTime: string;
  payEndDate: string;
  payEndTime: string;
  /** Eligible candidates for special rounds */
  eligibleCandidates: EligibleCandidate[];
}

/** Options for the composable to support both Create and Edit modes */
export interface UseExamFormOptions {
  /** If provided, the composable will operate in Edit Mode */
  examId?: number | undefined;
}

/** Snapshot ของฟิลด์ที่ใช้เปรียบเทียบหาความเปลี่ยนแปลงของรอบสอบ */
interface ExamComparisonSnapshot {
  examName: string;
  examRound: string;
  examFiscalYear: string;
  examType: string;
  examFormat: string;
  fee: string;
  fundSourceLabel: string;
  examDate: string;
  regStartDate: string;
  regEndDate: string;
  payStartDate: string;
  payEndDate: string;
  scheduleText: string;
}

const snapshotStatusToCode = (status: string | null | undefined): number => {
  if (status === 'BROKEN') return 1;
  if (status === 'BLOCKED') return 2;

  return 0;
};

const countAvailableSeats = (
  location: BackendLocation,
  seatOverrides?: Record<number, number>,
): number => {
  return (location.SEATS ?? []).filter(
    (seat) => (seatOverrides?.[seat.LS_ID] ?? seat.LS_SEAT_STATUS) === 0,
  ).length;
};

/**
 * จำนวนที่นั่งตอนโหลดแก้รอบสอบต้องมาจากค่าที่บันทึกไว้
 * (session-location capacity / SS_CAPACITY) ไม่ใช่จำนวนที่นั่งว่างทั้งผังห้อง
 */
const resolveLoadedRoomSeats = (
  relation: {
    LOCATION_SEAT_CAPACITY?: number | null;
    LOCATION: BackendLocation;
  },
  seatOverrides: Record<number, number>,
  sessionCapacity: number | null | undefined,
  roomCountInSession: number,
): number => {
  if (relation.LOCATION_SEAT_CAPACITY != null && relation.LOCATION_SEAT_CAPACITY > 0) {
    return relation.LOCATION_SEAT_CAPACITY;
  }

  // ข้อมูลเก่าที่ยังไม่มี snapshot ต่อห้อง: ใช้ SS_CAPACITY เมื่อมีห้องเดียว
  if (roomCountInSession === 1 && sessionCapacity != null && sessionCapacity > 0) {
    return sessionCapacity;
  }

  return countAvailableSeats(relation.LOCATION, seatOverrides) || sessionCapacity || 40;
};

const getLocationAisleAfter = (
  location: BackendLocation,
): { after_cols: number[]; after_rows: number[] } => {
  const fromLegacyCols = location.AISLE_AFTER_COLS ?? [];
  const fromLegacyRows = location.AISLE_AFTER_ROWS ?? [];
  const fromCombined = location.LOCATION_AISLE_AFTER_COL ?? [];

  return {
    after_cols: [
      ...fromLegacyCols,
      ...fromCombined
        .filter((item): item is { type: 'column'; index: number } =>
          typeof item === 'object' ? item.type === 'column' : false,
        )
        .map((item) => item.index),
      ...fromCombined.filter((item): item is number => typeof item === 'number'),
    ],
    after_rows: [
      ...fromLegacyRows,
      ...fromCombined
        .filter((item): item is { type: 'row'; index: number } =>
          typeof item === 'object' ? item.type === 'row' : false,
        )
        .map((item) => item.index),
    ],
  };
};

const hasAisleAfter = (
  aisleAfter: { after_cols: number[]; after_rows: number[] } | null | undefined,
): aisleAfter is { after_cols: number[]; after_rows: number[] } => {
  return Boolean(
    aisleAfter && (aisleAfter.after_cols.length > 0 || aisleAfter.after_rows.length > 0),
  );
};

/**
 * Composable for managing exam creation/editing logic.
 * @param externalForm - Optional external form ref (useful for injecting initial data or v-model syncing)
 * @param options - Options to configure mode (create vs edit)
 */
export function useCreateExam(externalForm?: Ref<CreateExamForm>, options?: UseExamFormOptions) {
  const router = useRouter();
  const $q = useQuasar();
  const examStore = useExamStore();
  const userStore = useUserStore();

  const examId = options?.examId;
  const isEditMode = computed<boolean>(() => !!examId);

  const wasOriginallyPublished = ref(false);
  const originalExamDate = ref('');

  /**
   * สแนปช็อตข้อมูลรอบสอบ ณ ตอนโหลด (edit mode) เพื่อใช้เปรียบเทียบหาความเปลี่ยนแปลง
   * สำหรับแจ้งเตือนผู้เข้าสอบทางอีเมล
   */
  const originalSnapshot = ref<ExamComparisonSnapshot | null>(null);

  const today = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${d}/${m}/${y}`;
  })();

  // Use external form if provided, otherwise create a new one.
  // This must be initialized before computed values and watchers that read form.value.
  const form =
    externalForm ||
    ref<CreateExamForm>({
      examName: DEFAULT_EXAM_NAME,
      examRound: '',
      examFiscalYear: getCurrentThaiFiscalYearAd(),
      examType: EXAM_TYPE_GENERAL,
      examFormat: EXAM_FORMAT_COMPUTER,
      fundSourceId: null,
      srbId: null,
      fee: String(DEFAULT_EXAM_FEE_THB),
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
      regStartTime: '00:00',
      regEndDate: today,
      regEndTime: '23:59',
      payStartDate: today,
      payStartTime: '00:00',
      payEndDate: today,
      payEndTime: '23:59',
      eligibleCandidates: [],
    });

  /** Published exams keep basic details read-only. */
  const isPublishedSectionLocked = computed<boolean>(() => {
    return isEditMode.value && wasOriginallyPublished.value;
  });

  /** The schedule remains editable in edit mode, including after enrollment starts. */
  const isScheduleLocked = computed<boolean>(() => false);

  /** Checks if the schedule is locked specifically due to existing enrollments */
  const isLockedByEnrollment = computed<boolean>(() => {
    return form.value.timeSlots.some((slot) =>
      slot.rooms.some((room) => (room.enrollmentCount || 0) > 0),
    );
  });

  const examTypeOptions: string[] = [EXAM_TYPE_GENERAL, EXAM_TYPE_SPECIAL];
  const examFormatOptions: string[] = [EXAM_FORMAT_COMPUTER, EXAM_FORMAT_PAPER];
  const proctorOptions = ref<{ label: string; value: string }[]>([]);
  const locationOptions = ref<ExamLocationOption[]>([]);
  const fundSourceOptions = ref<{ label: string; value: number }[]>([]);
  const allExams = ref<BackendExam[]>([]);
  const isLoadingData = ref(false);
  const isSaving = ref(false);
  const isImportingCandidates = ref(false);
  const error = ref<string | null>(null);

  function timeToMinutes(timeStr: string | undefined): number {
    if (!timeStr) return 9999;
    const cleaned = timeStr.replace(/\s/g, '');
    if (!cleaned) return 9999;
    const parts = cleaned.split(':');
    const hours = parseInt(parts[0] || '0', 10);
    const minutes = parseInt(parts[1] || '0', 10);
    return hours * 60 + minutes;
  }

  function doTimeRangesOverlapMinutes(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ): boolean {
    return startA < endB && endA > startB;
  }

  /**
   * ห้องที่ slot นี้เลือกไม่ได้ — จาก exam อื่น หรือรอบเวลาอื่นใน form ที่ทับซ้อนกัน
   * (ไม่รวมห้องอื่นใน slot เดียวกัน — จัดการแยกใน dropdown)
   */
  const getOccupiedLocationIdsForSlot = (slotIdx: number): Set<number> => {
    const occupied = new Set<number>();
    const slot = form.value.timeSlots[slotIdx];
    if (!slot?.startTime || !slot?.endTime) return occupied;

    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // รอบเวลาอื่นใน form เดียวกันที่ทับซ้อน
    form.value.timeSlots.forEach((otherSlot, otherIdx) => {
      if (otherIdx === slotIdx) return;
      if (!otherSlot.startTime || !otherSlot.endTime) return;

      const otherStart = timeToMinutes(otherSlot.startTime);
      const otherEnd = timeToMinutes(otherSlot.endTime);
      if (!doTimeRangesOverlapMinutes(slotStart, slotEnd, otherStart, otherEnd)) {
        return;
      }

      for (const room of otherSlot.rooms) {
        if (room.locationId !== null) {
          occupied.add(room.locationId);
        }
      }
    });

    // exam อื่นในวันเดียวกันที่ทับช่วงเวลานี้
    const formExamDate = form.value.examDate;
    if (!formExamDate) return occupied;

    const formDateGregorian = buddhistToGregorian(formExamDate);
    if (!formDateGregorian) return occupied;

    for (const exam of allExams.value) {
      if (examId && exam.EXAM_ID === examId) continue;

      const examDate = formatBackendDate(exam.EXAM_DATE);
      if (examDate !== formDateGregorian) continue;

      for (const session of exam.SESSIONS || []) {
        const ssStart = timeToMinutes(session.SS_START_TIME?.substring(0, 5));
        const ssEnd = timeToMinutes(session.SS_END_TIME?.substring(0, 5));
        if (!doTimeRangesOverlapMinutes(slotStart, slotEnd, ssStart, ssEnd)) {
          continue;
        }

        if (session.SESSION_LOCATIONS && session.SESSION_LOCATIONS.length > 0) {
          for (const loc of session.SESSION_LOCATIONS) {
            if (loc.LOCATION_ID) occupied.add(loc.LOCATION_ID);
          }
        } else if (session.LOCATION_ID) {
          occupied.add(session.LOCATION_ID);
        }
      }
    }

    return occupied;
  };

  // รีเซ็ตห้องที่กลายเป็น occupied เมื่อเวลา/รอบอื่นเปลี่ยน
  watch(
    () =>
      form.value.timeSlots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        locationIds: slot.rooms.map((room) => room.locationId),
      })),
    () => {
      if (isLoadingData.value) return;
      form.value.timeSlots.forEach((slot, slotIdx) => {
        const occupied = getOccupiedLocationIdsForSlot(slotIdx);
        slot.rooms.forEach((room) => {
          if (room.locationId !== null && occupied.has(room.locationId)) {
            room.locationId = null;
          }
        });
      });
    },
    { deep: true },
  );

  /** Currently active time slot tab index */
  const activeSlotIndex = ref(0);

  /** Search query for eligible candidates table */
  const candidateSearch = ref('');

  /** Whether the current exam type is special */
  const isSpecialRound = computed<boolean>(() => form.value.examType === EXAM_TYPE_SPECIAL);

  /** ช่วงชำระเงิน: auto-fill จากช่วงลงทะเบียนเมื่อ reg เปลี่ยน (ยังแก้ไขเองได้) */
  const syncPaymentPeriodFromRegistration = (): void => {
    if (isSpecialRound.value) return;
    form.value.payStartDate = form.value.regStartDate;
    form.value.payStartTime = form.value.regStartTime;
    form.value.payEndDate = form.value.regEndDate;
    form.value.payEndTime = form.value.regEndTime;
  };

  watch(
    () =>
      [
        form.value.regStartDate,
        form.value.regStartTime,
        form.value.regEndDate,
        form.value.regEndTime,
        form.value.examType,
      ] as const,
    () => {
      if (isLoadingData.value) return;
      syncPaymentPeriodFromRegistration();
    },
  );

  /**
   * รายชื่อผู้มีสิทธิ์สอบ (รอบพิเศษ) แก้ได้จนกว่าจะมีคนลงทะเบียน
   * เมื่อมี enrollment ที่ยังไม่ยกเลิกแล้ว จะล็อกเพิ่ม/ลบ/สร้าง passcode
   */
  const isEligibleCandidatesLocked = computed<boolean>(() => {
    return isSpecialRound.value && isLockedByEnrollment.value;
  });

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

  /** Keys of candidates already in the eligible list */
  const existingCandidateKeys = computed<string[]>(() =>
    form.value.eligibleCandidates
      .map((c) => getEligibleCandidateKey(c))
      .filter((key) => key.length > 0),
  );

  const hasEligibleCandidates = computed<boolean>(() => form.value.eligibleCandidates.length > 0);

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

  /** รวมวันที่+เวลาเป็นค่าเปรียบเทียบ (นาทีรวมจาก epoch ของปฏิทินฟอร์ม) */
  const datetimeToCompareValue = (dateStr: string, timeStr: string): number => {
    const dateVal = dateToCompareValue(dateStr);
    if (dateVal === 0) return 0;
    return dateVal * 1440 + timeToMinutes(timeStr || '00:00');
  };

  const nowDatetimeCompareValue = (): number => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear() + BUDDHIST_YEAR_OFFSET;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return datetimeToCompareValue(`${d}/${m}/${y}`, `${hh}:${mm}`);
  };

  /** วันสอบ + เวลาเริ่มรอบแรก (ถ้ามี) สำหรับเทียบกับปิดรับสมัคร */
  const examDatetimeCompareValue = (): number => {
    const examVal = dateToCompareValue(form.value.examDate);
    if (examVal === 0) return 0;
    const earliestStart = form.value.timeSlots
      .map((slot) => slot.startTime)
      .filter((t) => Boolean(t?.trim()))
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b))[0];
    return datetimeToCompareValue(form.value.examDate, earliestStart || '00:00');
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
    const regStartVal = datetimeToCompareValue(form.value.regStartDate, form.value.regStartTime);
    const regEndVal = datetimeToCompareValue(form.value.regEndDate, form.value.regEndTime);
    const payStartVal = datetimeToCompareValue(form.value.payStartDate, form.value.payStartTime);
    const payEndVal = datetimeToCompareValue(form.value.payEndDate, form.value.payEndTime);
    const examVal = examDatetimeCompareValue();
    const examDateOnlyVal = dateToCompareValue(form.value.examDate);

    // 1. วัน/เวลาเริ่มต้นลงทะเบียนต้องไม่เป็นอดีต (เฉพาะสร้างใหม่)
    if (!isEditMode.value && regStartVal > 0 && regStartVal < nowDatetimeCompareValue()) {
      errors.regStartDate = 'วันและเวลาเริ่มต้นลงทะเบียนต้องไม่เป็นอดีต';
    }

    // 2. วัน/เวลาสิ้นสุดการลงทะเบียนต้องไม่มาก่อนวัน/เวลาเริ่มต้น
    if (regEndVal > 0 && regStartVal > 0 && regEndVal < regStartVal) {
      errors.regEndDate = 'วันและเวลาสิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันและเวลาเริ่มต้นลงทะเบียน';
    }

    // 3. วัน/เวลาเริ่มต้นชำระเงินต้องไม่มาก่อนวัน/เวลาเริ่มต้นลงทะเบียน
    if (!isSpecialRound.value && payStartVal > 0 && regStartVal > 0 && payStartVal < regStartVal) {
      errors.payStartDate = 'วันและเวลาเริ่มต้นชำระเงินต้องไม่มาก่อนวันและเวลาเริ่มต้นลงทะเบียน';
    }

    // 4. วัน/เวลาสิ้นสุดการชำระเงินต้องไม่มาก่อนวัน/เวลาเริ่มต้นชำระเงิน
    if (!isSpecialRound.value && payEndVal > 0 && payStartVal > 0 && payEndVal < payStartVal) {
      errors.payEndDate = 'วันและเวลาสิ้นสุดการชำระเงินต้องไม่มาก่อนวันและเวลาเริ่มต้นชำระเงิน';
    }

    // 5. วัน/เวลาสอบต้องไม่มาก่อนวัน/เวลาสิ้นสุดการลงทะเบียน
    if (examVal > 0 && regEndVal > 0 && examVal < regEndVal) {
      errors.examDate = 'วันและเวลาสอบต้องไม่มาก่อนวันและเวลาสิ้นสุดการลงทะเบียน';
    }

    // 6. วัน/เวลาสอบต้องไม่มาก่อนวัน/เวลาสิ้นสุดการชำระเงิน (รอบทั่วไป)
    if (!isSpecialRound.value && examVal > 0 && payEndVal > 0 && examVal < payEndVal) {
      if (errors.examDate) {
        errors.examDate += ' และต้องไม่มาก่อนวันและเวลาสิ้นสุดการชำระเงิน';
      } else {
        errors.examDate = 'วันและเวลาสอบต้องไม่มาก่อนวันและเวลาสิ้นสุดการชำระเงิน';
      }
    }

    // 7. วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว (เฉพาะกรณีสร้างใหม่ หรือมีการแก้ไขวันที่สอบ)
    const isExamDateChanged = !isEditMode.value || form.value.examDate !== originalExamDate.value;
    if (examDateOnlyVal > 0 && examDateOnlyVal < todayVal && isExamDateChanged) {
      if (errors.examDate) {
        errors.examDate += ' และต้องไม่เป็นวันที่ผ่านไปแล้ว';
      } else {
        errors.examDate = 'วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว';
      }
    }

    return errors;
  });

  const getLocationMaxSeats = (
    locationId: number | null,
    seatOverrides?: Record<number, number>,
  ): number => {
    if (!locationId) return 9999;
    const option = locationOptions.value.find((opt) => opt.value === locationId);
    if (!option || !option.raw) return 9999;
    const seats = option.raw.SEATS;
    if (seats) {
      return countAvailableSeats(option.raw, seatOverrides);
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
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // ── Card 1: ข้อมูลพื้นฐาน ──
    if (!form.value.examName || !form.value.examName.trim()) {
      errors.examName = VALIDATION_MSG.EXAM_NAME;
    }
    if (!form.value.examRound || !form.value.examRound.trim()) {
      errors.examRound = VALIDATION_MSG.EXAM_ROUND;
    }
    if (!form.value.examFiscalYear || !form.value.examFiscalYear.trim()) {
      errors.examFiscalYear = VALIDATION_MSG.EXAM_FISCAL_YEAR;
    } else if (!EXAM_FISCAL_YEAR_AD_REGEX.test(form.value.examFiscalYear.trim())) {
      errors.examFiscalYear = VALIDATION_MSG.EXAM_FISCAL_YEAR_AD_ONLY;
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
    if (!form.value.srbId) {
      errors.srbId = VALIDATION_MSG.SCORE_RUBRIC;
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
        } else if (getOccupiedLocationIdsForSlot(slotIdx).has(room.locationId)) {
          errors[`locationId_${slotIdx}_${roomIdx}`] =
            'ไม่สามารถเลือกห้องสอบเดียวกันในช่วงเวลาที่ทับซ้อนกันได้';
        } else {
          selectedLocationIds.add(room.locationId);
        }
        if (!room.seats || room.seats <= 0) {
          errors[`seats_${slotIdx}_${roomIdx}`] = VALIDATION_MSG.SEATS;
        } else if (room.locationId) {
          const maxSeats = getLocationMaxSeats(room.locationId, room.seatOverrides);
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
    if (!form.value.regStartTime || !form.value.regStartTime.trim()) {
      errors.regStartTime = VALIDATION_MSG.REG_START_TIME;
    }
    if (!form.value.regEndDate || !form.value.regEndDate.trim()) {
      errors.regEndDate = VALIDATION_MSG.REG_END_DATE;
    }
    if (!form.value.regEndTime || !form.value.regEndTime.trim()) {
      errors.regEndTime = VALIDATION_MSG.REG_END_TIME;
    }
    if (!isSpecialRound.value) {
      if (!form.value.payStartDate || !form.value.payStartDate.trim()) {
        errors.payStartDate = VALIDATION_MSG.PAY_START_DATE;
      }
      if (!form.value.payStartTime || !form.value.payStartTime.trim()) {
        errors.payStartTime = VALIDATION_MSG.PAY_START_TIME;
      }
      if (!form.value.payEndDate || !form.value.payEndDate.trim()) {
        errors.payEndDate = VALIDATION_MSG.PAY_END_DATE;
      }
      if (!form.value.payEndTime || !form.value.payEndTime.trim()) {
        errors.payEndTime = VALIDATION_MSG.PAY_END_TIME;
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
    const { year, month, day } = parseBangkokDate(dateStr);
    const d = String(day).padStart(2, '0');
    const m = String(month).padStart(2, '0');
    const y = year + BUDDHIST_YEAR_OFFSET;
    return `${d}/${m}/${y}`;
  };

  const formatPeriodDisplay = (dateBe: string, timeHhMm: string): string => {
    if (!dateBe) return '';
    return timeHhMm ? `${dateBe} ${timeHhMm}` : dateBe;
  };

  /** หา label แหล่งทุนจาก id เพื่อแสดงในรายละเอียดการเปลี่ยนแปลง */
  const fundSourceLabelFor = (id: number | null): string => {
    if (!id) return 'ไม่ระบุ';
    return fundSourceOptions.value.find((o) => o.value === id)?.label || String(id);
  };

  /**
   * สร้างข้อความสรุปกำหนดการสอบและห้องสอบ (เรียงตามเวลา) เพื่อใช้เปรียบเทียบ
   * และแสดงในอีเมลแจ้งเตือน
   */
  const buildScheduleText = (): string => {
    const slots = [...form.value.timeSlots]
      .filter((slot) => slot.startTime && slot.endTime)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    return slots
      .map((slot) => {
        const rooms = slot.rooms
          .map((room) => {
            const loc = locationOptions.value.find((o) => o.value === room.locationId);
            const locLabel = loc?.label || 'ไม่ระบุห้อง';
            const proctorText =
              room.proctors && room.proctors.length > 0
                ? ` (ผู้คุมสอบ: ${room.proctors.join(', ')})`
                : '';
            return `• ${locLabel} ${room.seats} ที่นั่ง${proctorText}`;
          })
          .join('\n');
        return `เวลา ${slot.startTime} - ${slot.endTime} น.\n${rooms}`;
      })
      .join('\n\n');
  };

  /** สร้าง snapshot ของข้อมูลรอบสอบจากค่าปัจจุบันในฟอร์ม */
  const buildComparisonSnapshot = (): ExamComparisonSnapshot => ({
    examName: form.value.examName.trim(),
    examRound: form.value.examRound.trim(),
    examFiscalYear: form.value.examFiscalYear.trim(),
    examType: form.value.examType,
    examFormat: form.value.examFormat,
    fee: String(form.value.fee ?? ''),
    fundSourceLabel: fundSourceLabelFor(form.value.fundSourceId),
    examDate: form.value.examDate,
    regStartDate: formatPeriodDisplay(form.value.regStartDate, form.value.regStartTime),
    regEndDate: formatPeriodDisplay(form.value.regEndDate, form.value.regEndTime),
    payStartDate: formatPeriodDisplay(form.value.payStartDate, form.value.payStartTime),
    payEndDate: formatPeriodDisplay(form.value.payEndDate, form.value.payEndTime),
    scheduleText: buildScheduleText(),
  });

  /**
   * เปรียบเทียบ snapshot เดิมกับค่าปัจจุบัน แล้วสร้างรายการการเปลี่ยนแปลง
   * (เฉพาะฟิลด์ที่มีการเปลี่ยนแปลงจริง)
   */
  const buildExamChanges = (): ExamChangeItem[] => {
    const before = originalSnapshot.value;
    if (!before) return [];
    const after = buildComparisonSnapshot();
    const changes: ExamChangeItem[] = [];

    const push = (label: string, oldValue: string, newValue: string): void => {
      if (oldValue !== newValue) {
        changes.push({ label, oldValue, newValue });
      }
    };

    push('ชื่อรอบสอบ', before.examName, after.examName);
    push('ครั้งที่จัดสอบ', before.examRound, after.examRound);
    push('ปีงบประมาณ', before.examFiscalYear, after.examFiscalYear);
    push('ประเภทการสอบ', before.examType, after.examType);
    push('รูปแบบการสอบ', before.examFormat, after.examFormat);
    if (before.fee !== after.fee) {
      push('ค่าธรรมเนียม', `${before.fee} บาท`, `${after.fee} บาท`);
    }
    push('แหล่งทุน', before.fundSourceLabel, after.fundSourceLabel);
    push('วันที่สอบ', before.examDate, after.examDate);
    push('วันที่เริ่มรับสมัคร', before.regStartDate, after.regStartDate);
    push('วันที่สิ้นสุดรับสมัคร', before.regEndDate, after.regEndDate);
    push('วันที่เริ่มชำระเงิน', before.payStartDate, after.payStartDate);
    push('วันที่สิ้นสุดชำระเงิน', before.payEndDate, after.payEndDate);
    push('กำหนดการสอบและห้องสอบ', before.scheduleText, after.scheduleText);

    return changes;
  };

  const loadOccupancyInBackground = (): void => {
    void fetchAllExamsRaw()
      .then((exams) => {
        allExams.value = exams;
      })
      .catch((err) => {
        console.error('Failed to load exam occupancy data:', err);
      });
  };

  const loadInitialData = async (): Promise<void> => {
    isLoadingData.value = true;
    error.value = null;
    try {
      // Critical path: อย่ารอ GET /exam ทั้งก้อน — occupancy โหลด background หลังฟอร์มพร้อม
      const [locations, fundSources, scoreRubrics, proctors, editExam] = await Promise.all([
        fetchExamLocations(),
        fetchFundSources(),
        fetchScoreRubrics(),
        getUsersFromApi(ROLES.PROCTOR),
        examId ? fetchExamWithSeats(examId) : Promise.resolve(null),
      ]);
      locationOptions.value = locations;
      const activeFundSources = fundSources.filter((fs: FundSource) => fs.FS_OPEN_STATUS !== false);
      fundSourceOptions.value = activeFundSources.map((fs: FundSource) => ({
        label: `${fs.FS_NAME} (${fs.FS_ACCOUNT_CODE})`,
        value: fs.FS_ID,
      }));
      if (!examId && !form.value.srbId) {
        form.value.srbId = scoreRubrics.find((r) => r.isDefault)?.id ?? null;
      }
      proctorOptions.value = proctors.map((u) => {
        const displayName = u.fullNameTH ? `${u.titleTH || ''} ${u.fullNameTH}`.trim() : u.email;
        const finalName = displayName || 'ไม่ระบุชื่อ';
        return {
          label: finalName,
          value: finalName,
        };
      });

      // If in edit mode, load the existing exam data into the form
      if (editExam) {
        const exam = editExam;
        form.value.examName = exam.EXAM_NAME || '';
        const loadedRound = exam.EXAM_ROUND || '';
        const loadedFiscalYear = exam.EXAM_FISCAL_YEAR || '';
        // รองรับข้อมูลเก่ารูปแบบ "1/2569" ถ้ายังไม่ได้รัน migration แยกคอลัมน์
        if (!loadedFiscalYear && loadedRound.includes('/')) {
          const [roundPart, yearPart] = loadedRound.split('/', 2);
          form.value.examRound = roundPart?.trim() || '';
          form.value.examFiscalYear = yearPart?.trim() || '';
        } else {
          form.value.examRound = loadedRound;
          form.value.examFiscalYear = loadedFiscalYear;
        }
        form.value.examType = exam.EXAM_TYPE || EXAM_TYPE_GENERAL;
        form.value.examFormat = exam.EXAM_FORMAT || EXAM_FORMAT_COMPUTER;
        const feeNum = Number(exam.EXAM_FEE ?? 0);
        form.value.fee = Number.isFinite(feeNum) ? String(Math.round(feeNum)) : '0';
        form.value.isPublished = exam.EXAM_PUBLISHED ?? false;
        wasOriginallyPublished.value = exam.EXAM_PUBLISHED ?? false;
        form.value.examDate = gregorianToBuddhistDisplay(exam.EXAM_DATE);
        originalExamDate.value = form.value.examDate;
        form.value.regStartDate = gregorianToBuddhistDisplay(exam.EXAM_REG_START_DATE);
        form.value.regStartTime = timestampToHhMm(exam.EXAM_REG_START_DATE);
        form.value.regEndDate = gregorianToBuddhistDisplay(exam.EXAM_REG_END_DATE);
        form.value.regEndTime = timestampToHhMm(exam.EXAM_REG_END_DATE);
        form.value.payStartDate = gregorianToBuddhistDisplay(exam.EXAM_PAY_START_DATE);
        form.value.payStartTime = timestampToHhMm(exam.EXAM_PAY_START_DATE);
        form.value.payEndDate = gregorianToBuddhistDisplay(exam.EXAM_PAY_END_DATE);
        form.value.payEndTime = timestampToHhMm(exam.EXAM_PAY_END_DATE);
        form.value.fundSourceId = exam.FUND_SOURCE_ID ?? null;
        form.value.srbId = exam.SRB_ID ?? scoreRubrics.find((r) => r.isDefault)?.id ?? null;

        // Group sessions by time range into time slots with rooms
        if (exam.SESSIONS && exam.SESSIONS.length > 0) {
          const slotMap = new Map<string, TimeSlot>();
          const sessionsNeedingBlockedFallback = new Set<number>();

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
              const roomsWithLocation = relationLocations.filter((relation) => relation.LOCATION);
              roomsWithLocation.forEach((relation) => {
                const hasSeatSnapshot = (relation.SEATS_SNAPSHOT?.length ?? 0) > 0;
                if (!hasSeatSnapshot) {
                  sessionsNeedingBlockedFallback.add(session.SS_ID);
                }

                const relationProctors: string[] = [];
                if (relation.SS_NAME) {
                  const customNames = relation.SS_NAME.split(',')
                    .map((name) => name.trim())
                    .filter(Boolean);
                  relationProctors.push(...customNames);
                }
                const seatOverrides = Object.fromEntries(
                  (relation.SEATS_SNAPSHOT ?? [])
                    .map((snapshotSeat) => {
                      const baseSeat = relation.LOCATION.SEATS?.find(
                        (seat) => seat.LS_SEAT_LABEL === snapshotSeat.label,
                      );
                      const snapshotStatus = snapshotStatusToCode(snapshotSeat.status);
                      if (!baseSeat || baseSeat.LS_SEAT_STATUS === snapshotStatus) return null;

                      return [baseSeat.LS_ID, snapshotStatus] as const;
                    })
                    .filter((entry): entry is readonly [number, number] => entry !== null),
                );

                slot.rooms.push({
                  locationId: relation.LOCATION_ID ?? relation.LOCATION.LOCATION_ID ?? null,
                  proctorName: relation.SS_NAME || '',
                  proctors: Array.from(new Set(relationProctors)),
                  seats: resolveLoadedRoomSeats(
                    relation,
                    seatOverrides,
                    session.SS_CAPACITY,
                    roomsWithLocation.length,
                  ),
                  sessionId: session.SS_ID,
                  enrollmentCount:
                    session.ENROLLMENT_SL_COUNTS?.[String(relation.SL_ID)] ??
                    session.ENROLLMENTS?.filter((enrollment) => enrollment.SL_ID === relation.SL_ID)
                      .length ??
                    0,
                  seatOverrides,
                  sessionLocationSnapshot: {
                    TOTAL_ROWS:
                      relation.TOTAL_ROWS ?? relation.LOCATION.LOCATION_TOTAL_ROWS ?? null,
                    TOTAL_COLS:
                      relation.TOTAL_COLS ?? relation.LOCATION.LOCATION_TOTAL_COLS ?? null,
                    AISLE_AFTER: hasAisleAfter(relation.AISLE_AFTER)
                      ? relation.AISLE_AFTER
                      : getLocationAisleAfter(relation.LOCATION),
                    LOCATION_SEAT_DIRECTION:
                      relation.LOCATION_SEAT_DIRECTION ??
                      relation.LOCATION.LOCATION_SEAT_DIRECTION ??
                      relation.LOCATION.SEAT_DIRECTION ??
                      'HORIZONTAL',
                    LOCATION_SEAT_CAPACITY:
                      relation.LOCATION_SEAT_CAPACITY ??
                      (roomsWithLocation.length === 1 ? (session.SS_CAPACITY ?? null) : null),
                    SEATS_SNAPSHOT: relation.SEATS_SNAPSHOT ?? null,
                  },
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
              enrollmentCount: session.ACTIVE_ENROLLMENT_COUNT ?? session.ENROLLMENTS?.length ?? 0,
            });
            sessionsNeedingBlockedFallback.add(session.SS_ID);
          });

          form.value.timeSlots = Array.from(slotMap.values());
          sortTimeSlots();
          const blockedFallbackSessionIds = Array.from(sessionsNeedingBlockedFallback);
          if (blockedFallbackSessionIds.length > 0) {
            const blockedSeatGroups = await Promise.all(
              blockedFallbackSessionIds.map(async (sessionId) => ({
                sessionId,
                seats: await fetchExamBlockedSeats(sessionId),
              })),
            );

            blockedSeatGroups.forEach(({ sessionId, seats }) => {
              const sessionRooms = form.value.timeSlots.flatMap((slot) =>
                slot.rooms.filter((room) => room.sessionId === sessionId),
              );

              seats.forEach((blockedSeat) => {
                const locationId = blockedSeat.LOCATION_SEAT?.LOCATION_ID;
                const targetRoom =
                  sessionRooms.find((room) => room.locationId === locationId) ??
                  sessionRooms[0] ??
                  null;
                if (!targetRoom) return;

                targetRoom.seatOverrides = {
                  ...(targetRoom.seatOverrides ?? {}),
                  [blockedSeat.LS_ID]: blockedSeat.BLOCK_STATUS,
                };
                const targetLocation = getLocationById(targetRoom.locationId);
                if (targetLocation) {
                  const maxSeats = countAvailableSeats(targetLocation, targetRoom.seatOverrides);
                  if (targetRoom.seats > maxSeats) {
                    targetRoom.seats = maxSeats;
                  }
                }
              });
            });
          }
        }

        // Load passcodes into eligibleCandidates for special rounds
        if (exam.PASSCODES && exam.PASSCODES.length > 0) {
          form.value.eligibleCandidates = exam.PASSCODES.map((p, idx) => ({
            index: idx + 1,
            nationalId: p.NATIONAL_ID,
            fullName: p.FULL_NAME,
            passcode: p.PASSCODE,
          }));
          await resolveEligibleCandidatesInSystem();
        }

        // The schedule lock is now handled by the computed property 'isScheduleLocked'
        // based on exam.EXAM_PUBLISHED and session enrollment counts.

        // เก็บ snapshot ของข้อมูลรอบสอบหลังโหลดเสร็จ (options ถูกโหลดครบแล้ว)
        // เพื่อใช้เปรียบเทียบหาความเปลี่ยนแปลงตอนบันทึก
        originalSnapshot.value = buildComparisonSnapshot();
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
      // โหลด occupancy หลัง critical path เสร็จ — ไม่บล็อก TTI ของฟอร์ม
      loadOccupancyInBackground();
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

  const getLocationById = (locationId: number | null): BackendLocation | null => {
    if (locationId === null) return null;

    return locationOptions.value.find((location) => location.value === locationId)?.raw ?? null;
  };

  const getSeatStatusLabel = (status: number): 'AVAILABLE' | 'BROKEN' | 'BLOCKED' => {
    if (status === 1) return 'BROKEN';
    if (status === 2) return 'BLOCKED';

    return 'AVAILABLE';
  };

  const buildSessionLocationSnapshot = (
    location: BackendLocation,
    seatOverrides?: Record<number, number>,
    currentSnapshot?: SessionLocationSnapshotPayload,
    seatCapacity?: number,
  ): SessionLocationSnapshotPayload => {
    const direction =
      currentSnapshot?.LOCATION_SEAT_DIRECTION ??
      location.LOCATION_SEAT_DIRECTION ??
      location.SEAT_DIRECTION ??
      'HORIZONTAL';
    const maxAvailableSeats = countAvailableSeats(location, seatOverrides);
    const snapshotCapacity =
      seatCapacity != null ? Math.min(seatCapacity, maxAvailableSeats) : maxAvailableSeats;

    return {
      TOTAL_ROWS: currentSnapshot?.TOTAL_ROWS ?? location.LOCATION_TOTAL_ROWS ?? null,
      TOTAL_COLS: currentSnapshot?.TOTAL_COLS ?? location.LOCATION_TOTAL_COLS ?? null,
      AISLE_AFTER: hasAisleAfter(currentSnapshot?.AISLE_AFTER)
        ? currentSnapshot.AISLE_AFTER
        : getLocationAisleAfter(location),
      LOCATION_SEAT_DIRECTION: direction,
      LOCATION_SEAT_CAPACITY: snapshotCapacity,
      SEATS_SNAPSHOT: (location.SEATS ?? []).map((seat) => {
        const status = seatOverrides?.[seat.LS_ID] ?? seat.LS_SEAT_STATUS;

        return {
          label: seat.LS_SEAT_LABEL,
          status: getSeatStatusLabel(status),
          sortorder: seat.LS_SORT_ORDER ?? null,
        };
      }),
    };
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
  const notifyEligibleCandidatesLocked = (): void => {
    $q.notify({
      type: 'warning',
      message: 'ไม่สามารถแก้ไขรายชื่อผู้มีสิทธิ์สอบได้ เนื่องจากมีผู้ลงทะเบียนในรอบสอบนี้แล้ว',
      position: 'top',
    });
  };

  const resolveEligibleCandidatesInSystem = async (): Promise<void> => {
    const candidates = form.value.eligibleCandidates;
    const identifiers = candidates
      .map((candidate) => getEligibleCandidateKey(candidate))
      .filter((identifier): identifier is string => Boolean(identifier));

    if (identifiers.length === 0) {
      return;
    }

    try {
      const statusMap = await checkUserIdentifiers(identifiers);
      form.value.eligibleCandidates = candidates.map((candidate) => {
        const key = getEligibleCandidateKey(candidate);
        if (!key) {
          return { ...candidate, inSystem: false };
        }
        return { ...candidate, inSystem: statusMap[key] ?? false };
      });
    } catch (err) {
      console.error('Failed to check candidate identifiers:', err);
      form.value.eligibleCandidates = candidates.map((candidate) => ({
        ...candidate,
        inSystem: candidate.inSystem ?? false,
      }));
    }
  };

  const importCandidates = (file?: File): void => {
    try {
      if (isEligibleCandidatesLocked.value) {
        notifyEligibleCandidatesLocked();
        return;
      }
      if (!file) return;
      isImportingCandidates.value = true;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawText = e.target?.result as string;
          const text = stripBom(rawText);
          const rows = parseCsvRows(text);

          if (rows.length < 2) {
            $q.notify({
              type: 'warning',
              message: 'ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย header + 1 แถว)',
            });
            isImportingCandidates.value = false;
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
              isImportingCandidates.value = false;
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
            isImportingCandidates.value = false;
            return;
          }

          form.value.eligibleCandidates = candidates;
          await resolveEligibleCandidatesInSystem();
          $q.notify({
            type: 'positive',
            message: `นำเข้าข้อมูลรายชื่อสำเร็จ ${candidates.length} รายการ`,
          });
        } catch {
          $q.notify({ type: 'negative', message: 'รูปแบบไฟล์ไม่ถูกต้อง' });
        } finally {
          isImportingCandidates.value = false;
        }
      };
      reader.readAsText(file, 'UTF-8');
    } catch {
      isImportingCandidates.value = false;
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
    if (isEligibleCandidatesLocked.value) {
      notifyEligibleCandidatesLocked();
      return;
    }

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

  /** Add a system user to the eligible candidates list */
  const tryAddEligibleCandidateFromUser = (user: User): boolean => {
    const nationalId = user.nationalId?.trim() || undefined;
    const passportNo = user.passportNo?.trim() || undefined;

    if (!nationalId && !passportNo) {
      return false;
    }

    const key = nationalId || passportNo || '';
    if (existingCandidateKeys.value.includes(key)) {
      return false;
    }

    form.value.eligibleCandidates.push({
      nationalId: nationalId || undefined,
      passportNo: nationalId ? undefined : passportNo,
      fullName: user.fullNameTH?.trim() || undefined,
      fullNameEn: user.fullNameEN?.trim() || undefined,
      passcode: '',
      inSystem: true,
    });

    return true;
  };

  const addEligibleCandidatesFromUsers = (users: User[]): void => {
    if (isEligibleCandidatesLocked.value) {
      notifyEligibleCandidatesLocked();
      return;
    }

    if (users.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'ยังไม่ได้เลือกผู้สมัคร',
        position: 'top',
      });
      return;
    }

    let added = 0;
    let skipped = 0;

    for (const user of users) {
      if (tryAddEligibleCandidateFromUser(user)) {
        added += 1;
      } else {
        skipped += 1;
      }
    }

    if (added === 0) {
      $q.notify({
        type: 'warning',
        message: 'ไม่สามารถเพิ่มผู้สมัครที่เลือกได้',
        position: 'top',
      });
      return;
    }

    const skippedText = skipped > 0 ? ` (ข้าม ${skipped} รายการ)` : '';
    $q.notify({
      type: 'positive',
      message: `เพิ่มผู้สมัครในรายชื่อแล้ว ${added} รายการ${skippedText}`,
      position: 'top',
      timeout: 2500,
    });
  };

  /** Remove selected eligible candidates from the list */
  const removeEligibleCandidates = (keys: string[]): void => {
    if (isEligibleCandidatesLocked.value) {
      notifyEligibleCandidatesLocked();
      return;
    }

    if (keys.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'ยังไม่ได้เลือกรายชื่อที่จะลบ',
        position: 'top',
      });
      return;
    }

    const keysToRemove = new Set(keys);
    const beforeCount = form.value.eligibleCandidates.length;
    form.value.eligibleCandidates = form.value.eligibleCandidates.filter(
      (candidate) => !keysToRemove.has(getEligibleCandidateKey(candidate)),
    );
    const removedCount = beforeCount - form.value.eligibleCandidates.length;

    if (removedCount === 0) {
      $q.notify({
        type: 'warning',
        message: 'ไม่พบรายชื่อที่จะลบ',
        position: 'top',
      });
      return;
    }

    if (form.value.eligibleCandidates.length === 0) {
      candidateSearch.value = '';
    }

    $q.notify({
      type: 'positive',
      message: `ลบรายชื่อผู้มีสิทธิ์สอบแล้ว ${removedCount} รายการ`,
      position: 'top',
      timeout: 2500,
    });
  };

  const handleCancel = (): void => {
    void router.push({ name: 'admin-exam-management' });
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
    seatOverrides?: Record<number, number>;
    sessionLocationSnapshot?: SessionLocationSnapshotPayload;
  }[] => {
    const result: {
      startTime: string;
      endTime: string;
      locationId: number;
      seats: number;
      proctorName: string | null;
      sessionId?: number;
      seatOverrides?: Record<number, number>;
      sessionLocationSnapshot?: SessionLocationSnapshotPayload;
    }[] = [];

    form.value.timeSlots.forEach((slot) => {
      if (!slot.startTime || !slot.endTime) return;
      slot.rooms.forEach((room) => {
        const location = getLocationById(room.locationId);
        const maxAvailableSeats = location
          ? countAvailableSeats(location, room.seatOverrides)
          : Number(room.seats);
        const seats = Math.min(Number(room.seats), maxAvailableSeats);
        const proctorName =
          room.proctors && room.proctors.length > 0 ? room.proctors.join(', ') : null;
        result.push({
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          locationId: Number(room.locationId),
          seats,
          proctorName,
          ...(room.sessionId != null ? { sessionId: room.sessionId } : {}),
          ...(room.seatOverrides ? { seatOverrides: { ...room.seatOverrides } } : {}),
          ...(location
            ? {
                sessionLocationSnapshot: buildSessionLocationSnapshot(
                  location,
                  room.seatOverrides,
                  room.sessionLocationSnapshot,
                  seats,
                ),
              }
            : {}),
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
    if (isLoadingData.value || isSaving.value) {
      return false;
    }

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

    if (!form.value.srbId) {
      $q.notify({
        type: 'warning',
        message: VALIDATION_MSG.SCORE_RUBRIC,
        position: 'top',
      });
      return false;
    }

    // === DATE LOGICAL VALIDATION ===
    const todayVal = dateToCompareValue(today);
    const regStartVal = datetimeToCompareValue(form.value.regStartDate, form.value.regStartTime);
    const regEndVal = datetimeToCompareValue(form.value.regEndDate, form.value.regEndTime);
    const payStartVal = datetimeToCompareValue(form.value.payStartDate, form.value.payStartTime);
    const payEndVal = datetimeToCompareValue(form.value.payEndDate, form.value.payEndTime);
    const examVal = examDatetimeCompareValue();
    const examDateOnlyVal = dateToCompareValue(form.value.examDate);

    // 1. วัน/เวลาเริ่มต้นลงทะเบียนต้องไม่เป็นอดีต (เฉพาะกรณีสร้างใหม่)
    if (!isEditMode.value && regStartVal < nowDatetimeCompareValue()) {
      $q.notify({
        type: 'warning',
        message: 'วันและเวลาเริ่มต้นลงทะเบียนต้องไม่เป็นอดีต',
        position: 'top',
      });
      return false;
    }

    // 2. วัน/เวลาสิ้นสุดการลงทะเบียนต้องไม่มาก่อนวัน/เวลาเริ่มต้น
    if (regEndVal < regStartVal) {
      $q.notify({
        type: 'warning',
        message: 'วันและเวลาสิ้นสุดการลงทะเบียนต้องไม่มาก่อนวันและเวลาเริ่มต้นลงทะเบียน',
        position: 'top',
      });
      return false;
    }

    // 3–4. ช่วงชำระเงิน (รอบทั่วไป)
    if (!isSpecialRound.value) {
      if (payStartVal < regStartVal) {
        $q.notify({
          type: 'warning',
          message: 'วันและเวลาเริ่มต้นชำระเงินต้องไม่มาก่อนวันและเวลาเริ่มต้นลงทะเบียน',
          position: 'top',
        });
        return false;
      }
      if (payEndVal < payStartVal) {
        $q.notify({
          type: 'warning',
          message: 'วันและเวลาสิ้นสุดการชำระเงินต้องไม่มาก่อนวันและเวลาเริ่มต้นชำระเงิน',
          position: 'top',
        });
        return false;
      }
    }

    // 5. วัน/เวลาสอบต้องไม่มาก่อนวัน/เวลาสิ้นสุดการลงทะเบียน
    if (examVal < regEndVal) {
      $q.notify({
        type: 'warning',
        message: 'วันและเวลาสอบต้องไม่มาก่อนวันและเวลาสิ้นสุดการลงทะเบียน',
        position: 'top',
      });
      return false;
    }

    // 6. วัน/เวลาสอบต้องไม่มาก่อนวัน/เวลาสิ้นสุดการชำระเงิน (รอบทั่วไป)
    if (!isSpecialRound.value && examVal < payEndVal) {
      $q.notify({
        type: 'warning',
        message: 'วันและเวลาสอบต้องไม่มาก่อนวันและเวลาสิ้นสุดการชำระเงิน',
        position: 'top',
      });
      return false;
    }

    // 7. วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว (เฉพาะกรณีสร้างใหม่ หรือมีการแก้ไขวันที่สอบ)
    const isExamDateChanged = !isEditMode.value || form.value.examDate !== originalExamDate.value;
    if (examDateOnlyVal < todayVal && isExamDateChanged) {
      $q.notify({
        type: 'warning',
        message: 'วันที่สอบต้องไม่เป็นวันที่ผ่านไปแล้ว',
        position: 'top',
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
      ...(r.seatOverrides ? { seatOverrides: r.seatOverrides } : {}),
      ...(r.sessionLocationSnapshot ? { sessionLocationSnapshot: r.sessionLocationSnapshot } : {}),
    }));

    isSaving.value = true;
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
          regStartTime: form.value.regStartTime,
          regEndDate: form.value.regEndDate,
          regEndTime: form.value.regEndTime,
          payStartDate: form.value.payStartDate,
          payStartTime: form.value.payStartTime,
          payEndDate: form.value.payEndDate,
          payEndTime: form.value.payEndTime,
          timeRanges,
          fundSourceId: Number(form.value.fundSourceId || 0),
          srbId: Number(form.value.srbId),
          examRound: form.value.examRound,
          examFiscalYear: form.value.examFiscalYear,
          existingSessionIds,
        });

        $q.notify({
          type: 'positive',
          message: NOTIFY_MSG.UPDATE_SUCCESS,
          position: 'top',
          timeout: 2000,
        });

        // แจ้งเตือนผู้เข้าสอบทุกคนในรอบสอบทางอีเมล เมื่อเจ้าหน้าที่ทะเบียน (registration officer)
        // แก้ไขรอบสอบ โดยส่งเฉพาะรายละเอียดที่มีการเปลี่ยนแปลงจริง
        // ยิงแบบไม่บล็อก (fire-and-forget) เพื่อให้การบันทึกลื่นไหล ไม่ต้องรอการส่งอีเมล
        if (userStore.userRole === ROLES.REGISTRATION_OFFICER) {
          const changes = buildExamChanges();
          if (changes.length > 0) {
            void notifyExamChanges(examId, changes).catch((notifyErr) => {
              console.error('Failed to notify exam changes:', notifyErr);
            });
          }
        }
      } else {
        // === CREATE MODE ===
        const payload: CreateExamPayload = {
          examName: combinedExamName,
          locationId: flatRooms[0]?.locationId || 0,
          examType: form.value.examType,
          examFormat: form.value.examFormat,
          fee: form.value.fee === '' ? 0 : form.value.fee,
          seats: flatRooms[0]?.seats || 1,
          isPublished: form.value.isPublished,
          examDate: form.value.examDate,
          regStartDate: form.value.regStartDate,
          regStartTime: form.value.regStartTime,
          regEndDate: form.value.regEndDate,
          regEndTime: form.value.regEndTime,
          payStartDate: form.value.payStartDate,
          payStartTime: form.value.payStartTime,
          payEndDate: form.value.payEndDate,
          payEndTime: form.value.payEndTime,
          timeRanges,
          fundSourceId: form.value.fundSourceId,
          srbId: Number(form.value.srbId),
          examRound: form.value.examRound,
          examFiscalYear: form.value.examFiscalYear,
        };

        targetExamId = await examStore.addExamRound(payload);

        $q.notify({
          type: 'positive',
          message: NOTIFY_MSG.CREATE_SUCCESS,
          position: 'top',
          timeout: 2000,
        });
      }

      // Passcode sync แยกจาก exam update — ถ้า fail ยังต้อง redirect เพราะรอบสอบบันทึกแล้ว
      // ถ้ารายชื่อถูกล็อกเพราะมีผู้ลงทะเบียนแล้ว จะไม่เรียก API แทนที่ passcodes
      if (
        targetExamId &&
        form.value.examType === EXAM_TYPE_SPECIAL &&
        form.value.eligibleCandidates.length > 0 &&
        !isEligibleCandidatesLocked.value
      ) {
        try {
          const passcodesPayload = form.value.eligibleCandidates.map((c) => ({
            nationalId: c.nationalId ?? undefined,
            passportNo: c.passportNo ?? undefined,
            fullName: c.fullName ?? undefined,
            fullNameEn: c.fullNameEn ?? undefined,
            passcode: c.passcode,
          }));
          await createExamPasscodes(targetExamId, passcodesPayload);
        } catch (passcodeErr) {
          console.error('Passcode save error:', passcodeErr);
          const passcodeErrorObj = passcodeErr as {
            response?: { data?: { message?: string | string[] } };
            message?: string;
          };
          const passcodeBackendMsg = passcodeErrorObj.response?.data?.message;
          const passcodeDetailedMsg = Array.isArray(passcodeBackendMsg)
            ? passcodeBackendMsg.join(', ')
            : passcodeBackendMsg || passcodeErrorObj.message;
          $q.notify({
            type: 'warning',
            message: passcodeDetailedMsg
              ? `บันทึกรอบสอบสำเร็จ แต่บันทึกรหัสผ่านผู้มีสิทธิ์สอบไม่สำเร็จ: ${passcodeDetailedMsg}`
              : 'บันทึกรอบสอบสำเร็จ แต่บันทึกรหัสผ่านผู้มีสิทธิ์สอบไม่สำเร็จ',
            position: 'top',
            timeout: 4000,
          });
        }
      }

      isSaving.value = false;
      await router.push({ name: 'admin-exam-management' });
      return true;
    } catch (err) {
      console.error('Save error:', err);
      const errorObj = err as {
        code?: string;
        response?: {
          data?: {
            message?: string | string[];
          };
        };
        message?: string;
      };
      const isTimeout =
        errorObj.code === 'ECONNABORTED' ||
        (typeof errorObj.message === 'string' &&
          errorObj.message.toLowerCase().includes('timeout'));
      if (isTimeout) {
        const timeoutMsg = 'การบันทึกรอบสอบใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
        error.value = timeoutMsg;
        $q.notify({
          type: 'negative',
          message: timeoutMsg,
          position: 'top',
        });
        return false;
      }
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
    } finally {
      isSaving.value = false;
    }
  };

  return {
    form,
    examTypeOptions,
    examFormatOptions,
    proctorOptions,
    locationOptions,
    fundSourceOptions,
    getOccupiedLocationIdsForSlot,
    isLoadingData,
    isSaving,
    isImportingCandidates,
    error,
    isEditMode,
    isPublishedSectionLocked,
    isScheduleLocked,
    isLockedByEnrollment,
    isEligibleCandidatesLocked,
    isSpecialRound,
    wasOriginallyPublished,
    activeSlotIndex,
    candidateSearch,
    filteredCandidates,
    existingCandidateKeys,
    hasEligibleCandidates,
    fieldErrors,
    shakeKey,
    loadInitialData,
    removeTimeSlot,
    addRoom,
    removeRoom,
    importCandidates,
    addEligibleCandidatesFromUsers,
    removeEligibleCandidates,
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
