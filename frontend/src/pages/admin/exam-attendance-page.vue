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
      v-model:selected-location-id="selectedSessionLocationId"
      class="q-mb-md"
      :title="exam.EXAM_ROUND ? `${exam.EXAM_NAME} ${exam.EXAM_ROUND}` : exam.EXAM_NAME"
      :date="examDateLabel"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :location-options="roomOptions"
      :applicant-count="localSessionAttendedCount"
      :total-capacity="selectedSessionCapacity"
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
          label="เช็คอินเข้าห้องสอบ"
          color="primary"
          class="action-btn"
          @click="openCheckInDialog"
        />
        <ExportCsvButton
          :columns="columns"
          :rows="currentRoomAttendances"
          file-name-prefix="exam-attendances"
          class="action-btn"
        />
      </div>
    </nav>

    <main v-if="currentRoomAttendances.length > 0">
      <BaseTable
        :columns="columns"
        :rows="currentRoomAttendances"
        :loading="isLoading"
        :pagination="pagination"
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
    <div v-else-if="!isLoading" class="flex flex-center q-pa-xl text-grey-6">
      <q-icon name="info" size="md" class="q-mr-sm" />
      <span>{{ $t('admin.examAttendance.noData') }}</span>
    </div>
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

interface SessionLocationOption {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
  LOCATION: NonNullable<BackendSession['LOCATION']>;
}

const route = useRoute();
const i18n = useI18n();

const { isLoading, exam, searchQuery, selectedSessionId, filteredAttendances, fetchAttendances, attendances } =
  useExamAttendances();

const selectedSessionLocationId = ref<number | null>(null);

const $q = useQuasar();

const openCheckInDialog = () => {
  $q.dialog({
    component: DialogAttendanceCheckin,
    componentProps: {
      attendances: attendances.value,
      examName: exam.value?.EXAM_ROUND ? `${exam.value.EXAM_NAME} ${exam.value.EXAM_ROUND}` : exam.value?.EXAM_NAME || '',
      examDate: examDateLabel.value,
      examTime: selectedSessionTime.value,
      examLocation: selectedSessionLocation.value,
      examRound: exam.value?.EXAM_ROUND || '',
    },
  }).onOk(() => {
    void loadData();
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

const roomOptions = computed(() =>
  sessionLocations.value.map((item) => ({
    value: item.SL_ID,
    label: `${item.LOCATION.LOCATION_NAME}${item.LOCATION.LOCATION_ROOM_NO ? ` (${item.LOCATION.LOCATION_ROOM_NO})` : ''}`,
  })),
);

const activeSessionLocation = computed(() => {
  return (
    sessionLocations.value.find((item) => item.SL_ID === selectedSessionLocationId.value) ?? null
  );
});

const activeLocation = computed(() => {
  return activeSessionLocation.value?.LOCATION ?? selectedSession.value?.LOCATION ?? null;
});

const selectedSessionTime = computed(() => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed(() => {
  if (!activeLocation.value) return '-';
  const loc = activeLocation.value;
  return `${loc.LOCATION_NAME}${loc.LOCATION_ROOM_NO ? ` (${loc.LOCATION_ROOM_NO})` : ''}`;
});

const selectedSessionCapacity = computed(() => {
  if (activeLocation.value?.SEATS?.length) return activeLocation.value.SEATS.length;
  return (
    activeTimeSessions.value.find((session) => session.SS_ID === activeSessionLocation.value?.SS_ID)
      ?.SS_CAPACITY ?? 0
  );
});

const currentRoomAttendances = computed(() => {
  const list = filteredAttendances.value;
  if (selectedSessionLocationId.value === null) return list;

  const result = list.filter((e) => {
    if (e.slId !== null && e.slId !== undefined) {
      return e.slId === selectedSessionLocationId.value;
    }

    const seatLocation = sessionLocations.value.find((location) =>
      location.LOCATION.SEATS?.some((seat) => seat.LS_ID === e.lsId),
    );
    if (seatLocation) {
      return seatLocation.SL_ID === selectedSessionLocationId.value;
    }

    const enrollmentSessionLocations = sessionLocations.value.filter(
      (location) => location.SS_ID === e.sessionId,
    );
    return (
      enrollmentSessionLocations.length > 0 &&
      enrollmentSessionLocations[0]?.SL_ID === selectedSessionLocationId.value
    );
  });

  return result.map((item, idx) => ({
    ...item,
    index: idx + 1,
  }));
});

const localSessionAttendedCount = computed(() => {
  const list = currentRoomAttendances.value;
  return list.filter((e) => e.hasRecord && e.attendanceStatus === ExamAttendStatus.INTIME).length;
});

watch(exam, (newExam) => {
  if (newExam && newExam.SESSIONS && newExam.SESSIONS.length > 0 && !selectedSessionId.value) {
    const firstSession = newExam.SESSIONS[0];
    if (firstSession) {
      selectedSessionId.value = firstSession.SS_ID;
    }
  }
});

watch(
  [selectedSessionId, roomOptions],
  () => {
    const firstRoomId = roomOptions.value[0]?.value ?? null;
    if (firstRoomId === null) {
      selectedSessionLocationId.value = null;
      return;
    }

    if (!roomOptions.value.some((option) => option.value === selectedSessionLocationId.value)) {
      selectedSessionLocationId.value = firstRoomId;
    }
  },
  { immediate: true },
);

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = computed<QTableColumn[]>(() => [
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
]);

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchAttendances(examId);

    const routeSessionLocationId = Number(route.query.sessionLocationId);
    if (
      !isNaN(routeSessionLocationId) &&
      roomOptions.value.some((option) => option.value === routeSessionLocationId)
    ) {
      selectedSessionLocationId.value = routeSessionLocationId;
    }

    pagination.value.rowsNumber = currentRoomAttendances.value.length;
  }
};

watch(currentRoomAttendances, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
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
