<template>
  <q-page class="page-container registrants-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.registrantManagement.pageTitle')"
      :subtitle="$t('admin.registrantManagement.pageSubtitle')"
    />

    <AppExamSessionTabs v-model="selectedSessionId" :sessions="exam?.SESSIONS" />

    <AppExamInfoCard
      v-if="exam"
      class="q-mb-md"
      :title="exam.EXAM_NAME"
      :date="formatThaiDate(exam.EXAM_DATE)"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :applicant-count="sessionTotalCount"
      :paid-count="sessionPaidCount"
      :total-capacity="selectedSessionCapacity"
      is-admin
    />

    <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
      <SearchBar
        v-model="searchQuery"
        :placeholder="$t('admin.registrantManagement.searchPlaceholder')"
        class="search-bar col-12 col-sm-auto"
      />
      <q-space class="gt-xs" />
      <ExportCsvButton
        :columns="columns"
        :rows="filteredEnrollments"
        file-name-prefix="exam-registrants"
        class="export-btn col-12 col-sm-auto"
      />
    </nav>

    <main>
      <BaseTable
        :columns="columns"
        :rows="filteredEnrollments"
        :loading="isLoading"
        :pagination="pagination"
        class="registrants-table"
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
              :tooltip="
                row.verifyStatus === VerifyStatus.PASS
                  ? 'ผ่านการตรวจสอบความถูกต้องแล้ว'
                  : $t('admin.registrantManagement.table.tooltips.viewDetail')
              "
              :disable="row.verifyStatus === VerifyStatus.PASS"
              color="black"
              @click="handleView(row.ermId)"
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
import { useThaiDate } from 'src/composables/useThaiDate';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import {
  VerifyStatus,
  PAYMENT_STATUS_LABELS,
  VERIFY_STATUS_LABELS,
} from 'src/types/enrollment.types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formatThaiDate } = useThaiDate();

const {
  isLoading,
  exam,
  searchQuery,
  selectedSessionId,
  filteredEnrollments,
  sessionTotalCount,
  sessionPaidCount,
  fetchEnrollments,
} = useExamRegistrants();

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

const selectedSessionCapacity = computed(() => {
  return selectedSession.value?.SS_CAPACITY || 0;
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
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: t('admin.registrantManagement.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 60px',
  },
  {
    name: 'nationalId',
    label: t('admin.registrantManagement.table.columns.nationalId'),
    field: 'nationalId',
    align: 'center',
  },
  {
    name: 'titleTh',
    label: t('admin.registrantManagement.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
  },
  {
    name: 'fullnameTh',
    label: t('admin.registrantManagement.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'center',
  },
  {
    name: 'paymentStatus',
    label: t('admin.registrantManagement.table.columns.paymentStatus'),
    field: 'paymentStatus',
    align: 'center',
    format: (val: number) => PAYMENT_STATUS_LABELS[val] || '-',
  },
  {
    name: 'verifyStatus',
    label: t('admin.registrantManagement.table.columns.verifyStatus'),
    field: 'verifyStatus',
    align: 'center',
    format: (val: number) => VERIFY_STATUS_LABELS[val] || '-',
  },
  {
    name: 'tools',
    label: t('admin.registrantManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 80px',
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

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchEnrollments(examId);
    pagination.value.rowsNumber = filteredEnrollments.value.length;
  }
};

watch(filteredEnrollments, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.registrants-page {
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

.registrants-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }
}
</style>
