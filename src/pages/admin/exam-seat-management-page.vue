<template>
  <q-page class="q-pa-lg" style="background-color: var(--surface-page)">
    <div class="max-width-container">
      <!-- Header -->
      <AppBreadcrumbs />
      <AppPageHeader
        title="จัดการที่นั่งสอบ"
        subtitle="วางผังและจัดการที่นั่งสอบ เพื่อรองรับผู้เข้าสอบได้อย่างเหมาะสมและสะดวก"
      />

      <!-- Time Tabs -->
      <div class="q-mb-md">
        <AppExamSessionTime v-model="activeSessionId" :sessions="sessions" />
      </div>

      <!-- Exam Detail Header -->
      <section class="q-mb-lg">
        <AppExamInfoCard
          :title="examTitle"
          :date="examDate"
          :time="sessionTime"
          :location="sessionLocation"
          :applicant-count="applicantCount"
          :paid-count="paidCount"
          :total-capacity="sessionTotalCapacity"
          hide-paid
          hide-main-separator
          is-admin
        />
      </section>

      <!-- Main Layout -->
      <div class="row q-col-gutter-lg items-stretch">
        <!-- Left Panel: Student List (Back to left) -->
        <div class="col-12 col-md-4 flex column" style="min-width: 0">
          <div
            class="bg-white q-pa-lg border-radius-lg student-list-card custom-scroll-container full-height"
            style="width: 100%; min-width: 0; overflow: hidden"
          >
            <div class="row items-center justify-between q-mb-md">
              <div class="text-subtitle1 text-weight-bold text-dark">รายชื่อผู้สมัครและที่นั่ง</div>
              <q-badge
                color="primary"
                rounded
                :label="paidCount"
                class="q-px-md q-py-xs"
                style="border-radius: 100px; font-size: 14px"
              />
            </div>

            <div class="q-mb-md">
              <SearchBar v-model="searchQuery" full-width @search="handleSearch" />
            </div>

            <!-- Student Cards List with visible scroll -->
            <div class="student-scroll-area">
              <div class="column q-gutter-y-sm q-pr-sm">
                <!-- Wrap in native div to guarantee HTML5 drag events bubble perfectly -->
                <div
                  v-for="student in filteredStudents"
                  :key="student.id"
                  class="cursor-pointer"
                  @mousedown.prevent="onMouseDown($event, student.id)"
                >
                  <AppExamSeatCard
                    :student-name="student.name"
                    :student-id="student.id"
                    :seat-number="student.seat"
                    :avatar-url="student.avatar"
                  />
                </div>

                <!-- Empty State -->
                <div
                  v-if="filteredStudents.length === 0"
                  class="column items-center q-pa-xl text-grey-6"
                >
                  <q-icon name="person_search" size="48px" />
                  <div class="text-body1 q-mt-sm">ไม่พบรายชื่อผู้เข้าสอบ</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Seat Layout (Back to right) -->
        <div class="col-12 col-md-8" style="min-width: 0">
          <!-- Main Content Box with Border -->
          <div
            class="bg-white q-pt-md q-px-xl q-pb-xl border-radius-lg main-seat-grid-box"
            style="width: 100%; min-width: 0"
          >
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-weight-bold text-dark">แผนผังที่นั่งสอบ</div>
              <div class="row items-center q-gutter-x-lg">
                <div class="row items-center">
                  <div class="legend-dot available q-mr-sm"></div>
                  <span class="text-body2 text-dark font-weight-medium">ที่นั่งว่าง</span>
                </div>
                <div class="row items-center">
                  <div class="legend-dot assigned q-mr-sm"></div>
                  <span class="text-body2 text-dark font-weight-medium">จัดที่นั่งแล้ว</span>
                </div>
              </div>
            </div>

            <!-- Seat Grid Container with Overflow handling -->
            <div class="seat-grid-scroll-container">
              <div class="seat-grid">
                <AppExamSeatSquare
                  v-for="seat in allSeats"
                  :key="seat.id"
                  :seat-number="seat.id"
                  :status="seat.status"
                  class="seat-item"
                  :class="{ 'drag-over-effect': draggedOverSeatId === seat.id }"
                  @click="handleSeatClick(seat)"
                  @mouseenter="onSeatEnter(seat.id)"
                  @mouseleave="onSeatLeave(seat.id)"
                  @mouseup="onSeatDrop(seat.id)"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons (Closer together as requested) -->
          <div class="row justify-end q-mt-sm q-gutter-sm">
            <AppButton
              label="ยกเลิกการจัดที่นั่ง"
              class="btn-cancel-seat"
              flat
              @click="handleCancel"
            />
            <AppButton label="ยืนยันการจัดที่นั่ง" class="btn-confirm-seat" @click="handleSave" />
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Opaque Drag Ghost -->
    <div
      v-if="draggedStudentId && draggedStudentInfo"
      class="custom-drag-ghost"
      :style="{
        left: dragX - dragOffsetX + 'px',
        top: dragY - dragOffsetY + 'px',
        width: dragWidth + 'px',
      }"
    >
      <AppExamSeatCard
        :student-name="draggedStudentInfo.name"
        :student-id="draggedStudentInfo.id"
        :seat-number="draggedStudentInfo.seat"
        :avatar-url="draggedStudentInfo.avatar"
      />
    </div>

    <!-- Hidden native ghost to bypass browser fading -->
    <div
      id="hidden-drag-ghost"
      style="position: absolute; top: -1000px; left: -1000px; width: 1px; height: 1px; opacity: 0"
    ></div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatCard from 'src/components/exam/app-exam-seat-card.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import AppExamSeatSquare from 'src/components/exam/app-exam-seat-square.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppExamSessionTime from 'src/components/exam/app-exam-session-time.vue';
