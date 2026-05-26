<template>
  <q-page class="page-container surface-page-bg">
    <!-- Header -->
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.seatManagement.pageTitle')"
      :subtitle="$t('admin.seatManagement.pageSubtitle')"
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
      <div class="col-12 col-md-4 flex column min-width-0">
        <div
          class="bg-white q-pa-lg border-radius-lg student-list-card custom-scroll-container full-height full-width min-width-0 overflow-hidden"
        >
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1 text-weight-bold text-dark">
              {{ $t('admin.seatManagement.studentListTitle') }}
            </div>
            <q-badge
              color="primary"
              rounded
              :label="paidCount"
              class="q-px-md q-py-xs badge-seat-count"
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
                <div class="text-body1 q-mt-sm">
                  {{ $t('admin.seatManagement.emptyStudentList') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Seat Layout (Back to right) -->
      <div class="col-12 col-md-8 min-width-0">
        <!-- Main Content Box with Border -->
        <div
          class="bg-white q-pt-md q-px-xl q-pb-xl border-radius-lg main-seat-grid-box full-width min-width-0"
        >
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-weight-bold text-dark">
              {{ $t('admin.seatManagement.seatLayoutTitle') }}
            </div>
            <AppSeatLegend :items="legendItems" />
          </div>

          <!-- Seat Grid Container with Overflow handling -->
          <div class="seat-grid-scroll-container">
            <div
              v-if="seatsByRow && seatsByRow.length > 0"
              class="seat-grid-wrapper"
              :style="{ gap: seatStyle.rowGap }"
            >
              <!-- Render each row separately to lock position -->
              <div
                v-for="(rowSeats, rowIndex) in seatsByRow"
                :key="rowIndex"
                class="seat-row"
                :style="{ gap: seatStyle.colGap }"
              >
                <template v-for="(seat, colIndex) in rowSeats" :key="seat.id">
                  <!-- Aisle Gap between left/right halves -->
                  <div
                    v-if="
                      splitLeftRight &&
                      colIndex === Math.ceil(rowSeats.length / 2) &&
                      rowSeats.length > 1
                    "
                    class="aisle-gap"
                    :style="{ width: seatStyle.aisleWidth, height: seatStyle.height }"
                  ></div>

                  <div
                    class="seat-item"
                    :style="{ width: seatStyle.width, height: seatStyle.height }"
                  >
                    <AppExamSeatSquare
                      :seat-number="seat.label"
                      :status="seat.status"
                      :style="{ width: '100%', height: '100%' }"
                      :class="{ 'drag-over-effect': draggedOverSeatId === seat.id }"
                      @click="handleSeatClick(seat)"
                      @mouseenter="onSeatEnter(seat.id)"
                      @mouseleave="onSeatLeave(seat.id)"
                      @mouseup="onSeatDrop(seat.id)"
                    />
                  </div>
                </template>
              </div>
            </div>
            <!-- Empty State -->
            <div v-else class="column items-center q-pa-xl text-grey-6">
              <q-icon name="grid_off" size="48px" />
              <div class="text-body1 q-mt-sm">ไม่มีข้อมูลผังที่นั่ง</div>
            </div>
          </div>
        </div>

        <!-- Action Buttons (Closer together as requested) -->
        <div class="row justify-end q-mt-sm q-gutter-sm">
          <AppButton
            :label="$t('admin.seatManagement.cancelButton')"
            class="btn-cancel-seat"
            flat
            @click="handleCancel"
          />
          <AppButton
            :label="$t('admin.seatManagement.saveButton')"
            class="btn-confirm-seat"
            @click="handleSave"
          />
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
    <div id="hidden-drag-ghost" class="hidden-drag-ghost-box"></div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatCard from 'src/components/exam/app-exam-seat-card.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import AppExamSeatSquare from 'src/components/exam/app-exam-seat-square.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppExamSessionTime from 'src/components/exam/app-exam-session-time.vue';
import AppSeatLegend from 'src/components/exam/app-seat-legend.vue';
import { useExamSeatManagement } from 'src/composables/use-exam-seat-management';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const legendItems = computed(() => [
  { label: t('admin.seatManagement.availableSeat'), dotClass: 'available' },
  { label: t('admin.seatManagement.assignedSeat'), dotClass: 'assigned' },
  { label: 'ชำรุด', dotClass: 'broken' },
]);

const {
  activeSessionId,
  sessions,
  searchQuery,
  splitLeftRight,
  seatsByRow,
  seatStyle,
  examTitle,
  examDate,
  sessionTime,
  sessionLocation,
  sessionTotalCapacity,
  applicantCount,
  paidCount,
  filteredStudents,
  draggedStudentId,
  draggedOverSeatId,
  dragX,
  dragY,
  dragOffsetX,
  dragOffsetY,
  dragWidth,
  draggedStudentInfo,
  loadExamData,
  onMouseDown,
  onSeatEnter,
  onSeatLeave,
  onSeatDrop,
  handleSeatClick,
  handleCancel,
  handleSave,
} = useExamSeatManagement();

onMounted(() => {
  void loadExamData();
});

const handleSearch = (val: string | number | null): void => {
  searchQuery.value = String(val || '');
};
</script>

<style scoped lang="scss">
.surface-page-bg {
  background-color: var(--surface-page);
}

.min-width-0 {
  min-width: 0;
}

.badge-seat-count {
  border-radius: 100px;
  font-size: 14px;
}

.hidden-drag-ghost-box {
  position: absolute;
  top: -1000px;
  left: -1000px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

/* Base Layout & Containers */
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
  border: 1px solid var(--seat-grid-border) !important; /* Restored darker "black" border as requested */
  box-shadow: var(--seat-grid-box-shadow);
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
    background: var(--seat-scrollbar-track);
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--seat-scrollbar-thumb);
    border-radius: 10px;
    &:hover {
      background: var(--seat-scrollbar-thumb-hover);
    }
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
    background: var(--seat-grid-scrollbar-thumb);
    border-radius: 10px;

    &:hover {
      background: var(--seat-grid-scrollbar-thumb-hover);
    }
  }
}

.seat-grid-wrapper {
  display: flex;
  flex-direction: column;
  width: fit-content;
  align-items: center;
  margin: 0 auto;
}

.seat-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  width: fit-content;
}

.seat-item {
  flex-shrink: 0;
}

.aisle-gap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    width: 2px;
    border-left: 2px dashed var(--q-primary, #1976d2);
    opacity: 0.35;
  }
}

.drag-over-effect {
  /* Prevent bleeding out of scroll container by avoiding scale/box-shadow */
  background-color: var(--seat-drag-over-bg) !important; /* Very light blue */
  border: 2px solid var(--primary) !important;
  opacity: 0.9;
}

.btn-cancel-seat {
  background-color: var(--neutral-gray-light) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  padding: 10px 32px !important;
  font-weight: 600;
}

.btn-confirm-seat {
  background-color: var(--primary) !important;
  color: var(--text-on-primary) !important;
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
  box-shadow: var(--seat-ghost-shadow);
  border-radius: 8px;
  background: var(--surface-card);
}

.font-weight-medium {
  font-weight: 500;
}
</style>
