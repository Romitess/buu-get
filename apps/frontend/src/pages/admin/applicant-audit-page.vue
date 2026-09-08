<template>
  <q-page class="page-container applicant-audit-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.applicantAudit.pageTitle')"
      :subtitle="$t('admin.applicantAudit.pageSubtitle')"
    />

    <nav class="row items-center q-mb-md q-gutter-md">
      <div class="col">
        <SearchBar
          v-model="searchQuery"
          :placeholder="$t('admin.applicantAudit.searchPlaceholder')"
        />
      </div>
    </nav>

    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      :empty-label="$t('admin.applicantAudit.noData')"
      @request="onRequest"
    >
      <template v-slot:body-cell-fullnameTh="{ row }">
        <div class="text-left">{{ row.fullnameTh || '—' }}</div>
      </template>
      <template v-slot:body-cell-tools="{ row }">
        <div class="row justify-center">
          <ActionButton
            icon="history"
            color="primary"
            :tooltip="$t('admin.applicantAudit.viewTimeline')"
            @click="goToDetail(row.ermId)"
          />
        </div>
      </template>
    </BaseTable>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import { fetchEnrollmentAuditList } from 'src/services/enrollment-audit.service';
import type { EnrollmentAuditListItem } from 'src/types/enrollment-audit.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { EnrollmentStatus } from 'src/types/enrollment.types';

const router = useRouter();
const { t } = useI18n();

const isLoading = ref(false);
const searchQuery = ref('');
const rows = ref<EnrollmentAuditListItem[]>([]);
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

let searchDebounce: ReturnType<typeof setTimeout> | null = null;

const statusLabel = (status: number): string => {
  switch (status) {
    case Number(EnrollmentStatus.UNPAID):
      return t('admin.applicantAudit.status.unpaid');
    case Number(EnrollmentStatus.PAID):
      return t('admin.applicantAudit.status.paid');
    case Number(EnrollmentStatus.SEAT_ASSIGNED):
      return t('admin.applicantAudit.status.seatAssigned');
    case Number(EnrollmentStatus.SEAT_PUBLISHED):
      return t('admin.applicantAudit.status.seatPublished');
    case Number(EnrollmentStatus.ATTENDED):
      return t('admin.applicantAudit.status.attended');
    case Number(EnrollmentStatus.CANCELLED):
      return t('admin.applicantAudit.status.cancelled');
    case Number(EnrollmentStatus.MISSING):
      return t('admin.applicantAudit.status.missing');
    default:
      return String(status);
  }
};

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.applicantAudit.columns.index'),
    field: (_row: EnrollmentAuditListItem, index?: number) =>
      ((pagination.value.page - 1) * pagination.value.rowsPerPage || 0) + (index ?? 0) + 1,
    align: 'center',
  },
  {
    name: 'fullnameTh',
    label: t('admin.applicantAudit.columns.fullnameTh'),
    field: 'fullnameTh',
    align: 'left',
  },
  {
    name: 'nationalId',
    label: t('admin.applicantAudit.columns.nationalId'),
    field: 'nationalId',
    align: 'center',
  },
  {
    name: 'testTakerCode',
    label: t('admin.applicantAudit.columns.testTakerCode'),
    field: 'testTakerCode',
    align: 'center',
    format: (val: string | null) => val || '—',
  },
  {
    name: 'examName',
    label: t('admin.applicantAudit.columns.examName'),
    field: (row: EnrollmentAuditListItem) =>
      [row.examName, row.examRound].filter(Boolean).join(' ') || '—',
    align: 'left',
  },
  {
    name: 'ermStatus',
    label: t('admin.applicantAudit.columns.status'),
    field: 'ermStatus',
    align: 'center',
    format: (val: number) => statusLabel(val),
  },
  {
    name: 'tools',
    label: t('admin.applicantAudit.columns.tools'),
    field: 'ermId',
    align: 'center',
  },
]);

const loadData = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const params: {
      page: number;
      limit: number;
      search?: string;
    } = {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
    };
    const trimmedSearch = searchQuery.value.trim();
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }
    const result = await fetchEnrollmentAuditList(params);
    rows.value = result.data;
    pagination.value.rowsNumber = result.meta.total;
  } catch (error) {
    console.error('Failed to load applicant audit list:', error);
    rows.value = [];
    pagination.value.rowsNumber = 0;
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps): void => {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  void loadData();
};

const goToDetail = (ermId: number): void => {
  void router.push({ name: 'admin-applicant-audit-detail', params: { ermId: String(ermId) } });
};

watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    pagination.value.page = 1;
    void loadData();
  }, 350);
});

onMounted(() => {
  void loadData();
});
</script>
