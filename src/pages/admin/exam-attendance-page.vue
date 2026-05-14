<template>
  <q-page class="attendance-page q-px-lg q-px-sm-xl q-py-lg">
    <div class="full-width">
      <AppBreadcrumbs />
      <AppPageHeader
        title="ประวัติการเข้าสอบ"
        subtitle="ตรวจสอบประวัติการเข้าสอบ พร้อมดูรายละเอียดข้อมูลย้อนหลัง"
      />

      <AppExamSessionTabs v-model="selectedSessionId" :sessions="exam?.SESSIONS" />

      <AppExamInfoCard
        v-if="exam"
        class="q-mb-md"
        :title="exam.EXAM_NAME"
        :date="formatThaiDate(exam.EXAM_DATE)"
        :time="selectedSessionTime"
        :location="selectedSessionLocation"
        :applicant-count="sessionAttendedCount"
        :total-capacity="sessionTotalCount"
        is-admin
        is-attendance
      />

      <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
        <SearchBar
          v-model="searchQuery"
          placeholder="ค้นหา"
          class="search-bar col-12 col-sm-auto"
        />
        <q-space class="gt-xs" />
        <ExportCsvButton
          :columns="columns"
          :rows="filteredAttendances"
          file-name-prefix="exam-attendances"
          class="export-btn col-12 col-sm-auto"
        />
      </nav>

      <main>
        <BaseTable
          :columns="columns"
          :rows="filteredAttendances"
          :loading="isLoading"
          :pagination="pagination"
          class="attendance-table"
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
            <div class="text-left">{{ row.fullnameTh }}</div>
          </template>

          <template v-slot:body-cell-seatNumber="{ row }">
            <div class="text-center">{{ row.seatNumber }}</div>
          </template>

          <template v-slot:body-cell-attendanceStatus="{ row }">
            <div class="text-center">
              <AttendanceStatusBadge :status="row.attendanceStatus" />
            </div>
          </template>

          <template v-slot:body-cell-checkInTime="{ row }">
            <div class="text-center">{{ row.checkInTime || '' }}</div>
          </template>
        </BaseTable>
      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import AttendanceStatusBadge from 'src/components/shared/attendance-status-badge.vue';
import SearchBar from 'src/components/shared/SearchBar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import { useExamAttendances } from 'src/composables/use-exam-attendances';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { ExamAttendStatus } from 'src/types/enrollment.types';

const route = useRoute();

const {
  isLoading,
  exam,
  searchQuery,
  selectedSessionId,
  filteredAttendances,
  sessionTotalCount,
  sessionAttendedCount,
  fetchAttendances,
} = useExamAttendances();

const selectedSession = computed(() => {
  return exam.value?.SESSIONS?.find((s) => s.SS_ID === selectedSessionId.value) || null;
});

const selectedSessionTime = computed(() => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed(() => {
  if (!selectedSession.value?.LOCATION) return '-';
  const loc = selectedSession.value.LOCATION;
  return `${loc.LOCATION_NAME}${loc.LOCATION_ROOM_NO ? ` (${loc.LOCATION_ROOM_NO})` : ''}`;
});

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

watch(exam, (newExam) => {
  if (newExam && newExam.SESSIONS && newExam.SESSIONS.length > 0 && !selectedSessionId.value) {
    const firstSession = newExam.SESSIONS[0];
    if (firstSession) {
      selectedSessionId.value = firstSession.SS_ID;
    }
  }
});

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: 'ลำดับ',
    field: 'index',
    align: 'center',
    style: 'width: 60px',
  },
  {
    name: 'nationalId',
    label: 'เลขประจำตัว',
    field: 'nationalId',
    align: 'center',
  },
  {
    name: 'titleTh',
    label: 'คำนำหน้า',
    field: 'titleTh',
    align: 'center',
  },
  {
    name: 'fullnameTh',
    label: 'ชื่อ-นามสกุล',
    field: 'fullnameTh',
    align: 'left',
  },
  {
    name: 'seatNumber',
    label: 'ที่นั่งสอบ',
    field: 'seatNumber',
    align: 'center',
  },
  {
    name: 'attendanceStatus',
    label: 'สถานะ',
    field: 'attendanceStatus',
    align: 'center',
    format: (val: ExamAttendStatus) => {
      switch (val) {
        case ExamAttendStatus.INTIME:
          return 'เข้าสอบแล้ว';
        case ExamAttendStatus.LATE:
          return 'สาย';
        case ExamAttendStatus.MISSING:
          return 'ขาด';
        default:
          return 'ขาด';
      }
    },
  },
  {
    name: 'checkInTime',
    label: 'เวลาเข้าสอบ',
    field: 'checkInTime',
    align: 'center',
  },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchAttendances(examId);
    pagination.value.rowsNumber = filteredAttendances.value.length;
  }
};

watch(filteredAttendances, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.attendance-page {
  min-height: 0 !important;
}

.search-bar {
  min-width: 300px;
  @media (max-width: $breakpoint-xs-max) {
    min-width: 100%;
  }
}

.export-btn {
  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

.attendance-table {
  :deep(.q-table__container) {
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }
}
</style>
