<template>
  <q-card flat bordered class="year-table-card">
    <q-card-section>
      <div class="year-table-card__title">{{ t('admin.examReport.yearTable.title') }}</div>
      <BaseTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :rows-per-page-options="[5, 10, 20]"
        :empty-label="t('admin.examReport.yearTable.empty')"
        class="year-table"
        @request="onRequest"
      >
        <template #body-cell-detail="{ row }">
          <div class="row items-center justify-center">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="people_outline"
              @click="goToExamInformation(row)"
            >
              <q-tooltip>{{ t('admin.examReport.yearTable.viewDetail') }}</q-tooltip>
            </q-btn>
          </div>
        </template>
      </BaseTable>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseTable from 'src/components/shared/base-table.vue';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ExamYearTableRow } from 'src/types/exam-report.types';

const { t } = useI18n();
const router = useRouter();

interface Props {
  rows: ExamYearTableRow[];
  loading?: boolean;
}

const props = defineProps<Props>();

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 5,
  rowsNumber: props.rows.length,
  sortBy: null,
  descending: false,
});

const intText = (value: number): string => value.toLocaleString('en-US');
const numText = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

const goToExamInformation = (row: ExamYearTableRow): void => {
  void router.push({
    name: 'admin-exam-information',
    params: { year: String(row.year) },
  });
};

const onRequest = (requestProps: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = requestProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
  pagination.value.rowsNumber = props.rows.length;
};

watch(
  () => props.rows.length,
  (rowCount) => {
    const lastPage = Math.max(1, Math.ceil(rowCount / pagination.value.rowsPerPage));
    pagination.value.rowsNumber = rowCount;
    pagination.value.page = Math.min(pagination.value.page, lastPage);
  },
  { immediate: true },
);

const columns = computed((): QTableColumn<ExamYearTableRow>[] => [
  {
    name: 'year',
    label: t('admin.examReport.yearTable.columns.year'),
    field: 'year',
    align: 'left',
  },
  {
    name: 'registered',
    label: t('admin.examReport.yearTable.columns.registered'),
    field: 'registered',
    align: 'center',
    format: intText,
  },
  {
    name: 'attended',
    label: t('admin.examReport.yearTable.columns.attended'),
    field: 'attended',
    align: 'center',
    format: intText,
  },
  {
    name: 'absent',
    label: t('admin.examReport.yearTable.columns.absent'),
    field: 'absent',
    align: 'center',
    format: intText,
  },
  {
    name: 'repeatTakers',
    label: t('admin.examReport.yearTable.columns.repeatTakers'),
    field: 'repeatTakers',
    align: 'center',
    format: intText,
  },
  {
    name: 'minScore',
    label: t('admin.examReport.yearTable.columns.minScore'),
    field: 'minScore',
    align: 'center',
    format: numText,
  },
  {
    name: 'maxScore',
    label: t('admin.examReport.yearTable.columns.maxScore'),
    field: 'maxScore',
    align: 'center',
    format: numText,
  },
  {
    name: 'averageScore',
    label: t('admin.examReport.yearTable.columns.averageScore'),
    field: 'averageScore',
    align: 'center',
    format: numText,
  },
  {
    name: 'detail',
    label: t('admin.examReport.yearTable.columns.detail'),
    field: 'year',
    align: 'center',
    sortable: false,
  },
]);
</script>

<style scoped lang="scss">
.year-table-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--exam-report-card-shadow) !important;

  &__title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
}

.year-table {
  :deep(.base-table table) {
    min-width: 960px;
  }
}
</style>
