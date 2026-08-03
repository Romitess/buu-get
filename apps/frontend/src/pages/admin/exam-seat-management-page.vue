<template>
  <q-page class="page-container surface-page-bg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.seatManagement.pageTitle')"
      :subtitle="$t('admin.seatManagement.pageSubtitle')"
      class="seat-page-header"
    />

    <div class="session-tabs-wrap">
      <AppExamSessionTime v-model="activeSessionId" :sessions="sessionTimeTabs" />
    </div>

    <section class="q-mb-md">
      <AppExamInfoCard
        v-model:selected-location-id="activeSessionLocationId"
        :title="examTitle"
        :date="examDate"
        :time="sessionTime"
        :location="sessionLocation"
        :location-options="roomOptions"
        :applicant-count="currentRoomCount"
        :paid-count="paidCount"
        :total-capacity="currentRoomCapacity"
        hide-paid
        hide-main-separator
        count-with-capacity
        is-admin
      />
    </section>

    <SeatManagementSkeleton v-if="isLoading" />

    <template v-else>
      <!-- Horizontal layout: applicant list on the left, seat map on the right. -->
      <div class="seat-management-row">
        <div class="seat-management-list-column flex column min-width-0">
          <div class="student-list-card">
            <div class="row items-center justify-between q-mb-md q-gutter-sm">
              <div class="text-subtitle1 text-weight-bold text-dark">
                {{ $t('admin.seatManagement.studentListTitle') }}
              </div>
              <div class="row items-center no-wrap q-gutter-sm">
                <AppButton
                  v-if="hasAnyAssignedSeat"
                  :label="$t('admin.seatManagement.rearrangeAllButton')"
                  class="btn-rearrange-seats"
                  outline
                  @click="handleRearrangeAllSeats"
                />
                <q-badge
                  color="primary"
                  rounded
                  :label="currentRoomCount"
                  class="badge-seat-count"
                />
              </div>
            </div>

            <div
              v-if="unassignedStudentCount > 0"
              class="unassigned-banner text-body2 q-mb-md"
            >
              {{
                $t('admin.seatManagement.unassignedBanner', {
                  count: unassignedStudentCount,
                })
              }}
            </div>

            <div class="student-list-filters q-mb-md">
              <SearchBar v-model="searchQuery" full-width @search="handleSearch" />
              <AppSelect
                v-model="applicantTypeFilter"
                :options="applicantTypeOptions"
                :label="$t('admin.seatManagement.applicantTypeFilterLabel')"
                popup-content-class="applicant-type-select-menu"
                emit-value
                map-options
                dense
                outlined
                options-dense
                class="applicant-type-select"
              />
            </div>

            <div class="student-list">
              <AppExamSeatCard
                v-for="student in filteredStudents"
                :key="student.ermId"
                :erm-id="student.ermId"
                :student-name="student.name"
                :student-id="student.id"
                :seat-number="getSeatLabel(student.seat)"
                :avatar-url="student.avatar"
                :remark="student.remark"
                :bg-color="student.bgColor"
                :is-foreigner="student.isForeigner"
                :drag-hint="$t('admin.seatManagement.dragToSeatHint')"
              />

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

        <div class="seat-management-map-column flex column min-width-0">
          <AppExamSeatAssignmentMap
            class="col"
            :title="$t('admin.seatManagement.seatLayoutTitle')"
            :seats-by-row="seatsByRow"
            :split-left-right="splitLeftRight"
            :aisle-after-cols="aisleAfterCols"
            :aisle-after-rows="aisleAfterRows"
            :swap-mode-label="$t('admin.seatManagement.swapModeLabel')"
            @swap="swapSeatAssignments"
            @assign-student="onAssignStudentFromList"
          />

          <div class="row justify-end q-mt-sm q-gutter-sm">
            <AppButton
              :label="$t('admin.seatManagement.cancelButton')"
              class="btn-cancel-seat"
              flat
              @click="handleCancel"
            />
            <AppButton
              :label="saveButtonLabel"
              class="btn-confirm-seat"
              :disable="!isSeatAssignmentComplete"
              @click="handleSave"
            />
          </div>
        </div>
      </div>
    </template>

    <AppSeatPlacementChoiceDialog
      v-model="showPlacementChoiceDialog"
      :title="$t('admin.seatManagement.placementChoice.title')"
      :message="$t('admin.seatManagement.placementChoice.message')"
      :unassigned-count="unassignedStudentCount"
      :unassigned-hint="
        $t('admin.seatManagement.placementChoice.unassignedHint', {
          count: unassignedStudentCount,
        })
      "
      :rearrange-label="$t('admin.seatManagement.placementChoice.rearrange')"
      :keep-label="$t('admin.seatManagement.placementChoice.keep')"
      @rearrange="handleRearrangeAllSeats"
      @keep="handleKeepExistingSeats"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import AppSelect from 'src/components/base/app-select.vue';