import type { BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import { fetchExamById } from 'src/services/exam.service';
import type { BackendExam } from 'src/types/exam';
import {
  fetchRawEnrollmentsByExamId,
  updateEnrollmentStatus,
} from 'src/services/enrollment.service';

const route = useRoute();
const $q = useQuasar();
const examId = Number(route.params.examId);

// Status Constants
const STATUS_PAID = 1;
const STATUS_SEAT_ASSIGNED = 2;

const activeSessionId = ref<number | null>(null);
const sessions = ref<BackendSession[]>([]);

const examData = ref<BackendExam | null>(null);

const examTitle = computed(() => {
  const baseTitle = examData.value?.EXAM_NAME || 'BUU - GET';
  if (activeSession.value?.SS_NAME) {
    return `${baseTitle} (${activeSession.value.SS_NAME})`;
  }
  return baseTitle;
});

const examDate = computed(() => {
  if (!examData.value?.EXAM_DATE) return '-';
  return new Date(examData.value.EXAM_DATE).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const activeSession = computed(() => {
  return sessions.value.find((s) => s.SS_ID === activeSessionId.value) || null;
});

const sessionTime = computed(() => {
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

const sessionLocation = computed(() => {
  if (!activeSession.value?.LOCATION) return '-';
  const loc = activeSession.value.LOCATION;
  return `${loc.LOCATION_NAME} ${loc.LOCATION_ROOM_NO ? `(${loc.LOCATION_ROOM_NO})` : ''}`;
});

const sessionTotalCapacity = computed(() => activeSession.value?.SS_CAPACITY || 0);

const sessionEnrollments = computed(() => {
  return allEnrollments.value.filter((e) => e.SESSION_ID === activeSessionId.value);
});

// Total applicants who have PAID (PAID or SEAT_ASSIGNED)
const applicantCount = computed(
  () =>
    sessionEnrollments.value.filter(
      (e) => Number(e.ERM_STATUS) === STATUS_PAID || Number(e.ERM_STATUS) === STATUS_SEAT_ASSIGNED,
    ).length,
);

// Paid applicants count (same as above for this view)
const paidCount = computed(() => applicantCount.value);
const searchQuery = ref('');

interface StudentSeatInfo {
  ermId: number;
  id: string;
  name: string;
  seat: string | null;
  avatar: string | null;
}

const allEnrollments = ref<BackendEnrollmentDetail[]>([]);
const students = ref<StudentSeatInfo[]>([]);

const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return students.value;
  return students.value.filter(
    (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query),
  );
});

const loadExamData = async () => {
  if (!examId) return;
  try {
    $q.loading.show({ message: 'กำลังโหลดข้อมูล...' });
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
    $q.notify({ type: 'negative', message: 'ไม่สามารถโหลดข้อมูลการสอบได้' });
  } finally {
    $q.loading.hide();
  }
};

const filterStudentsBySession = () => {
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
    name: e.USER?.PROFILE?.userFullnameTh || e.USER?.USER_EMAIL || 'ไม่มีชื่อ',
    seat: e.ERM_SEAT_NUMBER,
    avatar: null,
  }));

  updateSeatStatuses();
};

watch(activeSessionId, () => {
  filterStudentsBySession();
});

onMounted(() => {
  void loadExamData();
});

const handleSearch = (val: string | number | null) => {
  searchQuery.value = String(val || '');
};

// Mock Data for Seats (A1-A10, B1-B10, C1-C10, D1-D10)
const allSeats = ref<{ id: string; status: 'available' | 'assigned' }[]>([]);

// Drag and Drop State
const draggedStudentId = ref<string | null>(null);
const draggedOverSeatId = ref<string | null>(null);
const dragX = ref(0);
const dragY = ref(0);

const draggedStudentInfo = computed(() => {
  return students.value.find((s) => s.id === draggedStudentId.value);
});

