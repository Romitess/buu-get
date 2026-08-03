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
      class="q-mb-md"
      :title="
        formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
        exam.EXAM_NAME
      "
      :date="examDateLabel"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :location-options="[]"
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
          :load-rows="loadExportRows"
          file-name-prefix="exam-registrants"
          class="export-btn"
        />
      </div>
    </nav>

    <main>
      <q-banner v-if="error" class="bg-red-1 text-red-9 q-mb-md rounded-borders shadow-1">
        <template v-slot:avatar>
          <q-icon name="warning" color="negative" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat color="negative" label="ลองใหม่" @click="loadData" />
        </template>
      </q-banner>

      <BaseTable
        :columns="columns"
        :rows="currentRoomEnrollments"
        :loading="isLoading"
        :pagination="pagination"
        is-server-side
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

        <template v-slot:body-cell-email="{ value }">
          <div class="registrant-contact-cell">{{ value }}</div>
        </template>

        <template v-slot:body-cell-phone="{ value }">
          <div class="text-center">{{ value }}</div>
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
import { type QTableColumn, debounce } from 'quasar';
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
import { fetchExamById } from 'src/services/exam.service';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import { fetchEnrollmentsByExamId } from 'src/services/enrollment.service';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import {
  PAYMENT_STATUS_LABELS,
  VERIFY_STATUS_LABELS,
  type EnrollmentTableRow,
} from 'src/types/enrollment.types';

const route = useRoute();
const router = useRouter();
const i18n = useI18n();

const {
  isLoading,
  exam,
  searchQuery,
  selectedSessionId,
  sessionTimeTabs,
  filteredEnrollments,
  fetchEnrollments,
  totalRows,
  totalPaidRows,
  error,
} = useExamRegistrants();

const isInitializing = ref(true);

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

const selectedSessionTime = computed(() => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed(() => {
  if (!activeTimeSessions.value.length) return '-';
  const locs = activeTimeSessions.value
    .flatMap((s) => s.SESSION_LOCATIONS || [])
    .map((sl) => sl.LOCATION)
    .filter(Boolean);
  if (locs.length === 0) {
    const defaultLoc = selectedSession.value?.LOCATION;
    return defaultLoc?.LOCATION_NAME || '-';
  }
  return locs[0]?.LOCATION_NAME || '-';
});

const selectedSessionCapacity = computed(() => {
  if (activeTimeSessions.value.length > 0) {
    return activeTimeSessions.value.reduce((sum, s) => sum + (s.SS_CAPACITY || 0), 0);
  }
  return selectedSession.value?.SS_CAPACITY ?? 0;
});

const currentRoomEnrollments = computed(() => {
  return filteredEnrollments.value;
});

const localSessionTotalCount = computed(() => totalRows.value);

const localSessionPaidCount = computed(() => totalPaidRows.value);

watch(exam, (newExam) => {
  if (isInitializing.value) return;
  if (newExam && sessionTimeTabs.value.length > 0 && !selectedSessionId.value) {
    const firstSession = sessionTimeTabs.value[0];
    if (firstSession) {
      selectedSessionId.value = firstSession.SS_ID;
    }
  }
});

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: i18n.t('admin.registrantManagement.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 5%',
  },
  {
    name: 'titleTh',
    label: i18n.t('admin.registrantManagement.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'fullnameTh',
    label: i18n.t('admin.registrantManagement.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'left',
    style: 'width: 16%',
  },
  {
    name: 'email',
    label: i18n.t('admin.registrantManagement.table.columns.email'),
    field: 'email',
    align: 'left',
    style: 'width: 16%',
  },
  {
    name: 'phone',
    label: i18n.t('admin.registrantManagement.table.columns.phone'),
    field: 'phone',
    align: 'center',
    style: 'width: 11%',
  },
  {
    name: 'remark',
    label: i18n.t('admin.registrantManagement.table.columns.remark'),
    field: 'remark',
    align: 'center',
    style: 'width: 12%',
  },
  {
    name: 'paymentStatus',
    label: i18n.t('admin.registrantManagement.table.columns.paymentStatus'),
    field: 'paymentStatus',
    align: 'center',
    format: (val: number) => PAYMENT_STATUS_LABELS[val] || '-',
    style: 'width: 11%',
  },
  {
    name: 'verifyStatus',
    label: i18n.t('admin.registrantManagement.table.columns.verifyStatus'),
    field: 'verifyStatus',
    align: 'center',
    format: (val: number) => VERIFY_STATUS_LABELS[val] || '-',
    style: 'width: 12%',
  },
  {
    name: 'tools',
    label: i18n.t('admin.registrantManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 9%',
  },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
  void loadData();
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
    // If not initialized, wait until parameters are selected
    if (isInitializing.value) return;

    await fetchEnrollments(examId, {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: searchQuery.value,
      sessionId: selectedSessionId.value,
      sessionLocationId: null, // load all rooms for this session
      sortBy: pagination.value.sortBy,
      descending: pagination.value.descending,
    });

    pagination.value.rowsNumber = totalRows.value;
  }
};

const loadExportRows = async (): Promise<EnrollmentTableRow[]> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) {
    return [];
  }

  const pageSize = 100;
  const allRows: EnrollmentTableRow[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (allRows.length < total) {
    const pageResult = await fetchEnrollmentsByExamId(examId, {
      page,
      limit: pageSize,
      search: searchQuery.value,
      sessionId: selectedSessionId.value,
      sessionLocationId: null,
    });

    total = pageResult.total;
    allRows.push(...pageResult.data);

    if (pageResult.data.length === 0 || allRows.length >= total) {
      break;
    }
    page += 1;
  }

  return allRows;
};

const debouncedLoadData = debounce(loadData, 400);

// Single watcher on session changes
watch(selectedSessionId, () => {
  if (isInitializing.value) return;
  pagination.value.page = 1;
  void loadData();
});

watch(searchQuery, () => {
  if (isInitializing.value) return;
  pagination.value.page = 1;
  void debouncedLoadData();
});

onMounted(async () => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    try {
      isLoading.value = true;
      // 1. Fetch exam details first
      const examData = await fetchExamById(examId);
      exam.value = examData;

      // 2. Set default session
      const firstSession = sessionTimeTabs.value[0];
      if (examData && firstSession) {
        selectedSessionId.value = firstSession.SS_ID ?? null;
      }

      // 3. Mark initialization as finished
      isInitializing.value = false;

      // 4. Fetch actual paginated data
      await loadData();
    } catch (err) {
      console.error('Failed to initialize registrants page:', err);
      isInitializing.value = false;
    } finally {
      isLoading.value = false;
    }
  }
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

  :deep(thead tr th:nth-child(3)) {
    text-align: center !important;
    padding-left: 0 !important;
  }

  :deep(tbody tr td:nth-child(3)) {
    padding-left: clamp(12px, 4vw, 70px) !important;
  }
}

.registrant-fullname-cell {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.registrant-contact-cell {
  width: 100%;
  min-width: 0;
  word-break: break-word;
}
</style>