import AppExamSeatCard from 'src/components/exam/app-exam-seat-card.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSeatAssignmentMap from 'src/components/exam/app-exam-seat-assignment-map.vue';
import AppSeatPlacementChoiceDialog from 'src/components/exam/app-seat-placement-choice-dialog.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppExamSessionTime from 'src/components/exam/app-exam-session-time.vue';
import { useExamSeatManagement } from 'src/composables/use-exam-seat-management';
import { SeatManagementSkeleton } from 'src/components/base/skeleton';

const $q = useQuasar();
const { t } = useI18n();

const {
  isLoading,
  activeSessionId,
  activeSessionLocationId,
  sessionTimeTabs,
  roomOptions,
  searchQuery,
  applicantTypeFilter,
  applicantTypeOptions,
  splitLeftRight,
  aisleAfterCols,
  aisleAfterRows,
  seatsByRow,
  examTitle,
  examDate,
  sessionTime,
  sessionLocation,
  paidCount,
  currentRoomCount,
  currentRoomCapacity,
  filteredStudents,
  isSeatAssignmentComplete,
  unassignedStudentCount,
  hasAnyAssignedSeat,
  showPlacementChoiceDialog,
  saveButtonLabel,
  loadExamData,
  getSeatLabel,
  handleCancel,
  handleSave,
  swapSeatAssignments,
  assignStudentToSeat,
  handleRearrangeAllSeats,
  handleKeepExistingSeats,
} = useExamSeatManagement();

onMounted(() => {
  void loadExamData();
});

const handleSearch = (val: string | number | null): void => {
  searchQuery.value = String(val || '');
};

const onAssignStudentFromList = (ermId: number, seatId: string): void => {
  const assigned = assignStudentToSeat(ermId, seatId);
  if (!assigned) {
    $q.notify({
      type: 'warning',
      position: 'top',
      message: t('admin.seatManagement.notifications.assignSeatFailed'),
    });
  }
};
</script>

<style scoped lang="scss">
.surface-page-bg {
  background-color: var(--surface-page);
}

.min-width-0 {
  min-width: 0;
}

.seat-management-row {
  display: grid;
  grid-template-columns: minmax(360px, 0.38fr) minmax(0, 0.62fr);
  gap: 16px;
  height: clamp(600px, 72vh, 760px);
  align-items: stretch;

  & > div {
    height: 100%;
    min-width: 0;
  }
}

.seat-management-list-column,
.seat-management-map-column {
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.seat-page-header {
  margin-bottom: 8px !important;
}

.session-tabs-wrap {
  margin-top: -2px;
  margin-bottom: 8px;
}

.student-list-card {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 10px;
  background: #ffffff;
  padding: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.badge-seat-count {
  min-width: 54px;
  justify-content: center;
  padding: 4px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.unassigned-banner {
  background: #e8f1fb;
  border: 1px solid #b7d4f0;
  border-radius: 8px;
  padding: 10px 12px;
  color: #1a5278;
}

.student-list-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;

  .search-bar {
    flex: 1 1 180px;
    min-width: 0;
  }
}

.applicant-type-select {
  flex: 0 1 180px;
  min-width: 160px;
  max-width: 100%;

  :deep(.q-field__control) {
    border-radius: var(--radius-10) !important;
  }
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #777777;
    border-radius: 999px;
  }
}

.btn-rearrange-seats {
  border-radius: 8px !important;
  font-weight: 600;
  text-transform: none;
}

.btn-cancel-seat {
  background-color: var(--neutral-gray-light) !important;
  color: var(--text-primary) !important;
  border-radius: 8px !important;
  padding: 10px 32px !important;
  font-weight: 600;
}

.btn-confirm-seat {
  background-color: var(--primary, #0d47a1) !important;
  color: var(--text-on-primary) !important;
  border-radius: 8px !important;
  padding: 10px 32px !important;
  font-weight: 600;
}
</style>

<style lang="scss">
/* Menu teleports to body — show all applicant type options without scrolling */
.app-select-menu.applicant-type-select-menu {
  max-height: none !important;
}
</style>
