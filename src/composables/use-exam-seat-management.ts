import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { BackendExam, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamById } from 'src/services/exam.service';
import {
  fetchRawEnrollmentsByExamId,
  updateEnrollmentStatus,
} from 'src/services/enrollment.service';
import { DEFAULT_EXAM_TITLE } from 'src/constants/exam';

/** Enrollment status codes shared with the backend */
const STATUS_PAID = 1;
const STATUS_SEAT_ASSIGNED = 2;

/** Width of the custom drag ghost (px) used before the first real measurement */
const DEFAULT_DRAG_WIDTH = 320;

export type SeatStatus = 'available' | 'assigned';

export interface SeatCell {
  id: string;
  status: SeatStatus;
}

export interface StudentSeatInfo {
  ermId: number;
  id: string;
  name: string;
  seat: string | null;
  avatar: string | null;
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

  const examDate = computed((): string => {
    if (!examData.value?.EXAM_DATE) return '-';
    return new Date(examData.value.EXAM_DATE).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  // Total applicants who have PAID (PAID or SEAT_ASSIGNED)
  const applicantCount = computed(
    (): number =>
      sessionEnrollments.value.filter(
        (e) =>
          Number(e.ERM_STATUS) === STATUS_PAID || Number(e.ERM_STATUS) === STATUS_SEAT_ASSIGNED,
      ).length,
  );

  // Paid applicants count (same as above for this view)
  const paidCount = computed((): number => applicantCount.value);

  const filteredStudents = computed((): StudentSeatInfo[] => {
    const query = searchQuery.value.toLowerCase().trim();
    const list = query
      ? students.value.filter(
          (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query),
        )
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
      const isOccupied = students.value.some((s) => s.seat === seat.id);
      seat.status = isOccupied ? 'assigned' : 'available';
    });
  };

  // Mock seat layout (A1-A10, B1-B10, C1-C10, D1-D10) — replace once backend provides layout
  const initializeSeats = (): void => {
    const rows = ['A', 'B', 'C', 'D'];
    for (const row of rows) {
      for (let i = 1; i <= 10; i++) {
        allSeats.value.push({ id: `${row}${i}`, status: 'available' });
      }
    }
    updateSeatStatuses();
  };

  const filterStudentsBySession = (): void => {
    if (!activeSessionId.value) {
      students.value = [];
      return;
    }

    // Only show students who have status PAID (1) or SEAT_ASSIGNED (2)
    const eligibleEnrollments = sessionEnrollments.value.filter(
      (e) => Number(e.ERM_STATUS) === STATUS_PAID || Number(e.ERM_STATUS) === STATUS_SEAT_ASSIGNED,
    );

    students.value = eligibleEnrollments.map((e) => ({
      ermId: e.ERM_ID,
      id: e.USER?.USER_NATIONAL_ID || String(e.USER_ID),
      name:
        e.USER?.PROFILE?.userFullnameTh || e.USER?.USER_EMAIL || t('admin.seatManagement.noName'),
      seat: e.ERM_SEAT_NUMBER,
      avatar: null,
    }));

    updateSeatStatuses();
  };

  // ── Data loading ─────────────────────────────────────────
  const loadExamData = async (): Promise<void> => {
    if (!examId) return;
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
    } catch (error) {
      console.error('Failed to load exam data', error);
      $q.notify({ type: 'negative', message: t('admin.seatManagement.notifications.loadError') });
    } finally {
      $q.loading.hide();
    }
  };

  watch(activeSessionId, () => {
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

    // Track global mouse movement for the ghost
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  const onSeatEnter = (seatId: string): void => {
    if (isDragging.value) {
      draggedOverSeatId.value = seatId;
    }
  };

  const onSeatLeave = (seatId: string): void => {
    if (draggedOverSeatId.value === seatId) {
      draggedOverSeatId.value = null;
    }
  };

  const onSeatDrop = (seatId: string): void => {
    if (!isDragging.value || !draggedStudentId.value) return;

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
    try {
      $q.loading.show({ message: t('admin.seatManagement.savingData') });

      // Save each student individually (Business Logic check is in the backend Service)
      const promises = students.value.map((student) => {
        return updateEnrollmentStatus(student.ermId, {
          ERM_SEAT_NUMBER: student.seat,
        });
      });

      await Promise.all(promises);

      // Refresh data to ensure sync with backend
      allEnrollments.value = await fetchRawEnrollmentsByExamId(examId);
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
      });
    } catch (error: unknown) {
      console.error('Failed to save seats', error);
      let message = t('admin.seatManagement.notifications.saveError');

      // Type-safe error handling for Axios/API errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: { message?: string } } };
        message = axiosError.response?.data?.message || message;
      }

      $q.notify({ type: 'negative', message });
    } finally {
      $q.loading.hide();
    }
  };

  // Build the (mock) grid up front so the layout renders before data arrives
  initializeSeats();

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
  });

  return {
    // State
    activeSessionId,
    sessions,
    searchQuery,
    allSeats,
    // Exam / session info
    examTitle,
    examDate,
    sessionTime,
    sessionLocation,
    sessionTotalCapacity,
    applicantCount,
    paidCount,
    filteredStudents,
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
    onMouseDown,
    onSeatEnter,
    onSeatLeave,
    onSeatDrop,
    handleSeatClick,
    handleCancel,
    handleSave,
  };
}
