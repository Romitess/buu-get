<template>
  <q-page class="page-container exam-information-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('admin.examInformation.testTakers.pageTitle')"
      :subtitle="t('admin.examInformation.testTakers.pageSubtitle')"
    />

    <SearchBar
      v-model="searchQuery"
      class="q-mb-md"
      :placeholder="t('admin.examInformation.searchPlaceholder')"
      @update:model-value="onSearch"
    />

    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="isLoading"
      :pagination="pagination"
      :is-server-side="true"
      :empty-label="t('admin.examInformation.testTakers.table.emptyLabel')"
      @request="onRequest"
    >
      <template #body-cell-index="{ row }">
        <div class="text-center">{{ row.index }}</div>
      </template>
      <template #body-cell-testTakerId="{ row }">
        <div class="text-center">{{ row.testTakerId || '-' }}</div>
      </template>
      <template #body-cell-title="{ row }">
        <div>{{ row.title || '-' }}</div>
      </template>
      <template #body-cell-fullName="{ row }">
        <div>{{ row.fullName || '-' }}</div>
      </template>
      <template #body-cell-examRoundCount="{ row }">
        <div class="text-center">{{ row.examRoundCount }}</div>
      </template>
      <template #body-cell-tools="{ row }">
        <div class="text-center">
          <ActionButton
            icon="visibility"
            color="black"
            :tooltip="t('admin.examInformation.testTakers.table.tooltips.viewHistory')"
            @click="handleView(row)"
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
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import { useExecutiveTestTakers } from 'src/composables/use-executive-test-takers';
import type { TableRequestProps, PaginationModel } from 'src/types/exam.types';
import type { ExecutiveTestTakerRow } from 'src/types/executive-test-taker.types';

interface ExecutiveTestTakerTableRow extends ExecutiveTestTakerRow {
  index: number;
}

const { t, locale } = useI18n();
const { rows: sourceRows, total, isLoading, fetchRows } = useExecutiveTestTakers();
const router = useRouter();
const searchQuery = ref('');
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
});

const rows = computed<ExecutiveTestTakerTableRow[]>(() =>
  sourceRows.value.map((row, index) => ({
    ...row,
    index: (pagination.value.page - 1) * pagination.value.rowsPerPage + index + 1,
  })),
);

const columns = computed<QTableColumn<ExecutiveTestTakerTableRow>[]>(() => {
  void locale.value;
  return [
  {
    name: 'index',
    label: t('admin.examInformation.testTakers.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 80px',
  },
  {
    name: 'testTakerId',
    label: t('admin.examInformation.testTakers.table.columns.examNumber'),
    field: 'testTakerId',
    align: 'center',
  },
  {
    name: 'title',
    label: t('admin.examInformation.testTakers.table.columns.prefix'),
    field: 'title',
    align: 'left',
  },
  {
    name: 'fullName',
    label: t('admin.examInformation.testTakers.table.columns.fullName'),
    field: 'fullName',
    align: 'left',
  },
  {
    name: 'examRoundCount',
    label: t('admin.examInformation.testTakers.table.columns.examRoundCount'),
    field: 'examRoundCount',
    align: 'center',
  },
  {
    name: 'tools',
    label: t('admin.examInformation.testTakers.table.columns.tools'),
    field: 'enrollmentId',
    align: 'center',
  },
  ];
});

let searchTimeout: ReturnType<typeof setTimeout> | undefined;

const loadRows = async (): Promise<void> => {
  await fetchRows(
    pagination.value.page,
    pagination.value.rowsPerPage,
    searchQuery.value || undefined,
  );
};

const onSearch = (): void => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    void loadRows();
  }, 300);
};

const onRequest = ({ pagination: nextPagination }: TableRequestProps): void => {
  pagination.value.page = nextPagination.page;
  pagination.value.rowsPerPage = nextPagination.rowsPerPage;
  void loadRows();
};

const handleView = (row: ExecutiveTestTakerTableRow): void => {
  void router.push({
    name: 'admin-executive-test-taker-history',
    params: {
      examId: String(row.examId),
      ermId: String(row.enrollmentId),
    },
  });
};

watch(total, (value) => {
  pagination.value.rowsNumber = value;
});

onMounted(() => {
  void loadRows();
});
</script>
