import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { BackendBlockedSeat, BackendExam, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamBlockedSeats, fetchExamWithSeats } from 'src/services/exam.service';
import {
  bulkAssignEnrollmentSeats,
  fetchRawEnrollmentsByExamId,
} from 'src/services/enrollment.service';
import { DEFAULT_EXAM_TITLE } from 'src/constants/exam';
import { formatThaiLongDate } from 'src/utils/thai-date';
import { getImageUrl } from 'src/services/image.service';
import { fetchLatestProfileHistoryImages } from 'src/services/profile-edit-history.service';
import { useExamSeatNavigation } from 'src/composables/use-exam-seat-navigation';
import { getPhysicalStatusBgColor } from 'src/constants/physical-status';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';

/** Enrollment status codes shared with the backend */
const STATUS_PAID = 1;
const STATUS_SEAT_ASSIGNED = 2;
const STATUS_SEAT_PUBLISHED = 3;

/** HTML5 DnD mime used when dragging an unassigned student from the list onto a seat */
export const SEAT_STUDENT_DRAG_MIME = 'application/x-buu-seat-student';

const PHYSICAL_STATUS_REMARKS: Record<number, string> = {
  0: 'พระภิกษุ / นักบวช',
  2: 'บุคคลทุพพลภาพ',
  3: 'ผู้ตั้งครรภ์',
  4: 'ผู้พิการรณ์',
};

/** ประเภทผู้สมัครที่ใช้กรองรายชื่อ เรียงตามลำดับการจัดที่นั่ง */
const APPLICANT_TYPE_REMARKS = [...Object.values(PHYSICAL_STATUS_REMARKS), 'ชาวต่างชาติ', 'ชาวไทย'];

export type SeatStatus = 'available' | 'assigned' | 'broken' | 'blocked';

export interface SeatCell {
  id: string;
  label: string;
  status: SeatStatus;
  rowNo: number;
  colNo: number;
  student: StudentSeatInfo | null;
}

export interface StudentSeatInfo {
  ermId: number;
  sessionId: number;
  id: string;
  name: string;
  seat: string | null;
  sessionLocationId: number | null;
  avatar: string | null;
  remark: string;
  /** สีพื้นหลังตามประเภทผู้เข้าสอบ */
  bgColor: string;
  isForeigner: boolean;
  titleEn: string | null;
  sortName: string;
  /**
   * Seat-assignment priority (lower = seated first):
   * 0 พระภิกษุ/นักบวช, 2 บุคคลทุพพลภาพ,
   * 3 ผู้ตั้งครรภ์, 4 ผู้พิการ, then within ทั่วไป (code 5):
   * 5 ชาวต่างชาติ (มี passport), 6 คนไทย (ท้ายสุด)
   */
  priority: number;
}

export interface SessionLocationOption {
  label: string;
  value: number;
}

interface SeatSessionLocation {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
  SS_NAME?: string | null;
  TOTAL_ROWS?: number | null;
  TOTAL_COLS?: number | null;
  AISLE_AFTER?: { after_cols: number[]; after_rows: number[] } | null;
  LOCATION_SEAT_CAPACITY?: number | null;
  SEATS_SNAPSHOT?: SessionSnapshotSeat[] | null;
  LOCATION: NonNullable<BackendSession['LOCATION']>;
}

interface UsableSeatAssignment {
  seatId: string;
  sessionLocationId: number;
}

interface SeatLabelOrderItem {
  LS_SEAT_LABEL?: string | null;
  LS_ROW_NO: number;
  LS_COL_NO: number;
  LS_SORT_ORDER?: number | null;
}

interface SessionSnapshotSeat {
  label: string | null;
  status: 'AVAILABLE' | 'BROKEN' | 'BLOCKED';
  sortorder: number | null;
}

interface SessionSeatItem extends SeatLabelOrderItem {
  LS_ID: number;
  LS_SEAT_LABEL: string | null;
  LS_SEAT_STATUS: number;
}

interface EnrollmentSeatAssignment {
  enrollment: BackendEnrollmentDetail;
  sessionLocationId: number;
  seatLabel: string;
  sortOrder?: number;
}

/**
 * Composable for the "จัดการที่นั่งสอบ" page.
 * Owns exam/session/enrollment loading, the student list, the seat grid
 * and the custom drag-and-drop seat-assignment interaction.
 */
