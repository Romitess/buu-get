import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { BackendExam, BackendSession } from 'src/types/exam';
import { EnrollmentStatus, type BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamById } from 'src/services/exam.service';
import {
  fetchRawEnrollmentsByExamId,
  updateEnrollmentStatus,
} from 'src/services/enrollment.service';
import { DEFAULT_EXAM_TITLE } from 'src/constants/exam';
import { formatThaiLongDate } from 'src/utils/thai-date';
import { getImageUrl } from 'src/services/image.service';

/** Enrollment status codes shared with the backend */
const STATUS_PAID = 1;
const STATUS_SEAT_ASSIGNED = 2;
const STATUS_SEAT_PUBLISHED = 3;

/** Width of the custom drag ghost (px) used before the first real measurement */
const DEFAULT_DRAG_WIDTH = 320;

export type SeatStatus = 'available' | 'assigned' | 'broken' | 'blocked';

export interface SeatCell {
  id: string;
  label: string;
  status: SeatStatus;
  rowNo: number;
  colNo: number;
}

export interface StudentSeatInfo {
  ermId: number;
  id: string;
  name: string;
  seat: string | null;
  avatar: string | null;
  remark: string;
  isForeigner: boolean;
  titleEn: string | null;
}

/**
 * Composable for the "จัดการที่นั่งสอบ" page.
 * Owns exam/session/enrollment loading, the student list, the seat grid
 * and the custom drag-and-drop seat-assignment interaction.
 */
