<template>
  <q-page class="page-container attendance-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.examAttendance.title')"
      :subtitle="$t('admin.examAttendance.subtitle')"
    />

    <AppExamSessionTabs v-model="selectedSessionId" :sessions="exam?.SESSIONS" />

    <AppExamInfoCard
      v-if="exam"
      class="q-mb-md"
      v-model:selected-location-id="selectedSessionLocationId"
      :title="
        formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
        exam.EXAM_NAME
      "
      :date="examDateLabel"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :location-options="roomOptions"
      :applicant-count="sessionAttendedCount"
      :total-capacity="currentSessionCapacity"
      is-admin
      is-attendance
    />

    <nav class="row items-center q-mb-lg q-gutter-x-md">
      <div class="col">
        <SearchBar
          v-model="searchQuery"
          :placeholder="$t('admin.examAttendance.searchPlaceholder')"
        />
      </div>
      <div class="col-shrink row q-gutter-x-md no-wrap">
        <AppButton
          icon="assignment_ind"
          :label="$t('admin.examAttendance.checkInButton')"
          color="primary"
          class="action-btn"
          @click="openCheckInDialog"
        />
        <ExportCsvButton
          :columns="columns"
          :rows="filteredAttendances"
          file-name-prefix="exam-attendances"
          class="action-btn"
        />
      </div>
    </nav>

    <main>
      <BaseTable
        :columns="columns"
        :rows="filteredAttendances"
        :loading="isLoading"
        :pagination="pagination"
        :empty-label="$t('admin.examAttendance.noData')"
        class="attendance-table"
        @request="onRequest"
      >
        <template v-slot:body-cell-titleTh="{ row }">
          <div class="text-center">{{ row.titleTh }}</div>
        </template>

        <template v-slot:body-cell-fullnameTh="{ row }">
          <div class="attendance-fullname-cell">{{ row.fullnameTh }}</div>
        </template>

        <template v-slot:body-cell-seatNumber="{ row }">
          <div class="text-center">{{ row.seatNumber }}</div>
        </template>

        <template v-slot:body-cell-attendanceStatus="{ row }">
          <AttendanceStatusBadge :status="row.attendanceStatus" />
        </template>
      </BaseTable>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import DialogAttendanceCheckin from 'src/components/exam/dialog-attendance-checkin.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import AttendanceStatusBadge from 'src/components/shared/attendance-status-badge.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import { useExamAttendances } from 'src/composables/use-exam-attendances';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { ExamAttendStatus } from 'src/types/enrollment.types';
import type { BackendSession } from 'src/types/exam';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';

interface SessionLocationOption {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
  LOCATION: NonNullable<BackendSession['LOCATION']>;
}

const route = useRoute();
const i18n = useI18n();

const {
  isLoading,
  exam,
  searchQuery,
  selectedSessionId,
  selectedSessionLocationId,
  activeSessionIds,
  filteredAttendances,
  sessionAttendedCount,
  fetchExam,
  fetchAttendances,
} = useExamAttendances();

const $q = useQuasar();

const examDateEnglishLabel = computed((): string => {
  if (!exam.value?.EXAM_DATE) return '-';
  const date = new Date(exam.value.EXAM_DATE);
  if (isNaN(date.getTime())) return exam.value.EXAM_DATE;
  const day = date.getDate();
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
});

const openCheckInDialog = () => {
  const examId = Number(route.params.examId);
  if (!examId) return;

  $q.dialog({
    component: DialogAttendanceCheckin,
    componentProps: {
      attendances: filteredAttendances.value,
      examId,
      sessionIds: Array.from(activeSessionIds.value),
      examName:
        formatExamDisplayTitle(
          exam.value?.EXAM_NAME,
          exam.value?.EXAM_ROUND,
          exam.value?.EXAM_FISCAL_YEAR,
        ) ||
        exam.value?.EXAM_NAME ||
        '',
      examDate: examDateEnglishLabel.value,
      examTime: selectedSessionTime.value,
      examLocation: selectedSessionLocation.value,
      examRound: exam.value?.EXAM_ROUND || '',
      onCheckedIn: () => {
        void reloadAttendances();
      },
    },
  });
};

const getMonthName = (monthIndex: number): string => i18n.t(`common.months[${monthIndex}]`);

const examDateLabel = computed((): string => {
  if (!exam.value?.EXAM_DATE) return '-';
  const date = new Date(exam.value.EXAM_DATE);
  if (isNaN(date.getTime())) return exam.value.EXAM_DATE;
  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const isThai = i18n.locale.value.startsWith('th');
  const year = date.getFullYear() + (isThai ? 543 : 0);
  return `${day} ${month} ${year}`;
});

const selectedSession = computed(() => {
  return exam.value?.SESSIONS?.find((s) => s.SS_ID === selectedSessionId.value) || null;
});

