import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { BackendExam, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamById } from 'src/services/exam.service';
import {
  bulkAssignEnrollmentSeats,
  fetchRawEnrollmentsByExamId,
} from 'src/services/enrollment.service';
import { DEFAULT_EXAM_TITLE } from 'src/constants/exam';
import { formatThaiLongDate } from 'src/utils/thai-date';
import { getImageUrl } from 'src/services/image.service';
import { getUsersFromApi } from 'src/services/user.service';
import { fetchProfileEditHistory } from 'src/services/profile-edit-history.service';
import type { ProfileEditHistory } from 'src/types/profile-edit-history.types';
import { useExamSeatNavigation } from 'src/composables/use-exam-seat-navigation';

/** Enrollment status codes shared with the backend */
const STATUS_PAID = 1;
const STATUS_SEAT_ASSIGNED = 2;
const STATUS_SEAT_PUBLISHED = 3;

/** Width of the custom drag ghost (px) used before the first real measurement */
const DEFAULT_DRAG_WIDTH = 320;

const PHYSICAL_STATUS_REMARKS: Record<number, string> = {
  0: 'พระภิกษุ / สามเณร',
  1: 'นักบวช / ศาสนบุคคล',
  2: 'บุคคลทุพพลภาพ',
  3: 'ผู้ตั้งครรภ์',
  4: 'ผู้พิการรณ์',
};

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
  isForeigner: boolean;
  titleEn: string | null;
  sortName: string;
  /**
   * Seat-assignment priority (lower = seated first):
   * 0 พระภิกษุ/สามเณร, 1 นักบวช/ศาสนบุคคล, 2 บุคคลทุพพลภาพ,
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
}

interface EnrollmentSeatAssignment {
  enrollment: BackendEnrollmentDetail;
  seatId: number;
  sessionLocationId: number;
}

/**
 * Composable for the "จัดการที่นั่งสอบ" page.
 * Owns exam/session/enrollment loading, the student list, the seat grid
 * and the custom drag-and-drop seat-assignment interaction.
 */
