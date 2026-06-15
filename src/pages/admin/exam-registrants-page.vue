<template>
  <q-page class="page-container registrants-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.registrantManagement.pageTitle')"
      :subtitle="$t('admin.registrantManagement.pageSubtitle')"
    />

    <AppExamSessionTabs v-model="selectedSessionId" :sessions="sessionTimeTabs" />

    <AppExamInfoCard
      v-if="exam"
      v-model:selected-location-id="selectedSessionLocationId"
      class="q-mb-md"
      :title="exam.EXAM_ROUND ? `${exam.EXAM_NAME} ${exam.EXAM_ROUND}` : exam.EXAM_NAME"
      :date="examDateLabel"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :location-options="roomOptions"
      :applicant-count="localSessionTotalCount"
      :paid-count="localSessionPaidCount"
      :total-capacity="selectedSessionCapacity"
      is-admin
    />

    <nav class="toolbar-section row q-col-gutter-md items-center q-mb-md">
      <div class="col">
        <SearchBar
          v-model="searchQuery"
          :placeholder="$t('admin.registrantManagement.searchPlaceholder')"
        />
      </div>
      <div class="col-auto">
        <ExportCsvButton
          :columns="columns"
          :rows="currentRoomEnrollments"
          file-name-prefix="exam-registrants"
          class="export-btn"
        />
      </div>
    </nav>

    <main>
      <BaseTable
        :columns="columns"
        :rows="currentRoomEnrollments"
        :loading="isLoading"
        :pagination="pagination"
        class="registrants-table"
        @request="onRequest"
      >
        <template v-slot:body-cell-index="{ row }">
          <div class="text-center">{{ row.index }}</div>
        </template>

        <template v-slot:body-cell-titleTh="{ value }">
          <div class="text-center">{{ value }}</div>
        </template>

        <template v-slot:body-cell-fullnameTh="{ value }">
          <div class="registrant-fullname-cell">{{ value }}</div>
        </template>

        <template v-slot:body-cell-remark="{ value }">
          <div class="text-center">{{ value || '-' }}</div>
        </template>

        <template v-slot:body-cell-paymentStatus="{ row }">
          <div class="text-center">
            <EnrollmentStatusBadge :status="row.paymentStatus" type="payment" />
          </div>
        </template>

        <template v-slot:body-cell-verifyStatus="{ row }">
          <div class="text-center">
            <EnrollmentStatusBadge :status="row.verifyStatus" type="verify" />
          </div>
        </template>

        <template v-slot:body-cell-tools="{ row }">
          <div class="row justify-center q-gutter-x-sm no-wrap">
            <ActionButton
              icon="visibility"
              :tooltip="$t('admin.registrantManagement.table.tooltips.viewDetail')"
              color="black"
              @click="handleView(row.ermId)"
            />
            <ActionButton
              icon="update"
              :tooltip="$t('profileEditHistory.pageTitle')"
              color="black"
              @click="handleHistory(row.ermId)"
            />
          </div>
        </template>
      </BaseTable>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import EnrollmentStatusBadge from 'src/components/shared/enrollment-status-badge.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import { useExamRegistrants } from 'src/composables/use-exam-registrants';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { PAYMENT_STATUS_LABELS, VERIFY_STATUS_LABELS } from 'src/types/enrollment.types';
import type { BackendSession } from 'src/types/exam';

interface SessionLocationOption {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
  LOCATION: NonNullable<BackendSession['LOCATION']>;
}

const route = useRoute();
const router = useRouter();
const i18n = useI18n();

const {
  isLoading,
  exam,
  searchQuery,
  selectedSessionId,
  selectedSessionLocationId,
  sessionTimeTabs,
  roomOptions,
  filteredEnrollments,
  fetchEnrollments,
} = useExamRegistrants();

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

watch(
  [selectedSessionId, roomOptions],
  () => {
    if (!roomOptions.value.some((option) => option.value === selectedSessionLocationId.value)) {
      selectedSessionLocationId.value = roomOptions.value[0]?.value ?? null;
    }
  },
  { immediate: true },
);

const selectedSessionCapacity = computed(() => {
  if (activeLocation.value?.SEATS?.length) return activeLocation.value.SEATS.length;
  return (
    activeTimeSessions.value.find((session) => session.SS_ID === activeSessionLocation.value?.SS_ID)
      ?.SS_CAPACITY ?? 0
  );
});

const currentRoomEnrollments = computed(() => {
  const list = filteredEnrollments.value;
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

const localSessionTotalCount = computed(() => currentRoomEnrollments.value.length);

const localSessionPaidCount = computed(() => {
  const list = currentRoomEnrollments.value;
  const CANCELLED_STATUS = 5;
  return list.filter((e) => e.paymentStatus >= 1 && e.paymentStatus !== CANCELLED_STATUS).length;
});

watch(exam, (newExam) => {
  if (newExam && sessionTimeTabs.value.length > 0 && !selectedSessionId.value) {
    const firstSession = sessionTimeTabs.value[0];
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

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: i18n.t('admin.registrantManagement.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 6%',
  },
  {
    name: 'titleTh',
    label: i18n.t('admin.registrantManagement.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
    style: 'width: 10%',
  },
  {
    name: 'fullnameTh',
    label: i18n.t('admin.registrantManagement.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'left',
    style: 'width: 18%',
  },
  {
    name: 'remark',
    label: i18n.t('admin.registrantManagement.table.columns.remark'),
    field: 'remark',
    align: 'center',
    style: 'width: 21%',
  },
  {
    name: 'paymentStatus',
    label: i18n.t('admin.registrantManagement.table.columns.paymentStatus'),
    field: 'paymentStatus',
    align: 'center',
    format: (val: number) => PAYMENT_STATUS_LABELS[val] || '-',
    style: 'width: 15%',
  },
  {
    name: 'verifyStatus',
    label: i18n.t('admin.registrantManagement.table.columns.verifyStatus'),
    field: 'verifyStatus',
    align: 'center',
    format: (val: number) => VERIFY_STATUS_LABELS[val] || '-',
    style: 'width: 18%',
  },
  {
    name: 'tools',
    label: i18n.t('admin.registrantManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 12%',
  },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const handleView = (ermId: number): void => {
  void router.push({
    name: 'admin-exam-registrant-detail',
    params: {
      examId: route.params.examId,
      ermId: String(ermId),
    },
  });
};

const handleHistory = (ermId: number): void => {
  void router.push({
    name: 'admin-exam-registrant-history',
    params: {
      examId: route.params.examId,
      ermId: String(ermId),
    },
  });
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchEnrollments(examId);

    const routeSessionLocationId = Number(route.query.sessionLocationId);
    if (
      !isNaN(routeSessionLocationId) &&
      roomOptions.value.some((option) => option.value === routeSessionLocationId)
    ) {
      selectedSessionLocationId.value = routeSessionLocationId;
    }

    pagination.value.rowsNumber = currentRoomEnrollments.value.length;
  }
};

watch(currentRoomEnrollments, (newVal) => {
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

.registrants-page {
  min-height: 0 !important;
}

.export-btn {
  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

.registrants-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }

  :deep(tbody tr td:nth-child(3)) {
    padding-left: clamp(12px, 4.6vw, 80px);
  }
}

.registrant-fullname-cell {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
</style>
