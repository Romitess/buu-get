<template>
  <BaseTable
    :columns="columns"
    :rows="rounds"
    :loading="loading"
    :pagination="pagination"
    :empty-label="t('admin.examInformation.table.emptyLabel')"
    :is-server-side="isServerSide"
    class="exam-information-table"
    @request="onRequest"
  >
    <template #body-cell-detail="{ row }">
      <div class="row items-center justify-center">
        <ActionButton
          icon="people_outline"
          color="black"
          :tooltip="getDetailTooltip(row)"
          :disable="!canViewDetail(row)"
          @click="handleViewDetail(row)"
        />
      </div>
    </template>
  </BaseTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ExamInformationRoundRow } from 'src/types/exam-report.types';

interface Props {
  rounds: ExamInformationRoundRow[];
  loading?: boolean;
  pagination?: PaginationModel;
  isServerSide?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'request', req: TableRequestProps): void;
  (e: 'view-detail', row: ExamInformationRoundRow): void;
}>();

const { t, locale } = useI18n();

const formatInteger = (value: number): string => value.toLocaleString('en-US');

const formatScore = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

const detailRequiredFields: ReadonlyArray<keyof ExamInformationRoundRow> = [
  'round',
  'applicants',
  'attended',
  'absent',
  'repeatTakers',
  'minScore',
  'maxScore',
  'averageScore',
];

const isCompleteValue = (
  value: ExamInformationRoundRow[keyof ExamInformationRoundRow],
): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);

  return true;
};

const canViewDetail = (row: ExamInformationRoundRow): boolean =>
  detailRequiredFields.every((field) => isCompleteValue(row[field]));

const getDetailTooltip = (row: ExamInformationRoundRow): string =>
  canViewDetail(row)
    ? t('admin.examInformation.table.tooltips.viewDetail')
    : t('admin.examInformation.table.tooltips.incompleteDetail');

const handleViewDetail = (row: ExamInformationRoundRow): void => {
  if (!canViewDetail(row)) return;

  emit('view-detail', row);
};

const columns = computed<QTableColumn<ExamInformationRoundRow>[]>(() => {
  void locale.value;
  return [
  {
    name: 'round',
    label: t('admin.examInformation.table.columns.round'),
    field: 'round',
    align: 'center',
    style: 'width: 12%; min-width: 110px',
  },
  {
    name: 'applicants',
    label: t('admin.examInformation.table.columns.applicants'),
    field: 'applicants',
    align: 'center',
    style: 'width: 10%; min-width: 105px',
    format: formatInteger,
  },
  {
    name: 'attended',
    label: t('admin.examInformation.table.columns.attended'),
    field: 'attended',
    align: 'center',
    style: 'width: 10%; min-width: 105px',
    format: formatInteger,
  },
  {
    name: 'absent',
    label: t('admin.examInformation.table.columns.absent'),
    field: 'absent',
    align: 'center',
    style: 'width: 10%; min-width: 105px',
    format: formatInteger,
  },
  {
    name: 'repeatTakers',
    label: t('admin.examInformation.table.columns.repeatTakers'),
    field: 'repeatTakers',
    align: 'center',
    style: 'width: 14%; min-width: 140px',
    format: formatInteger,
  },
  {
    name: 'minScore',
    label: t('admin.examInformation.table.columns.minScore'),
    field: 'minScore',
    align: 'center',
    style: 'width: 10%; min-width: 105px',
    format: formatScore,
  },
  {
    name: 'maxScore',
    label: t('admin.examInformation.table.columns.maxScore'),
    field: 'maxScore',
    align: 'center',
    style: 'width: 10%; min-width: 105px',
    format: formatScore,
  },
  {
    name: 'averageScore',
    label: t('admin.examInformation.table.columns.averageScore'),
    field: 'averageScore',
    align: 'center',
    style: 'width: 12%; min-width: 120px',
    format: formatScore,
  },
  {
    name: 'detail',
    label: t('admin.examInformation.table.columns.detail'),
    field: 'round',
    align: 'center',
    style: 'width: 12%; min-width: 105px',
    sortable: false,
  },
  ];
});

const onRequest = (req: TableRequestProps): void => {
  emit('request', req);
};
</script>

<style scoped lang="scss">
.exam-information-table {
  :deep(.base-table table) {
    min-width: 1000px;
  }
}
</style>
