<template>
  <q-card flat bordered class="rounds-card">
    <q-card-section>
      <div class="rounds-card__title">{{ t('admin.examReport.table.title') }}</div>
      <BaseTable
        :rows="rows"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        :rows-per-page-options="[6, 10, 20]"
        :empty-label="t('admin.examReport.table.emptyLabel')"
        class="rounds-table"
        @request="onRequest"
      >
        <template #body-cell-tools="{ row }">
          <div class="row items-center justify-center">
            <ActionButton
              icon="people_outline"
              color="black"
              :tooltip="t('admin.examReport.table.viewRegistrants')"
              :disable="row.registered === null"
              @click="emit('view-registrants', row)"
            />
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
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ExamReportRoundRow } from 'src/types/exam-report.types';

const { t } = useI18n();

interface Props {
  rows: ExamReportRoundRow[];
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'view-registrants', row: ExamReportRoundRow): void;
}>();

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 6,
  rowsNumber: props.rows.length,
  sortBy: null,
  descending: false,
});

const formatNumber = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US');

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

const columns = computed((): QTableColumn<ExamReportRoundRow>[] => [
  {
    name: 'round',
    label: t('admin.examReport.table.columns.round'),
    field: 'round',
    align: 'left',
  },
  {
    name: 'date',
    label: t('admin.examReport.table.columns.date'),
    field: 'date',
    align: 'left',
  },
  {
    name: 'registered',
    label: t('admin.examReport.table.columns.registered'),
    field: 'registered',
    align: 'center',
    format: formatNumber,
  },
  {
    name: 'attended',
    label: t('admin.examReport.table.columns.attended'),
    field: 'attended',
    align: 'center',
    format: formatNumber,
  },
  {
    name: 'absent',
    label: t('admin.examReport.table.columns.absent'),
    field: 'absent',
    align: 'center',
    format: formatNumber,
  },
  {
    name: 'tools',
    label: t('admin.examReport.table.columns.tools'),
    field: 'round',
    align: 'center',
    sortable: false,
  },
]);
</script>

<style scoped lang="scss">
.rounds-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--exam-report-card-shadow) !important;
  height: 100%;

  &__title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 12px;
  }
}

.rounds-table {
  // จำกัดความสูงของส่วน body ให้ scroll เมื่อแถวเพิ่ม (header ค้างบน, pagination อยู่ล่าง)
  :deep(.q-table__middle) {
    max-height: 300px;
  }

  :deep(thead tr th) {
    position: sticky;
    top: 0;
    z-index: 1;
  }
}
</style>