export function useExamSeatManagement() {
  const route = useRoute();
  const router = useRouter();
  const { isSeatEditingLocked } = useExamSeatNavigation();
  const $q = useQuasar();
  const { t } = useI18n();

  const examId = Number(route.params.examId);

  // ── State ────────────────────────────────────────────────
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const activeSessionId = ref<number | null>(null);
  const activeSessionLocationId = ref<number | null>(null);
  const sessions = ref<BackendSession[]>([]);
  const examData = ref<BackendExam | null>(null);
  const allEnrollments = ref<BackendEnrollmentDetail[]>([]);
  const latestProfileHistoryImageById = ref<Record<number, string>>({});
  const students = ref<StudentSeatInfo[]>([]);
  const seatDraftsByTime = new Map<string, StudentSeatInfo[]>();
  /** Time keys where the user already answered rearrange-vs-keep for new applicants */
  const placementChoiceResolvedByTime = new Set<string>();
  const showPlacementChoiceDialog = ref(false);
  const blockedSeatsBySessionId = ref<Record<number, BackendBlockedSeat[]>>({});
  const searchQuery = ref('');
  const applicantTypeFilter = ref<string[]>([]);
  const hasLoadedEnrollments = ref(false);

  const applicantTypeOptions = computed(() =>
    APPLICANT_TYPE_REMARKS.map((remark) => ({ label: remark, value: remark })),
  );

  // clearable ของ q-select อาจส่ง null แทน []
  watch(applicantTypeFilter, (value) => {
    if (!Array.isArray(value)) {
      applicantTypeFilter.value = [];
    }
  });

  // ── Computed: exam / session info ────────────────────────
  const activeSession = computed((): BackendSession | null => {
    return sessions.value.find((s) => s.SS_ID === activeSessionId.value) ?? null;
  });

  const getSessionTimeKey = (session: BackendSession): string => {
    return `${session.SS_START_TIME || ''}-${session.SS_END_TIME || ''}`;
  };

  const cloneStudents = (source: StudentSeatInfo[]): StudentSeatInfo[] =>
    source.map((student) => ({ ...student }));

  const saveSeatDraft = (sessionId: number | null, source: StudentSeatInfo[]): void => {
    if (sessionId === null) return;
    const session = sessions.value.find((item) => item.SS_ID === sessionId);
    if (!session) return;
    seatDraftsByTime.set(getSessionTimeKey(session), cloneStudents(source));
  };

  const sessionTimeTabs = computed<BackendSession[]>(() => {
    const seen = new Set<string>();
    return [...sessions.value]
      .sort((left, right) => {
        const startTimeComparison = (left.SS_START_TIME || '').localeCompare(
          right.SS_START_TIME || '',
        );
        if (startTimeComparison !== 0) return startTimeComparison;

        return (left.SS_END_TIME || '').localeCompare(right.SS_END_TIME || '');
      })
      .filter((session) => {
        const key = getSessionTimeKey(session);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  });

  const activeTimeSessions = computed<BackendSession[]>(() => {
    if (!activeSession.value) return [];
    const activeKey = getSessionTimeKey(activeSession.value);
    return sessions.value.filter((session) => getSessionTimeKey(session) === activeKey);
  });

  const activeSessionIds = computed(() => activeTimeSessions.value.map((session) => session.SS_ID));

  const sessionLocations = computed<SeatSessionLocation[]>(() => {
    return activeTimeSessions.value.flatMap((session) => {
      const relationLocations = session.SESSION_LOCATIONS || [];
      if (relationLocations.length > 0) {
        return relationLocations
          .filter((item) => item.LOCATION)
          .map((item) => ({ ...item, SS_ID: item.SS_ID || session.SS_ID }));
      }

      if (!session.LOCATION) return [];
      return [
        {
          SL_ID: -session.SS_ID,
          LOCATION_ID: session.LOCATION.LOCATION_ID,
          SS_ID: session.SS_ID,
          LOCATION: session.LOCATION,
        },
      ];
    });
  });

  const roomOptions = computed<SessionLocationOption[]>(() =>
    sessionLocations.value.map((item) => ({
      value: item.SL_ID,
      label: `${item.LOCATION.LOCATION_NAME}${item.LOCATION.LOCATION_ROOM_NO ? ` (${item.LOCATION.LOCATION_ROOM_NO})` : ''}`,
    })),
  );

  const activeSessionLocation = computed(() => {
    return (
      sessionLocations.value.find((item) => item.SL_ID === activeSessionLocationId.value) ?? null
    );
  });

  const activeLocation = computed(() => {
    return activeSessionLocation.value?.LOCATION ?? activeSession.value?.LOCATION ?? null;
  });

  const examTitle = computed((): string => {
    const baseTitle =
      formatExamDisplayTitle(
        examData.value?.EXAM_NAME,
        examData.value?.EXAM_ROUND,
        examData.value?.EXAM_FISCAL_YEAR,
      ) ||
      examData.value?.EXAM_NAME ||
      DEFAULT_EXAM_TITLE;
    const supervisorNamesList: string[] = [];

    // Include supervisors from SS_NAME if present
    const ssName = activeSessionLocation.value?.SS_NAME;
    if (ssName) {
      const customNames = ssName
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      supervisorNamesList.push(...customNames);
    }

    if (supervisorNamesList.length > 0) {
      return `${baseTitle} (${supervisorNamesList.join(', ')})`;
    }
    return baseTitle;
  });

  // Resolves a localized month name by 0-based index from i18n (type-safe, no cast)
  const getMonthName = (monthIndex: number): string => t(`common.months[${monthIndex}]`);

  const examDate = computed((): string => {
    if (!examData.value?.EXAM_DATE) return '-';
    return formatThaiLongDate(examData.value.EXAM_DATE, getMonthName);
  });

  const sessionTime = computed((): string => {
    if (!activeSession.value) return '-';
    const extractTime = (timeStr: string | null | undefined): string => {
      if (!timeStr) return '';
      const str = String(timeStr).trim();
      const match = str.match(/(\d{2}:\d{2})/);
      return match && match[1] ? match[1] : str.substring(0, 5);
    };
    const startTime = extractTime(activeSession.value.SS_START_TIME) || '00:00';
    const endTime = extractTime(activeSession.value.SS_END_TIME) || '00:00';
    return `${startTime}-${endTime}`;
  });

  const sessionLocation = computed((): string => {
    if (!activeLocation.value) return '-';
    const loc = activeLocation.value;
    return `${loc.LOCATION_NAME} ${loc.LOCATION_ROOM_NO ? `(${loc.LOCATION_ROOM_NO})` : ''}`;
  });

  const sessionTotalCapacity = computed((): number => {
    const totalSeats = sessionLocations.value.reduce(
      (sum, sessionLocation) => sum + buildSessionSeatItems(sessionLocation).length,
      0,
    );
    if (totalSeats > 0) return totalSeats;

    return activeTimeSessions.value.reduce((sum, session) => sum + (session.SS_CAPACITY || 0), 0);
  });

  const sessionEnrollments = computed((): BackendEnrollmentDetail[] => {
    return allEnrollments.value.filter((e) => activeSessionIds.value.includes(e.SESSION_ID));
  });

  // Total applicants who have PAID (PAID, SEAT_ASSIGNED, or SEAT_PUBLISHED)
  const getSeatLabel = (seatId: string | null | undefined): string | null => {
    if (!seatId) return null;

    const seat = activeSessionSeatById.value.get(seatId);
    return seat?.LS_SEAT_LABEL || seatId;
  };

  const getSeatLabelOrderParts = (
    label: string | null | undefined,
  ): { letterOrder: number; numberOrder: number } | null => {
    const match = label
      ?.trim()
      .toUpperCase()
      .match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const letters = match[1] ?? '';
    const numberOrder = Number(match[2]);
    if (!Number.isInteger(numberOrder)) return null;

    const letterOrder = letters.split('').reduce((total, letter) => {
      return total * 26 + (letter.charCodeAt(0) - 64);
    }, 0);

    return { letterOrder, numberOrder };
  };

  const compareSeatsByLabelOrder = (a: SeatLabelOrderItem, b: SeatLabelOrderItem): number => {
    if (a.LS_SORT_ORDER != null && b.LS_SORT_ORDER != null) {
      const sortOrderDiff = a.LS_SORT_ORDER - b.LS_SORT_ORDER;
      if (sortOrderDiff !== 0) return sortOrderDiff;
    }
    if (a.LS_SORT_ORDER != null && b.LS_SORT_ORDER == null) return -1;
    if (a.LS_SORT_ORDER == null && b.LS_SORT_ORDER != null) return 1;

    const aLabelOrder = getSeatLabelOrderParts(a.LS_SEAT_LABEL);
    const bLabelOrder = getSeatLabelOrderParts(b.LS_SEAT_LABEL);

    if (aLabelOrder && bLabelOrder) {
      const letterDiff = aLabelOrder.letterOrder - bLabelOrder.letterOrder;
      if (letterDiff !== 0) return letterDiff;

      const numberDiff = aLabelOrder.numberOrder - bLabelOrder.numberOrder;
      if (numberDiff !== 0) return numberDiff;
    }

    if (aLabelOrder && !bLabelOrder) return -1;
    if (!aLabelOrder && bLabelOrder) return 1;

    return a.LS_ROW_NO - b.LS_ROW_NO || a.LS_COL_NO - b.LS_COL_NO;
  };

  const snapshotStatusToSeatCode = (status: string | null | undefined): number => {
    if (status === 'BROKEN') return 1;
    if (status === 'BLOCKED') return 2;

    return 0;
  };

  const getLocationAisleAfter = (
    location: NonNullable<BackendSession['LOCATION']>,
  ): { after_cols: number[]; after_rows: number[] } => {
    const combined = location.LOCATION_AISLE_AFTER_COL ?? [];

    return {
      after_cols: [
        ...(location.AISLE_AFTER_COLS ?? []),
        ...combined
          .filter((item): item is { type: 'column'; index: number } => {
            return typeof item === 'object' && item.type === 'column';
          })
          .map((item) => item.index),
        ...combined.filter((item): item is number => typeof item === 'number'),
      ],
      after_rows: [
        ...(location.AISLE_AFTER_ROWS ?? []),
        ...combined
          .filter((item): item is { type: 'row'; index: number } => {
            return typeof item === 'object' && item.type === 'row';
          })
          .map((item) => item.index),
      ],
    };
  };

  const getBlockedSeatsForSessionLocation = (
    sessionLocation: SeatSessionLocation,
  ): BackendBlockedSeat[] => {
    const seatIds = new Set((sessionLocation.LOCATION.SEATS ?? []).map((seat) => seat.LS_ID));

    return (blockedSeatsBySessionId.value[sessionLocation.SS_ID] ?? []).filter((seat) => {
      if (!seatIds.has(seat.LS_ID)) return false;
      const blockedLocationId = seat.LOCATION_SEAT?.LOCATION_ID;
      return blockedLocationId == null || blockedLocationId === sessionLocation.LOCATION_ID;
    });
  };

  const buildSessionSeatItems = (sessionLocation: SeatSessionLocation): SessionSeatItem[] => {
    const baseSeats = [...(sessionLocation.LOCATION.SEATS ?? [])];
    const snapshotByLabel = new Map(
      (sessionLocation.SEATS_SNAPSHOT ?? [])
        .filter((seat) => seat.label)
        .map((seat) => [seat.label as string, seat]),
    );
    const blockedStatusBySeatId = new Map(
      getBlockedSeatsForSessionLocation(sessionLocation).map((seat) => [
        seat.LS_ID,
        seat.BLOCK_STATUS,
      ]),
    );

    return baseSeats.map((seat) => {
      const snapshotSeat = seat.LS_SEAT_LABEL ? snapshotByLabel.get(seat.LS_SEAT_LABEL) : undefined;
      const snapshotStatus = snapshotSeat
        ? snapshotStatusToSeatCode(snapshotSeat.status)
        : seat.LS_SEAT_STATUS;
      const status = blockedStatusBySeatId.get(seat.LS_ID) ?? snapshotStatus;

      return {
        LS_ID: seat.LS_ID,
        LS_ROW_NO: seat.LS_ROW_NO,
        LS_COL_NO: seat.LS_COL_NO,
        LS_SEAT_LABEL: seat.LS_SEAT_LABEL,
        LS_SEAT_STATUS: status,
        LS_SORT_ORDER: snapshotSeat?.sortorder ?? seat.LS_SORT_ORDER ?? null,
      };
    });
  };

  const activeSessionSeatItems = computed<SessionSeatItem[]>(() => {
    const selectedSessionLocation = activeSessionLocation.value;
    return selectedSessionLocation ? buildSessionSeatItems(selectedSessionLocation) : [];
  });

  const activeSessionSeatById = computed((): Map<string, SessionSeatItem> => {
    return new Map(activeSessionSeatItems.value.map((seat) => [String(seat.LS_ID), seat]));
  });

  const PHYSICAL_STATUS_LABEL_TO_CODE: Record<string, number> = {
    'พระภิกษุ / นักบวช': 0,
    'พระภิกษุ/นักบวช': 0,
    'พระภิกษุ / สามเณร': 0,
    'นักบวช / ศาสนบุคคล': 0,
    บุคคลทุพพลภาพ: 2,
    ผู้ตั้งครรภ์: 3,
    ผู้พิการรณ์: 4,
    ทั่วไป: 5,
  };

  const normalizePhysicalStatusCode = (
    value: string | number | null | undefined,
  ): number | null => {
    if (value === null || value === undefined || value === '') return null;

    const numericValue = Number(value);
    if (Number.isInteger(numericValue)) {
      // legacy code 1 (นักบวช / ศาสนบุคคล) → รวมเป็น 0
      return numericValue === 1 ? 0 : numericValue;
    }

    return PHYSICAL_STATUS_LABEL_TO_CODE[String(value).trim()] ?? null;
  };

  const hasPassport = (passportNo: string | null | undefined): boolean => {
    return Boolean(passportNo?.trim());
  };

  const getEnrollmentRemarkInfo = (
    enrollment: BackendEnrollmentDetail,
  ): { remark: string; isForeigner: boolean } => {
    const physicalStatusCode = normalizePhysicalStatusCode(enrollment.ERM_PHYSICAL_STATUS);

    if (physicalStatusCode !== null && physicalStatusCode in PHYSICAL_STATUS_REMARKS) {
      return {
        remark: PHYSICAL_STATUS_REMARKS[physicalStatusCode] ?? '',
        isForeigner: false,
      };
    }

    const isGeneralStatus = physicalStatusCode === null || physicalStatusCode === 5;
    const isForeigner = isGeneralStatus && hasPassport(enrollment.USER?.USER_PASSPORT_NO);

    return {
      remark: isForeigner ? 'ชาวต่างชาติ' : 'ชาวไทย',
      isForeigner,
    };
  };

  /**
   * Resolves the seat-assignment priority for an enrollment.
   * Physical-status codes 0–4 keep their own order;
   * ทั่วไป (code 5) is split so ชาวต่างชาติ (มี passport) are seated before คนไทย.
   */
  const getSeatPriority = (enrollment: BackendEnrollmentDetail, isForeigner: boolean): number => {
    const physicalStatusCode = normalizePhysicalStatusCode(enrollment.ERM_PHYSICAL_STATUS);

    if (physicalStatusCode !== null && physicalStatusCode >= 0 && physicalStatusCode <= 4) {
      return physicalStatusCode;
    }

    // code 5 (ทั่วไป) or unknown: foreigners first (5), Thai nationals last (6)
    return isForeigner ? 5 : 6;
  };

  const getEnrollmentImagePath = (enrollment: BackendEnrollmentDetail): string | null => {
    const profileId = enrollment.USER?.PROFILE?.userProfileId;
    // รูปปัจจุบันของผู้ใช้ถูกแนบมากับ enrollment อยู่แล้ว (USER_IMAGE / IMAGE.USER_IMAGE_URL)
    // จึงไม่ต้องดึง user ทั้งระบบมาทำ map อีก; ใช้ history image เป็น fallback กรณีรูปปัจจุบันหาย
    return (
      enrollment.USER?.USER_IMAGE ||
      enrollment.USER?.IMAGE?.USER_IMAGE_URL ||
      (profileId ? latestProfileHistoryImageById.value[profileId] : null) ||
      enrollment.USER?.PROFILE?.userImagePath ||
      null
    );
  };

  const refreshLatestProfileHistoryImages = async (): Promise<void> => {
    const profileIds = [
      ...new Set(
        sessionEnrollments.value
          .map((enrollment) => enrollment.USER?.PROFILE?.userProfileId)
          .filter((profileId): profileId is number => Boolean(profileId)),
      ),
    ];

    if (profileIds.length === 0) {
      latestProfileHistoryImageById.value = {};
      return;
    }

    try {
      // ยิงครั้งเดียวสำหรับทุก profile (เดิม N+1: 1 request ต่อผู้สมัคร 1 คน)
      const imagesByProfileId = await fetchLatestProfileHistoryImages(profileIds);
      latestProfileHistoryImageById.value = Object.entries(imagesByProfileId).reduce<
        Record<number, string>
      >((acc, [profileId, imagePath]) => {
        if (imagePath) {
          acc[Number(profileId)] = imagePath;
        }
        return acc;
      }, {});
    } catch (err) {
      console.error('Failed to fetch latest profile history images', err);
      latestProfileHistoryImageById.value = {};
    }
  };

  const refreshStudentDisplayData = async (): Promise<void> => {
    if (!examId) return;

    allEnrollments.value = await fetchRawEnrollmentsByExamId(examId, {
      sessionId: activeSessionId.value,
    });
    await refreshLatestProfileHistoryImages();
    hasLoadedEnrollments.value = true;
    filterStudentsBySession();
  };

  const refreshStudentImages = async (): Promise<void> => {
    if (!examId) return;

    const latestEnrollments = await fetchRawEnrollmentsByExamId(examId, {
      sessionId: activeSessionId.value,
    });
    allEnrollments.value = latestEnrollments;
    await refreshLatestProfileHistoryImages();

    const enrollmentByErmId = new Map(latestEnrollments.map((e) => [e.ERM_ID, e]));
    students.value = students.value.map((student) => {
      const enrollment = enrollmentByErmId.get(student.ermId);
      if (!enrollment) return student;

      const imagePath = getEnrollmentImagePath(enrollment);
      return {
        ...student,
        avatar: imagePath ? getImageUrl(imagePath) : null,
      };
    });
  };

  const refreshBlockedSeats = async (): Promise<void> => {
    const sessionIds = [...new Set(sessions.value.map((session) => session.SS_ID))];
    if (sessionIds.length === 0) {
      blockedSeatsBySessionId.value = {};
      return;
    }

    const blockedSeatEntries = await Promise.all(
      sessionIds.map(async (sessionId) => {
        const seats = await fetchExamBlockedSeats(sessionId);
        return [sessionId, seats] as const;
      }),
    );

    blockedSeatsBySessionId.value = Object.fromEntries(blockedSeatEntries);
  };

  const isSeatAssignmentComplete = computed((): boolean => {
    return students.value.length > 0 && students.value.every((student) => Boolean(student.seat));
  });

  const unassignedStudents = computed((): StudentSeatInfo[] =>
    students.value.filter((student) => !student.seat),
  );

  const unassignedStudentCount = computed((): number => unassignedStudents.value.length);

  const hasMixedSeatAssignments = computed((): boolean => {
    const hasAssigned = students.value.some((student) => Boolean(student.seat));
    return hasAssigned && unassignedStudentCount.value > 0;
  });

  const hasAnyAssignedSeat = computed((): boolean =>
    students.value.some((student) => Boolean(student.seat)),
  );

  const isReEditingSeatAssignment = computed((): boolean => {
    return activeTimeSessions.value.some(
      (session) => Number(session.SS_SESSION_STATUS) >= STATUS_SEAT_ASSIGNED,
    );
  });

  const saveButtonLabel = computed((): string => {
    return isReEditingSeatAssignment.value
      ? t('admin.seatManagement.saveButtonEdit')
      : t('admin.seatManagement.saveButton');
  });

  const currentRoomStudents = computed((): StudentSeatInfo[] => {
    const selectedSessionLocation = activeSessionLocation.value;
    if (!selectedSessionLocation) return [];

    const roomSeatIds = new Set(activeSessionSeatItems.value.map((seat) => String(seat.LS_ID)));

    return students.value.filter((student) => {
      if (student.seat && roomSeatIds.has(student.seat)) return true;
      return student.sessionLocationId === selectedSessionLocation.SL_ID;
    });
  });

  const applicantCount = computed((): number => students.value.length);

  const paidCount = computed((): number => students.value.length);

  // Number of applicants seated in the currently selected room (drives the list badge)
  const currentRoomCount = computed((): number => currentRoomStudents.value.length);

  const currentRoomCapacity = computed((): number => {
    const selectedSessionLocation = activeSessionLocation.value;
    if (!selectedSessionLocation) return 0;

    const usableSeatCount = activeSessionSeatItems.value.filter(
      (seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2,
    ).length;
    if (activeSessionSeatItems.value.length > 0) return usableSeatCount;

    if (selectedSessionLocation.LOCATION_SEAT_CAPACITY) {
      return selectedSessionLocation.LOCATION_SEAT_CAPACITY;
    }

    return (
      (selectedSessionLocation.TOTAL_ROWS ||
        selectedSessionLocation.LOCATION.LOCATION_TOTAL_ROWS ||
        0) *
      (selectedSessionLocation.TOTAL_COLS ||
        selectedSessionLocation.LOCATION.LOCATION_TOTAL_COLS ||
        0)
    );
  });

  /**
   * Canonical reading-order key for an assigned seat (A1 < A2 < … < B1 …).
   * Prebuild Map once per location change so sort is O(1) lookup per student.
   */
  const seatOrderById = computed((): Map<string, number> => {
    const map = new Map<string, number>();
    for (const location of sessionLocations.value) {
      for (const seat of buildSessionSeatItems(location)) {
        const labelOrder = getSeatLabelOrderParts(seat.LS_SEAT_LABEL);
        const seatOrder = labelOrder
          ? labelOrder.letterOrder * 1_000 + labelOrder.numberOrder
          : seat.LS_ROW_NO * 1_000 + seat.LS_COL_NO;
        map.set(String(seat.LS_ID), location.SL_ID * 1_000_000 + seatOrder);
      }
    }
    return map;
  });

  const getSeatOrderKey = (student: StudentSeatInfo): number =>
    student.seat
      ? (seatOrderById.value.get(student.seat) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;

  const matchesApplicantType = (student: StudentSeatInfo): boolean => {
    const selected = applicantTypeFilter.value;
    if (!Array.isArray(selected) || selected.length === 0) return true;
    return selected.includes(student.remark);
  };

  const filteredStudents = computed((): StudentSeatInfo[] => {
    const query = searchQuery.value.toLowerCase().trim();
    // Show only the applicants seated in the currently selected room
    const sourceList = currentRoomStudents.value.filter(matchesApplicantType);
    const list = query
      ? sourceList.filter((s) => {
          const seatLabel = getSeatLabel(s.seat)?.toLowerCase() || '';
          return (
            s.name.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            seatLabel.includes(query)
          );
        })
      : [...sourceList];

    // Unassigned first (easier to drag onto the map), then seat reading order
    // (A1, A2, … B1 …) so assigned rows still line up with the map.
    return list.sort((a, b) => {
      const aHasSeat = Boolean(a.seat);
      const bHasSeat = Boolean(b.seat);
      if (aHasSeat !== bHasSeat) return aHasSeat ? 1 : -1;

      const seatDiff = getSeatOrderKey(a) - getSeatOrderKey(b);
      if (seatDiff !== 0) return seatDiff;
      return a.name.localeCompare(b.name, 'th');
    });
  });

  // ── Seat grid ────────────────────────────────────────────
  const getUsableSeatAssignments = (): UsableSeatAssignment[] => {
    return sessionLocations.value.flatMap((sessionLocation) => {
      const seats = buildSessionSeatItems(sessionLocation)
        .filter((seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2)
        .sort(compareSeatsByLabelOrder);

      return seats.map((seat) => ({
        sessionLocationId: sessionLocation.SL_ID,
        seatId: String(seat.LS_ID),
      }));
    });
  };

  /**
   * Map of `${SL_ID}:${LS_SEAT_LABEL}` → seat id string for O(1) resolve.
   */
  const seatIdBySlLabel = computed((): Map<string, string> => {
    const map = new Map<string, string>();
    for (const location of sessionLocations.value) {
      for (const seat of buildSessionSeatItems(location)) {
        if (seat.LS_SEAT_LABEL) {
          map.set(`${location.SL_ID}:${seat.LS_SEAT_LABEL}`, String(seat.LS_ID));
        }
      }
    }
    return map;
  });

  const resolveSeatIdFromEnrollment = (enrollment: BackendEnrollmentDetail): string | null => {
    if (!enrollment.ERM_SEAT_LABEL || enrollment.SL_ID == null) {
      return null;
    }

    return seatIdBySlLabel.value.get(`${enrollment.SL_ID}:${enrollment.ERM_SEAT_LABEL}`) ?? null;
  };

  const getTimeTabSessions = (sessionId: number | null): BackendSession[] => {
    if (sessionId === null) return [];
    const session = sessions.value.find((item) => item.SS_ID === sessionId);
    if (!session) return [];

    const timeKey = getSessionTimeKey(session);
    return sessions.value.filter((item) => getSessionTimeKey(item) === timeKey);
  };

  const redirectIfSeatEditingLocked = async (sessionId: number | null): Promise<boolean> => {
    const timeTabSessions = getTimeTabSessions(sessionId);
    if (!isSeatEditingLocked(timeTabSessions)) {
      return false;
    }

    await router.replace({
      name: 'admin-exam-seat-candidates',
      params: { examId: String(examId) },
      query: {
        ...(sessionId !== null ? { sessionId: String(sessionId) } : {}),
        ...(activeSessionLocationId.value !== null
          ? { sessionLocationId: String(activeSessionLocationId.value) }
          : {}),
      },
    });
    return true;
  };

  const autoAssignSeats = (): void => {
    // Usable seats from every room in the active time slot, kept in room order
    // (first room first) and sorted by reading order (A1, A2, … B1 …) within a
    // room. This makes the first room fill up completely before the second.
    const availableSeatAssignments = getUsableSeatAssignments();

    // Re-arrange everyone: clear seats first.
    students.value.forEach((student) => {
      student.seat = null;
      student.sessionLocationId = null;
    });

    // Analyse all applicants across both rooms together, then order them by
    // priority (พระ/เณร → … → คนไทย); within the same priority, sort by name A–Z.
    const orderedStudents = [...students.value].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.sortName.localeCompare(b.sortName, 'en', { sensitivity: 'base' });
    });

    // Fill sequentially: the first room is filled before spilling into the next.
    orderedStudents.forEach((student, index) => {
      const nextSeat = availableSeatAssignments[index];
      if (!nextSeat) return;

      student.seat = nextSeat.seatId;
      student.sessionLocationId = nextSeat.sessionLocationId;
    });
  };

  const mapEnrollmentToStudent = (enrollment: BackendEnrollmentDetail): StudentSeatInfo => {
    const profile = enrollment.USER?.PROFILE;
    const { remark, isForeigner } = getEnrollmentRemarkInfo(enrollment);
    const imagePath = getEnrollmentImagePath(enrollment);

    const titleEn = profile?.userTitleEn || null;
    const fullnameEn = profile?.userFullnameEn || null;
    const displayName =
      titleEn && fullnameEn
        ? `${titleEn} ${fullnameEn}`
        : profile?.userFullnameTh ||
          enrollment.USER?.USER_EMAIL ||
          t('admin.seatManagement.noName');
    const sortName =
      fullnameEn || profile?.userFullnameTh || enrollment.USER?.USER_EMAIL || displayName;

    return {
      ermId: enrollment.ERM_ID,
      sessionId: enrollment.SESSION_ID,
      id: enrollment.USER?.USER_NATIONAL_ID || String(enrollment.USER_ID),
      name: displayName,
      seat: resolveSeatIdFromEnrollment(enrollment),
      sessionLocationId:
        enrollment.SL_ID ??
        sessionLocations.value.find((location) => location.SS_ID === enrollment.SESSION_ID)
          ?.SL_ID ??
        null,
      avatar: imagePath ? getImageUrl(imagePath) : null,
      remark,
      bgColor: getPhysicalStatusBgColor(remark),
      isForeigner,
      titleEn,
      sortName,
      priority: getSeatPriority(enrollment, isForeigner),
    };
  };

  const markPlacementChoiceResolved = (): void => {
    if (!activeSession.value) return;
    placementChoiceResolvedByTime.add(getSessionTimeKey(activeSession.value));
  };

  const openPlacementChoiceIfNeeded = (timeKey: string | null): void => {
    if (!timeKey) return;
    if (placementChoiceResolvedByTime.has(timeKey)) return;
    if (!hasMixedSeatAssignments.value) return;
    showPlacementChoiceDialog.value = true;
  };

  const persistActiveSeatDraft = (): void => {
    if (!activeSessionId.value) return;
    saveSeatDraft(activeSessionId.value, students.value);
  };

  const handleRearrangeAllSeats = (): void => {
    autoAssignSeats();
    markPlacementChoiceResolved();
    showPlacementChoiceDialog.value = false;
    persistActiveSeatDraft();
    $q.notify({
      type: 'info',
      position: 'top',
      message: t('admin.seatManagement.notifications.rearranged'),
      icon: 'event_seat',
    });
  };

  const handleKeepExistingSeats = (): void => {
    markPlacementChoiceResolved();
    showPlacementChoiceDialog.value = false;
    persistActiveSeatDraft();
    if (unassignedStudentCount.value > 0) {
      $q.notify({
        type: 'info',
        position: 'top',
        message: t('admin.seatManagement.notifications.dragUnassignedHint'),
        icon: 'pan_tool',
      });
    }
  };

  /**
   * Places an unassigned student onto an empty usable seat (list → map drag).
   * Returns false when the student/seat is invalid or the seat is already taken.
   */
  const assignStudentToSeat = (ermId: number, seatId: string): boolean => {
    const student = students.value.find((item) => item.ermId === ermId);
    if (!student || student.seat) return false;

    const usableSeat = getUsableSeatAssignments().find((seat) => seat.seatId === seatId);
    if (!usableSeat) return false;

    const occupant = students.value.find((item) => item.seat === seatId);
    if (occupant) return false;

    student.seat = usableSeat.seatId;
    student.sessionLocationId = usableSeat.sessionLocationId;
    persistActiveSeatDraft();
    return true;
  };

  const filterStudentsBySession = (): void => {
    if (!activeSessionId.value) {
      students.value = [];
      return;
    }

    const timeKey = activeSession.value ? getSessionTimeKey(activeSession.value) : null;
    const existingDraft = timeKey ? seatDraftsByTime.get(timeKey) : undefined;

    // Only show students who have status PAID (1), SEAT_ASSIGNED (2), or SEAT_PUBLISHED (3)
    const eligibleEnrollments = sessionEnrollments.value.filter(
      (e) =>
        Number(e.ERM_STATUS) === STATUS_PAID ||
        Number(e.ERM_STATUS) === STATUS_SEAT_ASSIGNED ||
        Number(e.ERM_STATUS) === STATUS_SEAT_PUBLISHED,
    );

    if (existingDraft) {
      const draftByErmId = new Map(existingDraft.map((student) => [student.ermId, student]));
      students.value = eligibleEnrollments.map((enrollment) => {
        const mapped = mapEnrollmentToStudent(enrollment);
        const draft = draftByErmId.get(enrollment.ERM_ID);
        if (!draft) return mapped;

        return {
          ...mapped,
          seat: draft.seat,
          sessionLocationId: draft.sessionLocationId ?? mapped.sessionLocationId,
        };
      });
      if (timeKey) {
        seatDraftsByTime.set(timeKey, cloneStudents(students.value));
      }
      openPlacementChoiceIfNeeded(timeKey);
      return;
    }

    students.value = eligibleEnrollments.map((enrollment) => mapEnrollmentToStudent(enrollment));

    const hasExistingSeatAssignments = eligibleEnrollments.some((enrollment) =>
      Boolean(enrollment.ERM_SEAT_LABEL && enrollment.SL_ID != null),
    );

    if (!hasExistingSeatAssignments) {
      autoAssignSeats();
      if (timeKey) {
        placementChoiceResolvedByTime.add(timeKey);
      }
    } else {
      openPlacementChoiceIfNeeded(timeKey);
    }

    if (timeKey) {
      seatDraftsByTime.set(timeKey, cloneStudents(students.value));
    }
  };

  // ── Data loading ─────────────────────────────────────────
  const loadExamData = async (): Promise<void> => {
    if (!examId) return;
    isLoading.value = true;
    error.value = null;
    try {
      examData.value = await fetchExamWithSeats(examId);
      sessions.value = examData.value.SESSIONS || [];

      const routeSessionId = Number(route.query.sessionId);
      if (
        !isNaN(routeSessionId) &&
        sessions.value.some((session) => session.SS_ID === routeSessionId)
      ) {
        activeSessionId.value = routeSessionId;
      } else {
        const firstSession = sessionTimeTabs.value[0];
        if (firstSession) {
          activeSessionId.value = firstSession.SS_ID;
        }
      }

      if (await redirectIfSeatEditingLocked(activeSessionId.value)) {
        return;
      }

      const routeSessionLocationId = Number(route.query.sessionLocationId);
      if (
        !isNaN(routeSessionLocationId) &&
        sessionLocations.value.some((location) => location.SL_ID === routeSessionLocationId)
      ) {
        activeSessionLocationId.value = routeSessionLocationId;
      }

      await refreshBlockedSeats();
      await refreshStudentDisplayData();
    } catch (err) {
      console.error('Failed to load exam data', err);
      const msg = t('admin.seatManagement.notifications.loadError');
      error.value = msg;
      $q.notify({ type: 'negative', message: msg });
    } finally {
      isLoading.value = false;
    }
  };

  watch(activeSessionId, async (newSessionId, previousSessionId) => {
    saveSeatDraft(previousSessionId, students.value);
    const firstSessionLocation = sessionLocations.value[0]?.SL_ID ?? null;
    activeSessionLocationId.value = firstSessionLocation;
    if (newSessionId !== null && (await redirectIfSeatEditingLocked(newSessionId))) {
      return;
    }
    // previousSessionId === undefined/null คือโหลดครั้งแรก — loadExamData จะ refresh เอง
    if (previousSessionId != null && newSessionId !== null) {
      await refreshStudentDisplayData();
    } else if (hasLoadedEnrollments.value && newSessionId !== null) {
      filterStudentsBySession();
    }
  });

  const swapSeatAssignments = (sourceSeatId: string, targetSeatId: string): void => {
    if (sourceSeatId === targetSeatId) return;

    const usableSeats = getUsableSeatAssignments();
    const sourceIndex = usableSeats.findIndex((seat) => seat.seatId === sourceSeatId);
    const targetIndex = usableSeats.findIndex((seat) => seat.seatId === targetSeatId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const sourceStudent = students.value.find((student) => student.seat === sourceSeatId);
    if (!sourceStudent) return;

    const studentBySeat = new Map<string, StudentSeatInfo>();
    students.value.forEach((student) => {
      if (student.id === sourceStudent.id || !student.seat) return;
      studentBySeat.set(student.seat, student);
    });

    let emptyIndex = targetIndex;
    while (emptyIndex < usableSeats.length && studentBySeat.has(usableSeats[emptyIndex]!.seatId)) {
      emptyIndex += 1;
    }
    if (emptyIndex >= usableSeats.length) return;

    for (let index = emptyIndex; index > targetIndex; index -= 1) {
      const fromSeat = usableSeats[index - 1]!;
      const toSeat = usableSeats[index]!;
      const movingStudent = studentBySeat.get(fromSeat.seatId);
      if (!movingStudent) continue;

      movingStudent.seat = toSeat.seatId;
      movingStudent.sessionLocationId = toSeat.sessionLocationId;
    }

    const targetSeat = usableSeats[targetIndex]!;
    sourceStudent.seat = targetSeat.seatId;
    sourceStudent.sessionLocationId = targetSeat.sessionLocationId;
  };

  const handleCancel = (): void => {
    void router.back();
  };

  const handleSave = async (): Promise<void> => {
    if (!activeSessionId.value) return;
    if (!isSeatAssignmentComplete.value) return;

    isLoading.value = true;
    error.value = null;
    try {
      saveSeatDraft(activeSessionId.value, students.value);
      const seatAssignments: EnrollmentSeatAssignment[] = [];

      for (const timeSession of sessionTimeTabs.value) {
        const timeKey = getSessionTimeKey(timeSession);
        const draftStudents = seatDraftsByTime.get(timeKey) || [];
        const draftStudentByEnrollmentId = new Map(
          draftStudents.map((student) => [student.ermId, student]),
        );
        const timeSessions = sessions.value.filter(
          (session) => getSessionTimeKey(session) === timeKey,
        );
        const timeSessionIds = new Set(timeSessions.map((session) => session.SS_ID));
        const timeLocations = timeSessions.flatMap((session) => {
          const relationLocations = session.SESSION_LOCATIONS || [];
          if (relationLocations.length > 0) {
            return relationLocations
              .filter((item) => item.LOCATION)
              .map((item) => ({ ...item, SS_ID: item.SS_ID || session.SS_ID }));
          }

          if (!session.LOCATION) return [];
          return [
            {
              SL_ID: -session.SS_ID,
              LOCATION_ID: session.LOCATION.LOCATION_ID,
              SS_ID: session.SS_ID,
              LOCATION: session.LOCATION,
            },
          ];
        });
        const availableSeats = timeLocations.flatMap((location) =>
          buildSessionSeatItems(location)
            .filter((seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2)
            .sort(compareSeatsByLabelOrder)
            .flatMap((seat, index) => {
              if (!seat.LS_SEAT_LABEL) return [];

              return [
                {
                  seatId: seat.LS_ID,
                  seatLabel: seat.LS_SEAT_LABEL,
                  sortOrder: seat.LS_SORT_ORDER ?? index + 1,
                  sessionLocationId: location.SL_ID,
                },
              ];
            }),
        );
        const availableSeatByLocationAndId = new Map(
          availableSeats.map((seat) => [`${seat.sessionLocationId}:${seat.seatId}`, seat]),
        );
        const eligibleEnrollments = allEnrollments.value
          .filter(
            (enrollment) =>
              timeSessionIds.has(enrollment.SESSION_ID) &&
              (Number(enrollment.ERM_STATUS) === STATUS_PAID ||
                Number(enrollment.ERM_STATUS) === STATUS_SEAT_ASSIGNED ||
                Number(enrollment.ERM_STATUS) === STATUS_SEAT_PUBLISHED),
          )
          .sort((a, b) => {
            const aProfile = a.USER?.PROFILE;
            const bProfile = b.USER?.PROFILE;
            const aRemark = getEnrollmentRemarkInfo(a);
            const bRemark = getEnrollmentRemarkInfo(b);
            const priorityDiff =
              getSeatPriority(a, aRemark.isForeigner) - getSeatPriority(b, bRemark.isForeigner);
            if (priorityDiff !== 0) return priorityDiff;

            const aName =
              aProfile?.userFullnameEn ||
              aProfile?.userFullnameTh ||
              a.USER?.USER_EMAIL ||
              String(a.USER_ID);
            const bName =
              bProfile?.userFullnameEn ||
              bProfile?.userFullnameTh ||
              b.USER?.USER_EMAIL ||
              String(b.USER_ID);
            return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
          });

        if (eligibleEnrollments.length > availableSeats.length) {
          throw new Error(t('admin.seatManagement.notifications.saveError'));
        }

        eligibleEnrollments.forEach((enrollment, index) => {
          const draftStudent = draftStudentByEnrollmentId.get(enrollment.ERM_ID);
          const generatedSeat = availableSeats[index];
          const seatId = draftStudent?.seat ? Number(draftStudent.seat) : generatedSeat?.seatId;
          const sessionLocationId =
            draftStudent?.sessionLocationId ?? generatedSeat?.sessionLocationId;
          const selectedSeat =
            seatId && sessionLocationId
              ? availableSeatByLocationAndId.get(`${sessionLocationId}:${seatId}`)
              : undefined;

          if (!selectedSeat || !sessionLocationId || sessionLocationId < 1) {
            throw new Error(t('admin.seatManagement.notifications.saveError'));
          }

          seatAssignments.push({
            enrollment,
            sessionLocationId,
            seatLabel: selectedSeat.seatLabel,
            sortOrder: selectedSeat.sortOrder,
          });
        });
      }

      await bulkAssignEnrollmentSeats(
        seatAssignments.map((assignment) => ({
          ermId: assignment.enrollment.ERM_ID,
          slId: assignment.sessionLocationId,
          seatLabel: assignment.seatLabel,
          ...(assignment.sortOrder !== undefined ? { sortOrder: assignment.sortOrder } : {}),
        })),
        sessions.value.map((session) => session.SS_ID),
      );

      $q.notify({
        color: 'positive',
        position: 'top',
        message: t('admin.seatManagement.notifications.saveSuccess'),
        icon: 'check_circle',
      });

      // Navigate to the candidates list page after successful save
      void router.replace({
        name: 'admin-exam-seat-candidates',
        params: { examId: String(examId) },
        query: {
          sessionId: String(activeSessionId.value),
          ...(activeSessionLocationId.value !== null
            ? { sessionLocationId: String(activeSessionLocationId.value) }
            : {}),
        },
      });
    } catch (err: unknown) {
      console.error('Failed to save seats', err);
      let message = t('admin.seatManagement.notifications.saveError');

      // Type-safe error handling for Axios/API errors
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data: { message?: string } } };
        message = axiosError.response?.data?.message || message;
      }

      error.value = message;
      $q.notify({ type: 'negative', message });
    } finally {
      isLoading.value = false;
    }
  };

  // กัน refetch ถี่เกินไป: focus กับ visibilitychange มักยิงพร้อมกัน และผู้ใช้สลับ tab บ่อย
  // จึง refresh เฉพาะเมื่อไม่มีการโหลดค้างอยู่ และเว้นระยะอย่างน้อย MIN_REFRESH_INTERVAL_MS
  const MIN_REFRESH_INTERVAL_MS = 15000;
  let isRefreshingImages = false;
  let lastImageRefreshAt = 0;

  const handleWindowFocus = (): void => {
    if (isLoading.value || isRefreshingImages) return;
    if (Date.now() - lastImageRefreshAt < MIN_REFRESH_INTERVAL_MS) return;

    isRefreshingImages = true;
    void refreshStudentImages().finally(() => {
      isRefreshingImages = false;
      lastImageRefreshAt = Date.now();
    });
  };

  const handleVisibilityChange = (): void => {
    if (!document.hidden) {
      handleWindowFocus();
    }
  };

  onMounted(() => {
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  const gridCols = computed(() => {
    return (
      activeSessionLocation.value?.TOTAL_COLS ||
      activeSessionLocation.value?.LOCATION.LOCATION_TOTAL_COLS ||
      10
    );
  });

  const splitLeftRight = computed((): boolean => {
    return aisleAfterCols.value.length > 0 || aisleAfterRows.value.length > 0;
  });

  const aisleAfterCols = computed((): number[] => {
    const selectedSessionLocation = activeSessionLocation.value;
    if (!selectedSessionLocation) return [];

    return (
      selectedSessionLocation.AISLE_AFTER?.after_cols ??
      getLocationAisleAfter(selectedSessionLocation.LOCATION).after_cols
    );
  });

  const aisleAfterRows = computed((): number[] => {
    const selectedSessionLocation = activeSessionLocation.value;
    if (!selectedSessionLocation) return [];

    return (
      selectedSessionLocation.AISLE_AFTER?.after_rows ??
      getLocationAisleAfter(selectedSessionLocation.LOCATION).after_rows
    );
  });

  const seatsByRow = computed((): SeatCell[][] => {
    if (activeSessionSeatItems.value.length === 0) return [];

    const rowsMap: { [key: number]: SeatCell[] } = {};
    const seats = activeSessionSeatItems.value;

    // lookup ครั้งเดียว แทนการ .find() ในทุก seat (เดิม O(seats × students) ถึง 2 รอบ)
    const studentBySeatId = new Map<string, StudentSeatInfo>();
    currentRoomStudents.value.forEach((student) => {
      if (student.seat) studentBySeatId.set(student.seat, student);
    });

    seats.forEach((seat) => {
      const r = seat.LS_ROW_NO;
      if (!rowsMap[r]) {
        rowsMap[r] = [];
      }

      let status: SeatStatus = 'available';
      let student: StudentSeatInfo | null = null;
      if (seat.LS_SEAT_STATUS === 1) {
        status = 'broken';
      } else if (seat.LS_SEAT_STATUS === 2) {
        status = 'blocked';
      } else {
        const occupant = studentBySeatId.get(String(seat.LS_ID)) ?? null;
        if (occupant) {
          status = 'assigned';
          student = occupant;
        }
      }

      rowsMap[r].push({
        id: String(seat.LS_ID),
        label: seat.LS_SEAT_LABEL || '',
        status: status,
        rowNo: seat.LS_ROW_NO,
        colNo: seat.LS_COL_NO,
        student,
      });
    });

    const sortedRowKeys = Object.keys(rowsMap)
      .map(Number)
      .sort((a, b) => a - b);

    return sortedRowKeys.map((r) => {
      const rowSeats = rowsMap[r];
      return rowSeats ? rowSeats.sort((a, b) => a.colNo - b.colNo) : [];
    });
  });

  const seatStyle = computed(() => {
    const cols = activeSessionLocation.value?.TOTAL_COLS || gridCols.value || 1;
    const rows =
      activeSessionLocation.value?.TOTAL_ROWS ||
      activeSessionLocation.value?.LOCATION.LOCATION_TOTAL_ROWS ||
      1;
    const aisleWidth = splitLeftRight.value ? 48 : 0;
    const total = rows * cols;

    if (total <= 40) {
      const rGap = rows <= 4 ? 56 : rows <= 6 ? 36 : 24;
      return {
        width: '92px',
        height: '92px',
        fontSize: '22px',
        rowGap: `${rGap}px`,
        colGap: '24px',
        aisleWidth: `${aisleWidth}px`,
      };
    }

    const containerWidth = 1000;
    const scale = Math.max(60, Math.min(100, (containerWidth - aisleWidth) / cols - 6));
    const colGap = Math.max(10, Math.min(28, scale * 0.25));
    const rowGap = Math.max(10, Math.min(56, (650 - rows * scale) / (rows - 1 || 1)));

    return {
      width: `${scale}px`,
      height: `${scale}px`,
      fontSize: `${Math.max(16, scale * 0.35)}px`,
      rowGap: `${rowGap}px`,
      colGap: `${colGap}px`,
      aisleWidth: `${aisleWidth}px`,
    };
  });

  onBeforeUnmount(() => {
    document.body.classList.remove('is-dragging-active');
    window.removeEventListener('focus', handleWindowFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return {
    // State
    isLoading,
    error,
    activeSessionId,
    activeSessionLocationId,
    sessions,
    sessionTimeTabs,
    roomOptions,
    searchQuery,
    applicantTypeFilter,
    applicantTypeOptions,
    gridCols,
    splitLeftRight,
    aisleAfterCols,
    aisleAfterRows,
    seatsByRow,
    seatStyle,
    showPlacementChoiceDialog,
    // Exam / session info
    examTitle,
    examDate,
    sessionTime,
    sessionLocation,
    sessionTotalCapacity,
    applicantCount,
    paidCount,
    currentRoomCount,
    currentRoomCapacity,
    filteredStudents,
    isSeatAssignmentComplete,
    isReEditingSeatAssignment,
    unassignedStudentCount,
    hasMixedSeatAssignments,
    hasAnyAssignedSeat,
    saveButtonLabel,
    // Methods
    loadExamData,
    getSeatLabel,
    swapSeatAssignments,
    assignStudentToSeat,
    handleRearrangeAllSeats,
    handleKeepExistingSeats,
    handleCancel,
    handleSave,
  };
}
