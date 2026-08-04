<template>
  <BaseTable
    :columns="columns"
    :rows="candidates"
    :loading="loading"
    :pagination="pagination"
    :empty-label="t('admin.examCandidatesInfo.table.emptyLabel')"
    class="exam-candidates-info-table"
    @request="onRequest"
  >
    <template #body-cell-attemptStatus="{ row }">
      <div class="row items-center justify-center">
        <span class="attempt-status" :class="`attempt-status--${row.attemptStatus}`">
          {{ t(`admin.examCandidatesInfo.status.${row.attemptStatus}`) }}
        </span>
      </div>
    </template>

    <template #body-cell-tools="{ row }">
      <div class="row items-center justify-center">
        <ActionButton
          icon="history"
          color="black"
          :tooltip="t('admin.examCandidatesInfo.table.tooltips.viewHistory')"
          @click="emit('view-history', row)"
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
import type { ExamCandidateInfoRow } from 'src/types/exam-report.types';

interface Props {
  candidates: ExamCandidateInfoRow[];
  loading?: boolean;
  pagination?: PaginationModel;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'request', req: TableRequestProps): void;
  (e: 'view-history', row: ExamCandidateInfoRow): void;
}>();

const { t } = useI18n();

const formatNumber = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

const scoreLineHeaders = computed(() => {
  const sample = props.candidates.find((row) => row.scoreLines?.length)?.scoreLines;
  return sample ?? [];
});

const columns = computed<QTableColumn<ExamCandidateInfoRow>[]>(() => {
  const baseColumns: QTableColumn<ExamCandidateInfoRow>[] = [
    {
      name: 'index',
      label: t('admin.examCandidatesInfo.table.columns.index'),
      field: (row) => row.id,
      align: 'center',
      style: 'width: 6%; min-width: 80px',
    },
    {
      name: 'examNumber',
      label: t('admin.examCandidatesInfo.table.columns.examNumber'),
      field: 'examNumber',
      align: 'center',
      style: 'width: 13%; min-width: 150px',
    },
    {
      name: 'prefix',
      label: t('admin.examCandidatesInfo.table.columns.prefix'),
      field: 'prefix',
      align: 'center',
      style: 'width: 9%; min-width: 110px',
    },
    {
      name: 'fullName',
      label: t('admin.examCandidatesInfo.table.columns.fullName'),
      field: 'fullName',
      align: 'left',
      style: 'width: 14%; min-width: 160px',
    },
  ];

  const scoreColumns: QTableColumn<ExamCandidateInfoRow>[] = scoreLineHeaders.value.length
    ? scoreLineHeaders.value.map((line) => ({
        name: `scoreLine-${line.sortOrder}`,
        label: line.nameTh,
        field: (row: ExamCandidateInfoRow) => {
          const matched = row.scoreLines?.find((item) => item.sortOrder === line.sortOrder);
          return matched?.score ?? null;
        },
        align: 'center' as const,
        style: 'width: 10%; min-width: 120px',
        format: formatNumber,
      }))
    : [
        {
          name: 'vocabularyGrammarScore',
          label: t('admin.examCandidatesInfo.table.columns.vocabularyGrammarScore'),
          field: 'vocabularyGrammarScore',
          align: 'center' as const,
          style: 'width: 11%; min-width: 130px',
          format: formatNumber,
        },
        {
          name: 'readingScore',
          label: t('admin.examCandidatesInfo.table.columns.readingScore'),
          field: 'readingScore',
          align: 'center' as const,
          style: 'width: 10%; min-width: 125px',
          format: formatNumber,
        },
      ];

  const tailColumns: QTableColumn<ExamCandidateInfoRow>[] = [
    {
      name: 'totalScore',
      label: t('admin.examCandidatesInfo.table.columns.totalScore'),
      field: 'totalScore',
      align: 'center',
      style: 'width: 10%; min-width: 115px',
      format: formatNumber,
    },
    {
      name: 'level',
      label: t('admin.examCandidatesInfo.table.columns.level'),
      field: 'level',
      align: 'center',
      style: 'width: 8%; min-width: 95px',
      format: formatNumber,
    },
    {
      name: 'attemptStatus',
      label: t('admin.examCandidatesInfo.table.columns.status'),
      field: 'attemptStatus',
      align: 'center',
      style: 'width: 12%; min-width: 150px',
    },
    {
      name: 'tools',
      label: t('admin.examCandidatesInfo.table.columns.tools'),
      field: 'id',
      align: 'center',
      style: 'width: 7%; min-width: 95px',
      sortable: false,
    },
  ];

  return [...baseColumns, ...scoreColumns, ...tailColumns];
});

const onRequest = (req: TableRequestProps): void => {
  emit('request', req);
};
</script>

<style scoped lang="scss">
.exam-candidates-info-table {
  :deep(.base-table table) {
    min-width: 1180px;
  }
}

.attempt-status {
  width: 128px;
  min-height: 34px;
  border: 1px solid;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  line-height: 1;

  &--firstAttempt {
    border-color: var(--primary);
    color: var(--primary);
  }

  &--repeatAttempt {
    border-color: var(--badge-success-dot);
    color: var(--badge-success-text);
  }
}
</style>
