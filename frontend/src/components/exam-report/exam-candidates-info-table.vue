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

defineProps<Props>();

const emit = defineEmits<{
  (e: 'request', req: TableRequestProps): void;
  (e: 'view-history', row: ExamCandidateInfoRow): void;
}>();

const { t } = useI18n();

const formatScore = (value: number | null): string =>
  value === null ? '-' : value.toLocaleString('en-US', { maximumFractionDigits: 2 });

const columns = computed<QTableColumn<ExamCandidateInfoRow>[]>(() => [
  {
    name: 'index',
    label: t('admin.examCandidatesInfo.table.columns.index'),
    field: (row) => row.id,
    align: 'center',
    style: 'width: 6%; min-width: 72px',
  },
  {
    name: 'examNumber',
    label: t('admin.examCandidatesInfo.table.columns.examNumber'),
    field: 'examNumber',
    align: 'center',
    style: 'width: 13%; min-width: 140px',
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
    style: 'width: 14%; min-width: 155px',
  },
  {
    name: 'vocabularyGrammarScore',
    label: t('admin.examCandidatesInfo.table.columns.vocabularyGrammarScore'),
    field: 'vocabularyGrammarScore',
    align: 'center',
    style: 'width: 11%; min-width: 125px',
    format: formatScore,
  },
  {
    name: 'readingScore',
    label: t('admin.examCandidatesInfo.table.columns.readingScore'),
    field: 'readingScore',
    align: 'center',
    style: 'width: 11%; min-width: 125px',
    format: formatScore,
  },
  {
    name: 'totalScore',
    label: t('admin.examCandidatesInfo.table.columns.totalScore'),
    field: 'totalScore',
    align: 'center',
    style: 'width: 10%; min-width: 110px',
    format: formatScore,
  },
  {
    name: 'level',
    label: t('admin.examCandidatesInfo.table.columns.level'),
    field: 'level',
    align: 'center',
    style: 'width: 8%; min-width: 90px',
    format: formatScore,
  },
  {
    name: 'attemptStatus',
    label: t('admin.examCandidatesInfo.table.columns.status'),
    field: 'attemptStatus',
    align: 'center',
    style: 'width: 12%; min-width: 145px',
  },
  {
    name: 'tools',
    label: t('admin.examCandidatesInfo.table.columns.tools'),
    field: 'id',
    align: 'center',
    style: 'width: 6%; min-width: 85px',
    sortable: false,
  },
]);

const onRequest = (req: TableRequestProps): void => {
  emit('request', req);
};
</script>

<style scoped lang="scss">
.exam-candidates-info-table {
  :deep(.base-table table) {
    min-width: 1120px;
  }
}

.attempt-status {
  width: 126px;
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