// Sync seat visual status with student data
const updateSeatStatuses = () => {
  allSeats.value.forEach((seat) => {
    const isOccupied = students.value.some((s) => s.seat === seat.id);
    seat.status = isOccupied ? 'assigned' : 'available';
  });
};

// Initialize seats dynamically
const initializeSeats = () => {
  const rows = ['A', 'B', 'C', 'D'];
  for (const row of rows) {
    for (let i = 1; i <= 10; i++) {
      allSeats.value.push({ id: `${row}${i}`, status: 'available' });
    }
  }
  updateSeatStatuses();
};
initializeSeats();

// --- Custom Drag and Drop Handlers ---
const isDragging = ref(false);
const dragOffsetX = ref(0);
const dragOffsetY = ref(0);
const dragWidth = ref(320);

const onMouseDown = (e: MouseEvent, studentId: string) => {
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

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  dragX.value = e.clientX;
  dragY.value = e.clientY;
};

const onSeatEnter = (seatId: string) => {
  if (isDragging.value) {
    draggedOverSeatId.value = seatId;
  }
};

const onSeatLeave = (seatId: string) => {
  if (draggedOverSeatId.value === seatId) {
    draggedOverSeatId.value = null;
  }
};

const onSeatDrop = (seatId: string) => {
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

const onGlobalMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false;
    draggedStudentId.value = null;
    draggedOverSeatId.value = null;

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
  }
};

// Handle clicks to remove a student from a seat easily
const handleSeatClick = (seat: { id: string; status: 'available' | 'assigned' }) => {
  const occupant = students.value.find((s) => s.seat === seat.id);
  if (occupant) {
    occupant.seat = null; // Unassign seat
    updateSeatStatuses();
  }
};

const handleCancel = () => {
  console.log('Cancel assigning seats...');
};

const handleSave = async () => {
  if (!activeSessionId.value) return;
  try {
    $q.loading.show({ message: 'กำลังบันทึกข้อมูลผังที่นั่ง...' });

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
      message: 'บันทึกผังที่นั่งสำเร็จ',
      icon: 'check_circle',
    });
  } catch (error: unknown) {
    console.error('Failed to save seats', error);
    let message = 'ไม่สามารถบันทึกข้อมูลได้';

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
</script>

<style scoped lang="scss">
.max-width-container {
  width: 100%;
  max-width: 100%; /* Fully responsive full screen */
  padding: 0 16px;
  margin: 0 auto;
}

h1 {
  font-size: 1.75rem;
  letter-spacing: -0.5px;
}

.border-radius-lg {
  border-radius: 16px !important;
}

.main-seat-grid-box {
  border: 1px solid #757575 !important; /* Restored darker "black" border as requested */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-height: 400px;
  display: block;
  width: 100%;
}

.q-px-xl {
  padding-left: 32px !important;
  padding-right: 32px !important;
}

@media (min-width: 1024px) {
  .q-px-xl {
    padding-left: 48px !important;
    padding-right: 48px !important;
  }
}

.student-list-card {
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.student-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;

  /* Make scrollbar always visible for "คนเยอะ" */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
    &:hover {
      background: #aaa;
    }
  }
}

.legend-dot {
  width: 22px;
  height: 22px;
  border-radius: 6px;

  &.available {
    background-color: #ffffff;
    border: 1px solid #757575;
  }

  &.assigned {
    background-color: var(--primary-light);
  }
}

.seat-grid-scroll-container {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  padding: 8px 0;

  /* Ensure it doesn't overflow its parent */
  display: block;

  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #bdbdbd;
    border-radius: 10px;

    &:hover {
      background: #9e9e9e;
    }
  }
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(
    10,
    minmax(28px, 1fr)
  ); /* Boxes grow to fill space, allowing the grid to touch both edges */
  column-gap: clamp(8px, 1vw, 16px); /* A1 and A2 stay close together */
  row-gap: clamp(16px, 2vw, 28px); /* Vertical distance proportional */
  min-width: 0;
  width: 100%; /* Force grid to touch both left and right edges */
}

.seat-item {
  width: 100%;
  aspect-ratio: 1;
}

.drag-over-effect {
  /* Prevent bleeding out of scroll container by avoiding scale/box-shadow */
  background-color: #e3f2fd !important; /* Very light blue */
  border: 2px solid var(--primary) !important;
  opacity: 0.9;
}

.btn-cancel-seat {
  background-color: #e0e0e0 !important;
  color: #1a1a1a !important;
  border-radius: 8px !important;
  padding: 10px 32px !important;
  font-weight: 600;
}

.btn-confirm-seat {
  background-color: var(--primary) !important;
  color: white !important;
  border-radius: 8px !important;
  padding: 10px 32px !important;
  font-weight: 600;
}

.custom-drag-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  opacity: 1 !important;
  /* Removed transform to allow precise offset positioning */
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: white;
}

.font-weight-medium {
  font-weight: 500;
}
</style>
