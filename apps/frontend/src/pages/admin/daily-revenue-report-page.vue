<template>
  <q-page class="page-container daily-revenue-report-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.dailyRevenueReport.pageTitle')"
      :subtitle="$t('admin.dailyRevenueReport.pageSubtitle')"
    />

    <DailyRevenueFilter :filter="filter" mode="daily" @filter-change="applyFilter" />

    <div class="row justify-end q-gutter-sm q-mb-md">
      <q-btn
        outline
        color="positive"
        :label="$t('admin.financeReport.exportExcel')"
        :disable="rows.length === 0"
        @click="exportExcel"
      />
      <q-btn
        outline
        color="negative"
        :label="$t('admin.financeReport.exportPdf')"
        :disable="rows.length === 0"
        @click="exportPdf"
      />
    </div>

    <div v-if="effectiveDateLabel" class="text-center text-weight-bold q-mb-md">
      {{ effectiveDateLabel }}
    </div>

    <div class="daily-revenue-table-wrapper">
      <BaseTable
        :columns="columns"
        :rows="displayRows"
        :loading="isLoading"
        :pagination="pagination"
        :empty-label="$t('admin.dailyRevenueReport.table.emptyLabel')"
        hide-pagination
      />
      <div class="total-row row items-center justify-end no-wrap">
        <span class="total-label">{{ $t('admin.dailyRevenueReport.table.totalLabel') }}</span>
        <span class="total-value">{{ formattedTotal }}</span>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import DailyRevenueFilter from 'src/components/report/daily-revenue-filter.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import { useDailyRevenue } from 'src/composables/use-daily-revenue';
import type { PaginationModel } from 'src/types/exam.types';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import {
  downloadFinanceReportXlsx,
  formatReportAmount,
  formatReportDate,
  printFinanceReport,
  readReportField,
  type FinanceReportColumn,
} from 'src/utils/finance-report-export';

const $q = useQuasar();
const { t, locale } = useI18n();
const route = useRoute();

const {
  rows,
  isLoading,
  error,
  filter,
  effectiveDates,
  formattedTotal,
  applyFilter,
} = useDailyRevenue();

const displayRows = computed(() =>
  rows.value.map((row) => ({
    ...row,
    examLabel: formatExamDisplayTitle(row.examName, row.examRound, row.fiscalYear),
    fundSourceLabel: [row.fundSourceCode, row.fundSourceName].filter(Boolean).join(' '),
  })),
);

const pagination = computed<PaginationModel>(() => ({
  page: 1,
  rowsPerPage: displayRows.value.length || 10,
  rowsNumber: displayRows.value.length,
}));

const columns = computed<QTableColumn[]>(() => {
  void locale.value;
  return [
    {
      name: 'index',
      label: t('admin.dailyRevenueReport.table.columns.index'),
      field: 'index',
      align: 'center',
      style: 'width: 80px',
    },
    {
      name: 'examName',
      label: t('admin.dailyRevenueReport.table.columns.examName'),
      field: 'examLabel',
      align: 'left',
    },
    {
      name: 'fundSource',
      label: t('admin.dailyRevenueReport.table.columns.fundSource'),
      field: 'fundSourceLabel',
      align: 'left',
    },
    {
      name: 'amount',
      label: t('admin.dailyRevenueReport.table.columns.amount'),
      field: 'amount',
      align: 'right',
      style: 'width: 180px',
      format: (value: unknown) => formatReportAmount(Number(value) || 0),
    },
  ];
});

const reportTitle = computed(() => t('admin.dailyRevenueReport.pageTitle'));
const effectiveDateLabel = computed(() => {
  if (effectiveDates.value.length === 0) return '';
  return t('admin.dailyRevenueReport.effectiveDates', {
    dates: effectiveDates.value.map((date) => formatReportDate(date)).join(', '),
  });
});

const exportColumns = computed<FinanceReportColumn[]>(() => [
  {
    label: t('admin.dailyRevenueReport.table.columns.index'),
    value: (row) => readReportField(row, 'index'),
    align: 'center',
  },
  {
    label: t('admin.dailyRevenueReport.table.columns.examName'),
    value: (row) => readReportField(row, 'examLabel'),
  },
  {
    label: t('admin.dailyRevenueReport.table.columns.fundSource'),
    value: (row) => readReportField(row, 'fundSourceLabel'),
  },
  {
    label: t('admin.dailyRevenueReport.table.columns.amount'),
    value: (row) => formatReportAmount(Number(readReportField(row, 'amount')) || 0),
    align: 'right',
  },
]);

const exportSections = computed(() => [
  {
    rows: displayRows.value,
    totalLabel: t('admin.dailyRevenueReport.table.totalLabel'),
    totalValue: formattedTotal.value,
  },
]);

const exportExcel = (): void => {
  downloadFinanceReportXlsx({
    fileName: 'daily-revenue-report.xlsx',
    title: reportTitle.value,
    subtitle: effectiveDateLabel.value,
    columns: exportColumns.value,
    sections: exportSections.value,
  });
};

const exportPdf = (): void => {
  const opened = printFinanceReport({
    title: reportTitle.value,
    subtitle: effectiveDateLabel.value,
    columns: exportColumns.value,
    sections: exportSections.value,
  });
  if (!opened) {
    $q.notify({
      type: 'warning',
      message: t('admin.financeReport.printBlocked'),
      position: 'top',
    });
  }
};

watch(error, (message) => {
  if (message) {
    $q.notify({ type: 'negative', message, position: 'top' });
  }
});

onMounted(() => {
  const startDate = typeof route.query.startDate === 'string' ? route.query.startDate : '';
  const endDate = typeof route.query.endDate === 'string' ? route.query.endDate : '';
  if (startDate || endDate) {
    applyFilter({
      ...filter.value,
      startDate,
      endDate,
    });
  }
});
</script>

<style scoped lang="scss">
.daily-revenue-report-page {
  overflow-x: hidden;
}

.daily-revenue-table-wrapper {
  :deep(td),
  :deep(th) {
    padding: 12px 16px !important;
    vertical-align: middle !important;
  }
}

.total-row {
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  padding: 14px 12px;
  gap: 12px;
}

.total-label {
  font-weight: var(--font-weight-semibold);
}

.total-value {
  font-size: 1.1rem;
  font-weight: var(--font-weight-bold);
}
</style>
