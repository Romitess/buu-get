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
        :applicant-count="applicantCount"
        :paid-count="paidCount"
        :total-capacity="sessionTotalCapacity"
        hide-paid
        hide-main-separator
        count-with-capacity
        is-admin
      />
    </section>

    <!-- Horizontal layout: applicant list on the left, seat map on the right. -->
    <div class="seat-management-row">
      <div class="seat-management-list-column flex column min-width-0">
        <div class="student-list-card">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-subtitle1 text-weight-bold text-dark">
              {{ $t('admin.seatManagement.studentListTitle') }}
            </div>
            <q-badge color="primary" rounded :label="currentRoomCount" class="badge-seat-count" />
          </div>

          <div class="q-mb-md">
            <SearchBar v-model="searchQuery" full-width @search="handleSearch" />
          </div>

          <div class="student-list">
            <AppExamSeatCard
              v-for="student in filteredStudents"
              :key="student.ermId"
              :student-name="student.name"
              :student-id="student.id"
              :seat-number="getSeatLabel(student.seat)"
              :avatar-url="student.avatar"
              :remark="student.remark"
              :is-foreigner="student.isForeigner"
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
          @swap="swapSeatAssignments"
        />

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
            :disable="!isSeatAssignmentComplete"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatCard from 'src/components/exam/app-exam-seat-card.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSeatAssignmentMap from 'src/components/exam/app-exam-seat-assignment-map.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppExamSessionTime from 'src/components/exam/app-exam-session-time.vue';
import { useExamSeatManagement } from 'src/composables/use-exam-seat-management';

const {
  activeSessionId,
  activeSessionLocationId,
  sessionTimeTabs,
  roomOptions,
  searchQuery,
  splitLeftRight,
  seatsByRow,
  examTitle,
  examDate,
  sessionTime,
  sessionLocation,
  sessionTotalCapacity,
  applicantCount,
  paidCount,
  currentRoomCount,
  filteredStudents,
  isSeatAssignmentComplete,
  loadExamData,
  getSeatLabel,
  handleCancel,
  handleSave,
  swapSeatAssignments,
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

.seat-management-row {
  display: grid;
  grid-template-columns: minmax(360px, 0.38fr) minmax(0, 0.62fr);
  gap: 24px;
  height: 540px;
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
