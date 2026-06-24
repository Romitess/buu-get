<template>
  <div class="daily-revenue-table-wrapper">
    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :pagination="pagination"
      :empty-label="$t('admin.dailyRevenueReport.table.emptyLabel')"
      hide-pagination
      @request="onRequest"
    >
      <template v-slot:body-cell-index="{ row }">
        <div class="text-center">{{ row.index }}</div>
      </template>

      <template v-slot:body-cell-department="{ row }">
        <div>{{ row.department }}</div>
      </template>

      <template v-slot:body-cell-examName="{ row }">
        <div>{{ row.examName }}</div>
      </template>

      <template v-slot:body-cell-amount="{ row }">
        <div class="text-right">{{ formatAmount(row.amount) }}</div>
      </template>
    </BaseTable>

    <!-- Total Row -->
    <div class="total-row row items-center justify-end">
      <span class="total-label">{{ $t('admin.dailyRevenueReport.table.totalLabel') }}</span>
      <span class="total-value">{{ formattedTotal }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import type { DailyRevenueRow } from 'src/types/daily-revenue.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface Props {
  rows: DailyRevenueRow[];
  loading: boolean;
  formattedTotal: string;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'request', requestProps: TableRequestProps): void;
}>();

const { t } = useI18n();

const formatAmount = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const pagination = computed<PaginationModel>(() => ({
  page: 1,
  rowsPerPage: props.rows.length || 10,
  rowsNumber: props.rows.length,
}));

const onRequest = (): void => {
  // No server-side pagination for this report
};

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.dailyRevenueReport.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 80px',
  },
  {
    name: 'department',
    label: t('admin.dailyRevenueReport.table.columns.department'),
    field: 'department',
    align: 'left',
    style: 'width: 220px',
  },
  {
    name: 'examName',
    label: t('admin.dailyRevenueReport.table.columns.examName'),
    field: 'examName',
    align: 'left',
  },
  {
    name: 'amount',
    label: t('admin.dailyRevenueReport.table.columns.amount'),
    field: 'amount',
    align: 'right',
    style: 'width: 180px',
  },
]);
</script>

<style scoped lang="scss">
.daily-revenue-table-wrapper {
  :deep(.base-table-wrapper) {
    border-bottom: none;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.total-row {
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  padding: 14px 20px;
  gap: 16px;
}

.total-label {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.total-value {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  min-width: 140px;
  text-align: right;
}
</style>
