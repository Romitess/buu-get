<template>
  <q-page class="seat-candidates-page q-px-lg q-px-sm-xl q-py-lg">
    <div class="full-width">
      <!-- Breadcrumbs -->
      <AppBreadcrumbs />

      <!-- Page Header -->
      <AppPageHeader
        :title="$t('admin.seatCandidates.pageTitle')"
        :subtitle="$t('admin.seatCandidates.pageSubtitle')"
      />

      <!-- Session Time Tabs -->
      <AppExamSessionTabs v-model="selectedSessionId" :sessions="sessions" />

      <!-- Exam Info Card -->
      <AppExamInfoCard
        v-if="exam"
        class="q-mb-md"
        :title="exam.EXAM_NAME"
        :date="formatThaiDate(exam.EXAM_DATE)"
        :time="sessionTime"
        :location="sessionLocation"
        :applicant-count="candidateCount"
        hide-paid
        hide-main-separator
        is-admin
      />

      <!-- Toolbar: Search + Action Buttons -->
      <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
        <SearchBar v-model="searchQuery" class="col-12 col-sm-auto" />

        <q-space class="gt-xs" />

        <div class="row q-gutter-sm col-12 col-sm-auto justify-end">
          <AppButton
            icon="badge"
            :label="$t('admin.seatCandidates.printVoucher')"
            color="primary"
            class="action-btn"
          />
          <ExportCsvButton
            :columns="columns"
            :rows="filteredRows"
            file-name-prefix="seat-candidates"
            class="action-btn"
          />
        </div>
      </nav>

      <!-- Table -->
      <main>
        <BaseTable
          :columns="columns"
          :rows="filteredRows"
          :loading="isLoading"
          :pagination="pagination"
          class="seat-candidates-table"
          @request="onRequest"
        >
          <template v-slot:body-cell-index="{ row }">
            <div class="text-center">{{ row.index }}</div>
          </template>

          <template v-slot:body-cell-nationalId="{ row }">
            <div class="text-center">{{ row.nationalId }}</div>
          </template>

          <template v-slot:body-cell-titleTh="{ row }">
            <div class="text-center">{{ row.titleTh }}</div>
          </template>

          <template v-slot:body-cell-fullnameTh="{ row }">
            <div class="text-center">{{ row.fullnameTh }}</div>
          </template>

          <template v-slot:body-cell-seatNumber="{ row }">
            <div class="text-center text-weight-bold">{{ row.seatNumber }}</div>
          </template>
        </BaseTable>
      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import { useExamSeatCandidates } from 'src/composables/use-exam-seat-candidates';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

const route = useRoute();
const { t } = useI18n();

const {
  exam,
  sessions,
  isLoading,
  searchQuery,
  selectedSessionId,
  filteredRows,
  candidateCount,
  sessionTime,
  sessionLocation,
  fetchData,
} = useExamSeatCandidates();

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: t('admin.seatCandidates.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 80px',
  },
  {
    name: 'nationalId',
    label: t('admin.seatCandidates.table.columns.nationalId'),
    field: 'nationalId',
    align: 'center',
  },
  {
    name: 'titleTh',
    label: t('admin.seatCandidates.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
  },
  {
    name: 'fullnameTh',
    label: t('admin.seatCandidates.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'center',
  },
  {
    name: 'seatNumber',
    label: t('admin.seatCandidates.table.columns.seatNumber'),
    field: 'seatNumber',
    align: 'center',
  },
];

const formatThaiDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const months = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

watch(filteredRows, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

watch(exam, (newExam) => {
  if (newExam?.SESSIONS?.length && !selectedSessionId.value) {
    const firstSession = newExam.SESSIONS[0];
    if (firstSession) {
      selectedSessionId.value = firstSession.SS_ID;
    }
  }
});

onMounted(() => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    void fetchData(examId);
  }
});
</script>

<style scoped lang="scss">
.action-btn {
  height: 40px;
  min-width: 160px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

.seat-candidates-table {
  :deep(.q-table__container) {
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }
}
</style>