const getSessionTimeKey = (session: NonNullable<typeof selectedSession.value>): string => {
  const start = String(session.SS_START_TIME || '').substring(0, 5);
  const end = String(session.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
};

const activeTimeSessions = computed(() => {
  if (!selectedSession.value) return [];
  const activeKey = getSessionTimeKey(selectedSession.value);
  return (exam.value?.SESSIONS ?? []).filter((session) => getSessionTimeKey(session) === activeKey);
});

const sessionLocations = computed<SessionLocationOption[]>(() => {
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

const formatLocationLabel = (location?: NonNullable<BackendSession['LOCATION']> | null): string => {
  if (!location) return '-';
  return `${location.LOCATION_NAME}${location.LOCATION_ROOM_NO ? ` (${location.LOCATION_ROOM_NO})` : ''}`;
};

const roomOptions = computed(() => {
  const rooms = sessionLocations.value.map((item) => ({
    value: item.SL_ID as number | null,
    label: formatLocationLabel(item.LOCATION),
  }));

  if (rooms.length === 0) return [];

  return [{ label: i18n.t('admin.examAttendance.allRooms'), value: null }, ...rooms];
});

const sessionLocationLabelList = computed(() => {
  const labels = sessionLocations.value
    .map((item) => formatLocationLabel(item.LOCATION))
    .filter((label) => label !== '-');
  return [...new Set(labels)];
});

const selectedSessionTime = computed(() => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed(() => {
  if (selectedSessionLocationId.value != null) {
    const matched = sessionLocations.value.find(
      (item) => item.SL_ID === selectedSessionLocationId.value,
    );
    if (matched) return formatLocationLabel(matched.LOCATION);
  }

  if (sessionLocationLabelList.value.length === 0) return '-';
  return i18n.t('admin.examAttendance.allRooms');
});

const getLocationCapacity = (item: SessionLocationOption): number => {
  const locationSeatCount = item.LOCATION.SEATS?.length;
  if (locationSeatCount && locationSeatCount > 0) return locationSeatCount;
  return (
    activeTimeSessions.value.find((session) => session.SS_ID === item.SS_ID)?.SS_CAPACITY ?? 0
  );
};

const currentSessionCapacity = computed(() => {
  if (sessionLocations.value.length > 0) {
    if (selectedSessionLocationId.value != null) {
      const matched = sessionLocations.value.find(
        (item) => item.SL_ID === selectedSessionLocationId.value,
      );
      return matched ? getLocationCapacity(matched) : 0;
    }

    return sessionLocations.value.reduce((total, item) => total + getLocationCapacity(item), 0);
  }

  return activeTimeSessions.value.reduce((total, session) => total + (session.SS_CAPACITY ?? 0), 0);
});

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
  sortBy: 'nationalId',
  descending: false,
});

const columns = computed<QTableColumn[]>(() => {
  void i18n.locale.value;
  return [
  {
    name: 'index',
    label: i18n.t('admin.examAttendance.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 60px',
  },
  {
    name: 'nationalId',
    label: i18n.t('admin.examAttendance.columns.nationalId'),
    field: 'testTakerCode',
    align: 'center',
    format: (val: string | null) => val || '-',
  },
  {
    name: 'location',
    label: i18n.t('admin.examAttendance.columns.location'),
    field: 'location',
    align: 'center',
  },
  {
    name: 'titleTh',
    label: i18n.t('admin.examAttendance.columns.titleTh'),
    field: 'titleTh',
    align: 'center',
  },
  {
    name: 'fullnameTh',
    label: i18n.t('admin.examAttendance.columns.fullnameTh'),
    field: 'fullnameTh',
    align: 'center',
  },
  {
    name: 'seatNumber',
    label: i18n.t('admin.examAttendance.columns.seatNumber'),
    field: 'seatNumber',
    align: 'center',
  },
  {
    name: 'attendanceStatus',
    label: i18n.t('admin.examAttendance.columns.attendanceStatus'),
    field: 'attendanceStatus',
    align: 'center',
    format: (val: ExamAttendStatus) => {
      switch (val) {
        case ExamAttendStatus.INTIME:
          return i18n.t('admin.examAttendance.status.intime');
        case ExamAttendStatus.MISSING:
          return i18n.t('admin.examAttendance.status.missing');
        default:
          return i18n.t('admin.examAttendance.status.missing');
      }
    },
  },
  {
    name: 'checkInTime',
    label: i18n.t('admin.examAttendance.columns.checkInTime'),
    field: 'checkInTime',
    align: 'center',
  },
];
});

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  await fetchExam(examId);
  selectedSessionLocationId.value = null;
  await fetchAttendances(examId);
  pagination.value.rowsNumber = filteredAttendances.value.length;
};

const reloadAttendances = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  await fetchAttendances(examId);
  pagination.value.rowsNumber = filteredAttendances.value.length;
};

watch(filteredAttendances, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

watch(selectedSessionId, async (sessionId, previousSessionId) => {
  if (previousSessionId == null || sessionId == null) return;

  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  const wasAllRooms = selectedSessionLocationId.value == null;
  selectedSessionLocationId.value = null;

  // Already on ทุกห้อง → location watch won't fire; fetch for the new session here.
  if (wasAllRooms) {
    await fetchAttendances(examId);
    pagination.value.page = 1;
    pagination.value.rowsNumber = filteredAttendances.value.length;
  }
});

watch(selectedSessionLocationId, async (_locationId, previousLocationId) => {
  // Initial default is handled by loadData after exam is ready.
  if (previousLocationId === undefined) return;

  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;
  if (!exam.value) return;

  await fetchAttendances(examId);
  pagination.value.page = 1;
  pagination.value.rowsNumber = filteredAttendances.value.length;
});

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .page-container {
    width: 100% !important;
    min-width: 0 !important;
  }
}

.attendance-page {
  min-height: 0 !important;
}

.action-btn {
  border-radius: var(--radius-10) !important;
  height: 40px;
  padding: 0 24px;
}

.attendance-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }

  :deep(tbody tr td:nth-child(4)) {
    padding-left: clamp(12px, 5vw, 102px);
  }
}

.attendance-fullname-cell {
  text-align: left;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
</style>