export function useExamSeatManagement() {
  const route = useRoute();
  const router = useRouter();
  const { isSeatAllocationLocked } = useExamSeatNavigation();
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
  const latestUserImageById = ref<Record<number, string>>({});
  const latestProfileHistoryImageById = ref<Record<number, string>>({});
  const students = ref<StudentSeatInfo[]>([]);
  const seatDraftsByTime = new Map<string, StudentSeatInfo[]>();
  const allSeats = ref<SeatCell[]>([]);
  const searchQuery = ref('');
  const hasLoadedEnrollments = ref(false);

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
    return sessions.value.filter((session) => {
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
    const baseName = examData.value?.EXAM_NAME || DEFAULT_EXAM_TITLE;
    const baseTitle = examData.value?.EXAM_ROUND
      ? `${baseName} ${examData.value.EXAM_ROUND}`
      : baseName;
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
      (sum, sessionLocation) => sum + (sessionLocation.LOCATION.SEATS?.length || 0),
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

    const seat = activeLocation.value?.SEATS?.find((s) => String(s.LS_ID) === seatId);
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

  const normalizePhysicalStatusCode = (
    value: string | number | null | undefined,
  ): number | null => {
    if (value === null || value === undefined || value === '') return null;

    const numericValue = Number(value);
    if (Number.isInteger(numericValue)) return numericValue;

    const matchedEntry = Object.entries({
      ...PHYSICAL_STATUS_REMARKS,
      5: 'ทั่วไป',
    }).find(([, label]) => label === value);

    return matchedEntry ? Number(matchedEntry[0]) : null;
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
   * Physical-status codes 0–4 keep their own order; ทั่วไป (code 5) is split so
   * ชาวต่างชาติ (มี passport) are seated before คนไทย, who come last.
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
    return (
      latestUserImageById.value[enrollment.USER_ID] ||
      enrollment.USER?.USER_IMAGE ||
      enrollment.USER?.IMAGE?.USER_IMAGE_URL ||
      (profileId ? latestProfileHistoryImageById.value[profileId] : null) ||
      enrollment.USER?.PROFILE?.userImagePath ||
      null
    );
  };

  const parseHistoryValues = (value: string | null): Record<string, unknown> => {
    if (!value) return {};
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const getLatestImageFromHistory = (logs: ProfileEditHistory[]): string | null => {
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    for (const log of sortedLogs) {
      const newValues = parseHistoryValues(log.newValues);
      const imagePath = newValues.userImagePath;
      if (typeof imagePath === 'string' && imagePath.trim()) {
        return imagePath;
      }
    }

    return null;
  };

  const refreshLatestUserImages = async (): Promise<void> => {
    const latestUsers = await getUsersFromApi();
    latestUserImageById.value = latestUsers.reduce<Record<number, string>>((acc, user) => {
      if (user.id && user.userImagePath) {
        acc[user.id] = user.userImagePath;
      }
      return acc;
    }, {});
  };

  const refreshLatestProfileHistoryImages = async (): Promise<void> => {
    const profileIds = [
      ...new Set(
        sessionEnrollments.value
          .map((enrollment) => enrollment.USER?.PROFILE?.userProfileId)
          .filter((profileId): profileId is number => Boolean(profileId)),
      ),
    ];

    const historyEntries = await Promise.all(
      profileIds.map(async (profileId) => {
        try {
          const logs = await fetchProfileEditHistory(profileId);
          return [profileId, getLatestImageFromHistory(logs)] as const;
        } catch (err) {
          console.error(`Failed to fetch profile edit history for profile ${profileId}`, err);
          return [profileId, null] as const;
        }
      }),
    );

    latestProfileHistoryImageById.value = historyEntries.reduce<Record<number, string>>(
      (acc, [profileId, imagePath]) => {
        if (imagePath) {
          acc[profileId] = imagePath;
        }
        return acc;
      },
      {},
    );
  };

  const refreshStudentDisplayData = async (): Promise<void> => {
    if (!examId) return;

    allEnrollments.value = await fetchRawEnrollmentsByExamId(examId);
    await Promise.all([refreshLatestUserImages(), refreshLatestProfileHistoryImages()]);
    hasLoadedEnrollments.value = true;
    filterStudentsBySession();
  };

  const refreshStudentImages = async (): Promise<void> => {
    if (!examId) return;

    const latestEnrollments = await fetchRawEnrollmentsByExamId(examId);
    allEnrollments.value = latestEnrollments;
    await Promise.all([refreshLatestUserImages(), refreshLatestProfileHistoryImages()]);

    students.value = students.value.map((student) => {
      const enrollment = latestEnrollments.find((e) => e.ERM_ID === student.ermId);
      if (!enrollment) return student;

      const imagePath = getEnrollmentImagePath(enrollment);
      return {
        ...student,
        avatar: imagePath ? getImageUrl(imagePath) : null,
      };
    });
  };

  const isSeatAssignmentComplete = computed((): boolean => {
    return students.value.length > 0 && students.value.every((student) => Boolean(student.seat));
  });

  const currentRoomStudents = computed((): StudentSeatInfo[] => {
    const selectedSessionLocation = activeSessionLocation.value;
    if (!selectedSessionLocation) return [];

    const roomSeatIds = new Set(
      (selectedSessionLocation.LOCATION.SEATS || []).map((seat) => String(seat.LS_ID)),
    );

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
    const location = activeSessionLocation.value?.LOCATION;
    if (!location) return 0;

    const usableSeatCount = (location.SEATS || []).filter(
      (seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2,
    ).length;
    if (usableSeatCount > 0) return usableSeatCount;

    if (location.LOCATION_SEAT_CAPACITY) return location.LOCATION_SEAT_CAPACITY;

    return (location.LOCATION_TOTAL_ROWS || 0) * (location.LOCATION_TOTAL_COLS || 0);
  });

  /**
   * Canonical reading-order key for an assigned seat (A1 < A2 < … < B1 …).
   * Uses LS_ROW_NO / LS_COL_NO so the list matches the seat-map grid.
   * Unassigned students sort last.
   */
  const getSeatOrderKey = (student: StudentSeatInfo): number => {
    if (!student.seat) return Number.MAX_SAFE_INTEGER;

    for (const location of sessionLocations.value) {
      const seat = location.LOCATION.SEATS?.find((s) => String(s.LS_ID) === student.seat);
      if (seat) {
        // Room first, then row, then column → stable, grid-aligned order
        const labelOrder = getSeatLabelOrderParts(seat.LS_SEAT_LABEL);
        const seatOrder = labelOrder
          ? labelOrder.letterOrder * 1_000 + labelOrder.numberOrder
          : seat.LS_ROW_NO * 1_000 + seat.LS_COL_NO;

        return location.SL_ID * 1_000_000 + seatOrder;
      }
    }

    return Number.MAX_SAFE_INTEGER;
  };

  const filteredStudents = computed((): StudentSeatInfo[] => {
    const query = searchQuery.value.toLowerCase().trim();
    // Show only the applicants seated in the currently selected room
    const sourceList = currentRoomStudents.value;
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

    // Sort by seat reading order (A1, A2, … B1 …) so the list lines up with the
    // seat map on the right; unassigned students fall to the bottom.
    return list.sort((a, b) => {
      const seatDiff = getSeatOrderKey(a) - getSeatOrderKey(b);
      if (seatDiff !== 0) return seatDiff;
      return a.name.localeCompare(b.name, 'th');
    });
  });

  // ── Seat grid ────────────────────────────────────────────
  // Sync seat visual status with student data
  const updateSeatStatuses = (): void => {
    allSeats.value.forEach((seat) => {
      const dbSeat = activeLocation.value?.SEATS?.find((s) => String(s.LS_ID) === seat.id);
      if (dbSeat) {
        if (dbSeat.LS_SEAT_STATUS === 1) {
          seat.status = 'broken';
          return;
        }
        if (dbSeat.LS_SEAT_STATUS === 2) {
          seat.status = 'blocked';
          return;
        }
      }
      const isOccupied = students.value.some(
        (s) => s.seat === seat.id && s.sessionLocationId === activeSessionLocationId.value,
      );
      seat.status = isOccupied ? 'assigned' : 'available';
    });
  };

  // Pull seats from backend location
  const initializeSeats = (): void => {
    allSeats.value = [];
    if (!activeLocation.value?.SEATS) return;

    const seats = activeLocation.value.SEATS;
    seats.forEach((seat) => {
      let status: SeatStatus = 'available';
      if (seat.LS_SEAT_STATUS === 1) {
        status = 'broken';
      } else if (seat.LS_SEAT_STATUS === 2) {
        status = 'blocked';
      }
      allSeats.value.push({
        id: String(seat.LS_ID),
        label: seat.LS_SEAT_LABEL || '',
        status: status,
        rowNo: seat.LS_ROW_NO,
        colNo: seat.LS_COL_NO,
        student: null,
      });
    });
    updateSeatStatuses();
  };

  const getUsableSeatAssignments = (): UsableSeatAssignment[] => {
    return sessionLocations.value.flatMap((sessionLocation) => {
      const seats = [...(sessionLocation.LOCATION.SEATS || [])]
        .filter((seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2)
        .sort(compareSeatsByLabelOrder);

      return seats.map((seat) => ({
        sessionLocationId: sessionLocation.SL_ID,
        seatId: String(seat.LS_ID),
      }));
    });
  };

  const autoAssignSeats = (): void => {
    // Usable seats from every room in the active time slot, kept in room order
    // (first room first) and sorted by reading order (A1, A2, … B1 …) within a
    // room. This makes the first room fill up completely before the second.
    const availableSeatAssignments = getUsableSeatAssignments();

    // Re-arrange everyone on each open: clear seats first.
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

    updateSeatStatuses();
  };

  const filterStudentsBySession = (): void => {
    if (!activeSessionId.value) {
      students.value = [];
      return;
    }

    const timeKey = activeSession.value ? getSessionTimeKey(activeSession.value) : null;
    const existingDraft = timeKey ? seatDraftsByTime.get(timeKey) : undefined;
    if (existingDraft) {
      students.value = cloneStudents(existingDraft);
      updateSeatStatuses();
      return;
    }

    // Only show students who have status PAID (1), SEAT_ASSIGNED (2), or SEAT_PUBLISHED (3)
    const eligibleEnrollments = sessionEnrollments.value.filter(
      (e) =>
        Number(e.ERM_STATUS) === STATUS_PAID ||
        Number(e.ERM_STATUS) === STATUS_SEAT_ASSIGNED ||
        Number(e.ERM_STATUS) === STATUS_SEAT_PUBLISHED,
    );

    students.value = eligibleEnrollments.map((e) => {
      const profile = e.USER?.PROFILE;
      const { remark, isForeigner } = getEnrollmentRemarkInfo(e);
      const imagePath = getEnrollmentImagePath(e);

      // Build English display name: "Mr. Somaun Jaidee"
      const titleEn = profile?.userTitleEn || null;
      const fullnameEn = profile?.userFullnameEn || null;
      const displayName =
        titleEn && fullnameEn
          ? `${titleEn} ${fullnameEn}`
          : profile?.userFullnameTh || e.USER?.USER_EMAIL || t('admin.seatManagement.noName');
      const sortName = fullnameEn || profile?.userFullnameTh || e.USER?.USER_EMAIL || displayName;

      return {
        ermId: e.ERM_ID,
        sessionId: e.SESSION_ID,
        id: e.USER?.USER_NATIONAL_ID || String(e.USER_ID),
        name: displayName,
        seat: e.LS_ID ? String(e.LS_ID) : null,
        sessionLocationId:
          e.SL_ID ??
          sessionLocations.value.find((location) => location.SS_ID === e.SESSION_ID)?.SL_ID ??
          null,
        avatar: imagePath ? getImageUrl(imagePath) : null,
        remark,
        isForeigner,
        titleEn,
        sortName,
        priority: getSeatPriority(e, isForeigner),
      };
    });

    autoAssignSeats();
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
      $q.loading.show({ message: t('admin.seatManagement.loadingData') });
      examData.value = await fetchExamById(examId);

      if (isSeatAllocationLocked(examData.value)) {
        await router.replace({
          name: 'admin-exam-seat-candidates',
          params: { examId: String(examId) },
        });
        return;
      }

      sessions.value = examData.value.SESSIONS || [];
      const firstSession = sessions.value[0];
      if (firstSession) {
        activeSessionId.value = firstSession.SS_ID;
      }

      await refreshStudentDisplayData();
    } catch (err) {
      console.error('Failed to load exam data', err);
      const msg = t('admin.seatManagement.notifications.loadError');
      error.value = msg;
      $q.notify({ type: 'negative', message: msg });
    } finally {
      $q.loading.hide();
      isLoading.value = false;
    }
  };

  watch(activeSessionId, (newSessionId, previousSessionId) => {
    saveSeatDraft(previousSessionId, students.value);
    const firstSessionLocation = sessionLocations.value[0]?.SL_ID ?? null;
    activeSessionLocationId.value = firstSessionLocation;
    if (hasLoadedEnrollments.value && newSessionId !== null) {
      filterStudentsBySession();
    }
  });

  watch(activeSessionLocationId, () => {
    initializeSeats();
  });

  // ── Custom drag and drop ─────────────────────────────────
  const draggedStudentId = ref<string | null>(null);
  const draggedOverSeatId = ref<string | null>(null);
  const dragX = ref(0);
  const dragY = ref(0);
  const dragOffsetX = ref(0);
  const dragOffsetY = ref(0);
  const dragWidth = ref(DEFAULT_DRAG_WIDTH);
  const isDragging = ref(false);

  const draggedStudentInfo = computed((): StudentSeatInfo | undefined => {
    return students.value.find((s) => s.id === draggedStudentId.value);
  });

  const onMouseMove = (e: MouseEvent): void => {
    if (!isDragging.value) return;
    dragX.value = e.clientX;
    dragY.value = e.clientY;
  };

  const onGlobalMouseUp = (): void => {
    if (isDragging.value) {
      isDragging.value = false;
      draggedStudentId.value = null;
      draggedOverSeatId.value = null;

      document.body.classList.remove('is-dragging-active');

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
    }
  };

  const onMouseDown = (e: MouseEvent, studentId: string): void => {
    if (e.button !== 0) return; // Only trigger on left mouse button

    // Calculate exact position so the card doesn't "jump" to the mouse center
    const targetElement = e.currentTarget as HTMLElement;
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      dragOffsetX.value = e.clientX - rect.left;
      dragOffsetY.value = e.clientY - rect.top;
      dragWidth.value = rect.width;
    }

    isDragging.value = true;
    draggedStudentId.value = studentId;
    dragX.value = e.clientX;
    dragY.value = e.clientY;

    document.body.classList.add('is-dragging-active');

    // Track global mouse movement for the ghost
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  const onSeatEnter = (seatId: string): void => {
    if (isDragging.value) {
      const seat = allSeats.value.find((s) => s.id === seatId);
      if (seat && seat.status !== 'broken' && seat.status !== 'blocked') {
        draggedOverSeatId.value = seatId;
      }
    }
  };

  const onSeatLeave = (seatId: string): void => {
    if (draggedOverSeatId.value === seatId) {
      draggedOverSeatId.value = null;
    }
  };

  const onSeatDrop = (seatId: string): void => {
    if (!isDragging.value || !draggedStudentId.value) return;

    const targetSeat = allSeats.value.find((s) => s.id === seatId);
    if (targetSeat && (targetSeat.status === 'broken' || targetSeat.status === 'blocked')) {
      return;
    }

    const student = students.value.find((s) => s.id === draggedStudentId.value);
    if (student) {
      // Unassign anyone currently in this seat
      const existingOccupant = students.value.find((s) => s.seat === seatId && s.id !== student.id);
      if (existingOccupant) {
        existingOccupant.seat = null;
      }

      // Assign new seat to the dragged student
      student.seat = seatId;
      updateSeatStatuses();
    }
  };

  // Click an occupied seat to remove its student
  const handleSeatClick = (seat: SeatCell): void => {
    if (seat.status === 'broken' || seat.status === 'blocked') {
      return;
    }
    const occupant = students.value.find((s) => s.seat === seat.id);
    if (occupant) {
      occupant.seat = null;
      updateSeatStatuses();
    }
  };

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

    updateSeatStatuses();
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
      $q.loading.show({ message: t('admin.seatManagement.savingData') });

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
          [...(location.LOCATION.SEATS || [])]
            .filter((seat) => seat.LS_SEAT_STATUS !== 1 && seat.LS_SEAT_STATUS !== 2)
            .sort(compareSeatsByLabelOrder)
            .map((seat) => ({
              seatId: seat.LS_ID,
              sessionLocationId: location.SL_ID,
            })),
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

          if (!seatId || !sessionLocationId || sessionLocationId < 1) {
            throw new Error(t('admin.seatManagement.notifications.saveError'));
          }

          seatAssignments.push({ enrollment, seatId, sessionLocationId });
        });
      }

      await bulkAssignEnrollmentSeats(
        seatAssignments.map((assignment) => ({
          ermId: assignment.enrollment.ERM_ID,
          lsId: assignment.seatId,
          slId: assignment.sessionLocationId,
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
      $q.loading.hide();
      isLoading.value = false;
    }
  };

  // Build the grid if we already have data
  if (activeSession.value) {
    initializeSeats();
  }

  const handleWindowFocus = (): void => {
    if (!isLoading.value) {
      void refreshStudentImages();
    }
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
    return activeLocation.value?.LOCATION_TOTAL_COLS || 10;
  });

  const splitLeftRight = computed((): boolean => {
    return (
      (activeLocation.value?.AISLE_AFTER_COLS?.length ?? 0) > 0 ||
      (activeLocation.value?.AISLE_AFTER_ROWS?.length ?? 0) > 0
    );
  });

  const aisleAfterCols = computed((): number[] => activeLocation.value?.AISLE_AFTER_COLS ?? []);
  const aisleAfterRows = computed((): number[] => activeLocation.value?.AISLE_AFTER_ROWS ?? []);

  const seatsByRow = computed((): SeatCell[][] => {
    if (!activeLocation.value?.SEATS) return [];

    const rowsMap: { [key: number]: SeatCell[] } = {};
    const seats = activeLocation.value.SEATS;

    seats.forEach((seat) => {
      const r = seat.LS_ROW_NO;
      if (!rowsMap[r]) {
        rowsMap[r] = [];
      }

      let status: SeatStatus = 'available';
      if (seat.LS_SEAT_STATUS === 1) {
        status = 'broken';
      } else if (seat.LS_SEAT_STATUS === 2) {
        status = 'blocked';
      } else {
        const occupant =
          currentRoomStudents.value.find((student) => student.seat === String(seat.LS_ID)) ?? null;
        if (occupant) {
          status = 'assigned';
        }
      }

      const student =
        status === 'assigned'
          ? (currentRoomStudents.value.find((item) => item.seat === String(seat.LS_ID)) ?? null)
          : null;

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
    const cols = activeLocation.value?.LOCATION_TOTAL_COLS || 1;
    const rows = activeLocation.value?.LOCATION_TOTAL_ROWS || 1;
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
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
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
    allSeats,
    gridCols,
    splitLeftRight,
    aisleAfterCols,
    aisleAfterRows,
    seatsByRow,
    seatStyle,
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
    // Drag state
    draggedStudentId,
    draggedOverSeatId,
    dragX,
    dragY,
    dragOffsetX,
    dragOffsetY,
    dragWidth,
    draggedStudentInfo,
    // Methods
    loadExamData,
    getSeatLabel,
    onMouseDown,
    onSeatEnter,
    onSeatLeave,
    onSeatDrop,
    handleSeatClick,
    swapSeatAssignments,
    handleCancel,
    handleSave,
  };
}