export function useExamSeatManagement() {
  const route = useRoute();
  const router = useRouter();
  const $q = useQuasar();
  const { t } = useI18n();

  const examId = Number(route.params.examId);

  // ── State ────────────────────────────────────────────────
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const activeSessionId = ref<number | null>(null);
  const sessions = ref<BackendSession[]>([]);
  const examData = ref<BackendExam | null>(null);
  const allEnrollments = ref<BackendEnrollmentDetail[]>([]);
  const students = ref<StudentSeatInfo[]>([]);
  const allSeats = ref<SeatCell[]>([]);
  const searchQuery = ref('');

  // ── Computed: exam / session info ────────────────────────
  const activeSession = computed((): BackendSession | null => {
    return sessions.value.find((s) => s.SS_ID === activeSessionId.value) ?? null;
  });

  const examTitle = computed((): string => {
    const baseTitle = examData.value?.EXAM_NAME || DEFAULT_EXAM_TITLE;
    if (activeSession.value?.SS_NAME) {
      return `${baseTitle} (${activeSession.value.SS_NAME})`;
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
    if (!activeSession.value?.LOCATION) return '-';
    const loc = activeSession.value.LOCATION;
    return `${loc.LOCATION_NAME} ${loc.LOCATION_ROOM_NO ? `(${loc.LOCATION_ROOM_NO})` : ''}`;
  });

  const sessionTotalCapacity = computed((): number => activeSession.value?.SS_CAPACITY || 0);

  const sessionEnrollments = computed((): BackendEnrollmentDetail[] => {
    return allEnrollments.value.filter((e) => e.SESSION_ID === activeSessionId.value);
  });

  // Total applicants who have PAID (PAID, SEAT_ASSIGNED, or SEAT_PUBLISHED)
  const applicantCount = computed(
    (): number =>
      sessionEnrollments.value.filter(
        (e) =>
          Number(e.ERM_STATUS) === STATUS_PAID ||
          Number(e.ERM_STATUS) === STATUS_SEAT_ASSIGNED ||
          Number(e.ERM_STATUS) === STATUS_SEAT_PUBLISHED,
      ).length,
  );

  // Paid applicants count (same as above for this view)
  const paidCount = computed((): number => applicantCount.value);

  const getSeatLabel = (seatId: string | null | undefined): string | null => {
    if (!seatId) return null;

    const seat = activeSession.value?.LOCATION?.SEATS?.find((s) => String(s.LS_ID) === seatId);
    return seat?.LS_SEAT_LABEL || seatId;
  };

  const isSeatAssignmentComplete = computed((): boolean => {
    return students.value.length > 0 && students.value.every((student) => Boolean(student.seat));
  });

  const filteredStudents = computed((): StudentSeatInfo[] => {
    const query = searchQuery.value.toLowerCase().trim();
    const list = query
      ? students.value.filter((s) => {
          const seatLabel = getSeatLabel(s.seat)?.toLowerCase() || '';
          return (
            s.name.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            seatLabel.includes(query)
          );
        })
      : [...students.value];

    // Sort: null seats (unassigned) first, then by name
    return list.sort((a, b) => {
      if (!a.seat && b.seat) return -1;
      if (a.seat && !b.seat) return 1;
      return a.name.localeCompare(b.name, 'th');
    });
  });

  // ── Seat grid ────────────────────────────────────────────
  // Sync seat visual status with student data
  const updateSeatStatuses = (): void => {
    allSeats.value.forEach((seat) => {
      const dbSeat = activeSession.value?.LOCATION?.SEATS?.find((s) => String(s.LS_ID) === seat.id);
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
      const isOccupied = students.value.some((s) => s.seat === seat.id);
      seat.status = isOccupied ? 'assigned' : 'available';
    });
  };

  // Pull seats from backend location
  const initializeSeats = (): void => {
    allSeats.value = [];
    if (!activeSession.value?.LOCATION?.SEATS) return;

    const seats = activeSession.value.LOCATION.SEATS;
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
      });
    });
    updateSeatStatuses();
  };

  const filterStudentsBySession = (): void => {
    if (!activeSessionId.value) {
      students.value = [];
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
      const physicalStatus = e.ERM_PHYSICAL_STATUS || '';
      const isForeigner = !!e.USER?.USER_PASSPORT_NO;
      const imagePath = e.USER?.IMAGE?.USER_IMAGE_URL || null;

      // Build English display name: "Mr. Somaun Jaidee"
      const titleEn = profile?.userTitleEn || null;
      const fullnameEn = profile?.userFullnameEn || null;
      const displayName =
        titleEn && fullnameEn
          ? `${titleEn} ${fullnameEn}`
          : profile?.userFullnameTh || e.USER?.USER_EMAIL || t('admin.seatManagement.noName');

      // Determine remark text
      let remark = '';
      if (isForeigner) {
        remark = 'ชาวต่างชาติ';
      } else if (physicalStatus && physicalStatus !== 'ทั่วไป') {
        remark = physicalStatus;
      } else {
        remark = 'ชาวไทย';
      }

      return {
        ermId: e.ERM_ID,
        id: e.USER?.USER_NATIONAL_ID || String(e.USER_ID),
        name: displayName,
        seat: e.LS_ID ? String(e.LS_ID) : null,
        avatar: imagePath ? getImageUrl(imagePath) : null,
        remark,
        isForeigner,
        titleEn,
      };
    });

    updateSeatStatuses();
  };

  // ── Data loading ─────────────────────────────────────────
  const loadExamData = async (): Promise<void> => {
    if (!examId) return;
    isLoading.value = true;
    error.value = null;
    try {
      $q.loading.show({ message: t('admin.seatManagement.loadingData') });
      examData.value = await fetchExamById(examId);

      sessions.value = examData.value.SESSIONS || [];
      const firstSession = sessions.value[0];
      if (firstSession) {
        activeSessionId.value = firstSession.SS_ID;
      }

      allEnrollments.value = await fetchRawEnrollmentsByExamId(examId);

      // Explicitly trigger the filter to update UI with session details immediately
      filterStudentsBySession();
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

  watch(activeSessionId, () => {
    initializeSeats();
    filterStudentsBySession();
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

      const expectedSeatByEnrollmentId = new Map<number, number | null>(
        students.value.map((student) => [
          student.ermId,
          student.seat ? Number(student.seat) : null,
        ]),
      );

      // 1-Phase sequential update to prevent backend race conditions and duplicate check bugs
      for (const student of students.value) {
        const currentEnrollment = allEnrollments.value.find((e) => e.ERM_ID === student.ermId);

        // Always assign the seat directly
        const assignedStatus = Number(EnrollmentStatus.SEAT_ASSIGNED);
        const currentStatus = Number(currentEnrollment?.ERM_STATUS);
        const nextStatus = currentStatus >= assignedStatus ? currentStatus : assignedStatus;

        await updateEnrollmentStatus(student.ermId, {
          LS_ID: student.seat ? Number(student.seat) : null,
          ERM_STATUS: nextStatus,
        });
      }

      // Refresh data to ensure sync with backend
      allEnrollments.value = await fetchRawEnrollmentsByExamId(examId);

      const savedSessionEnrollments = allEnrollments.value.filter(
        (enrollment) => enrollment.SESSION_ID === activeSessionId.value,
      );
      const hasUnsavedSeat = savedSessionEnrollments.some((enrollment) => {
        if (!expectedSeatByEnrollmentId.has(enrollment.ERM_ID)) return false;
        const actualSeatId = enrollment.LS_ID === null ? null : Number(enrollment.LS_ID);
        const expectedSeatId = expectedSeatByEnrollmentId.get(enrollment.ERM_ID);
        if (actualSeatId !== expectedSeatId) {
          console.error(
            `[DEBUG] Mismatch for ERM_ID ${enrollment.ERM_ID}: expected ${expectedSeatId}, got ${actualSeatId}`,
          );
          return true;
        }
        return false;
      });

      if (hasUnsavedSeat) {
        throw new Error(t('admin.seatManagement.notifications.saveError'));
      }

      filterStudentsBySession();

      $q.notify({
        color: 'positive',
        position: 'top',
        message: t('admin.seatManagement.notifications.saveSuccess'),
        icon: 'check_circle',
      });

      // Navigate to the candidates list page after successful save
      void router.push({
        name: 'admin-exam-seat-candidates',
        params: { examId: String(examId) },
        query: { sessionId: String(activeSessionId.value) },
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

  const gridCols = computed(() => {
    return activeSession.value?.LOCATION?.LOCATION_TOTAL_COLS || 10;
  });

  const splitLeftRight = computed((): boolean => {
    return activeSession.value?.LOCATION?.LOCATION_IS_SPLIT === 1;
  });

  const seatsByRow = computed((): SeatCell[][] => {
    if (!activeSession.value?.LOCATION?.SEATS) return [];

    const rowsMap: { [key: number]: SeatCell[] } = {};
    const seats = activeSession.value.LOCATION.SEATS;

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
        const isOccupied = students.value.some((s) => s.seat === String(seat.LS_ID));
        if (isOccupied) {
          status = 'assigned';
        }
      }

      rowsMap[r].push({
        id: String(seat.LS_ID),
        label: seat.LS_SEAT_LABEL || '',
        status: status,
        rowNo: seat.LS_ROW_NO,
        colNo: seat.LS_COL_NO,
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
    const cols = activeSession.value?.LOCATION?.LOCATION_TOTAL_COLS || 1;
    const rows = activeSession.value?.LOCATION?.LOCATION_TOTAL_ROWS || 1;
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
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
  });

  return {
    // State
    isLoading,
    error,
    activeSessionId,
    sessions,
    searchQuery,
    allSeats,
    gridCols,
    splitLeftRight,
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
    handleCancel,
    handleSave,
  };
}
