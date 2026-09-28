<template>
  <q-page class="page-container receipt-usage-report-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.receiptUsageReport.pageTitle')"
      :subtitle="$t('admin.receiptUsageReport.pageSubtitle')"
    />

    <DailyRevenueFilter :filter="filter" mode="usage" @filter-change="applyFilter" />

    <div class="row justify-end q-gutter-sm q-mb-md">
      <q-btn
        outline
        color="positive"
        :label="$t('admin.financeReport.exportExcel')"
        :disable="groups.length === 0"
        @click="exportExcel"
      />
      <q-btn
        outline
        color="negative"
        :label="$t('admin.financeReport.exportPdf')"
        :disable="groups.length === 0"
        @click="exportPdf"
      />
    </div>

    <div v-if="effectiveDateLabel" class="text-center text-weight-bold q-mb-md">
      {{ effectiveDateLabel }}
    </div>

    <div v-if="!isLoading && groups.length === 0" class="text-center q-pa-lg">
      {{ $t('admin.receiptUsageReport.table.emptyLabel') }}
    </div>

    <div v-for="group in displayGroups" :key="group.key" class="q-mb-lg receipt-usage-table">
      <div class="text-weight-bold q-mb-sm">{{ group.title }}</div>
      <BaseTable
        :columns="columns"
        :rows="group.rows"
        :loading="isLoading"
        :pagination="paginationFor(group.rows.length)"
        :empty-label="$t('admin.receiptUsageReport.table.emptyLabel')"
        hide-pagination
      />
      <div class="total-row row items-center justify-end no-wrap">
        <span class="total-label">{{ $t('admin.receiptUsageReport.table.totalLabel') }}</span>
        <span class="total-value">{{ group.totalLabel }}</span>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import DailyRevenueFilter from 'src/components/report/daily-revenue-filter.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import { fetchReceiptUsageReport } from 'src/services/finance-report.service';
import {
  emptyFinanceReportFilter,
  type FinanceReportFilter,
  type ReceiptUsageReportGroup,
} from 'src/types/finance-report.types';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import {
  downloadFinanceReportXlsx,
  formatReportAmount,
  formatReportDate,
  formatReportDateTime,
  printFinanceReport,
  readReportField,
  type FinanceReportColumn,
  type FinanceReportSection,
} from 'src/utils/finance-report-export';

const $q = useQuasar();
const { t, locale } = useI18n();

const filter = ref<FinanceReportFilter>(emptyFinanceReportFilter());
const groups = ref<ReceiptUsageReportGroup[]>([]);
const effectiveDates = ref<string[]>([]);
const isLoading = ref(false);

const statusLabel = (status: string): string =>
  status === 'voided'
    ? t('admin.receiptUsageReport.status.voided')
    : t('admin.receiptUsageReport.status.issued');

const voidDetail = (row: ReceiptUsageReportGroup['rows'][number]): string => {
  if (row.status !== 'voided') return '';
  return [row.voidedBy, formatReportDateTime(row.voidedAt), row.voidReason].filter(Boolean).join(' ');
};

const displayGroups = computed(() =>
  groups.value.map((group) => ({
    key: `${group.fundSourceId ?? 'none'}-${group.fundSourceCode}`,
    title: t('admin.receiptUsageReport.groupTitle', {
      code: group.fundSourceCode || '-',
      name: group.fundSourceName || '-',
    }),
    totalLabel: formatReportAmount(group.totalAmount),
    rows: group.rows.map((row) => ({
      ...row,
      examLabel: formatExamDisplayTitle(row.examName, row.examRound, row.fiscalYear),
      paidLabel: formatReportDateTime(row.paidAt),
      receiptLabel: formatReportDateTime(row.receiptIssuedAt),
      amountLabel: formatReportAmount(row.amount),
      statusLabel: statusLabel(row.status),
      voidLabel: voidDetail(row),
      fiscalYearLabel: row.fiscalYear || '-',
    })),
  })),
);

const effectiveDateLabel = computed(() => {
  if (effectiveDates.value.length === 0) return '';
  return t('admin.dailyRevenueReport.effectiveDates', {
    dates: effectiveDates.value.map((date) => formatReportDate(date)).join(', '),
  });
});

const columns = computed<QTableColumn[]>(() => {
  void locale.value;
  return [
    {
      name: 'index',
      label: t('admin.receiptUsageReport.table.columns.index'),
      field: 'index',
      align: 'center',
    },
    {
      name: 'receiptNo',
      label: t('admin.receiptUsageReport.table.columns.receiptNo'),
      field: 'receiptNo',
      align: 'center',
    },
    {
      name: 'voided',
      label: t('admin.receiptUsageReport.table.columns.voided'),
      field: 'voidLabel',
      align: 'left',
    },
    {
      name: 'paymentDate',
      label: t('admin.receiptUsageReport.table.columns.paymentDate'),
      field: 'paidLabel',
      align: 'center',
    },
    {
      name: 'receiptDate',
      label: t('admin.receiptUsageReport.table.columns.receiptDate'),
      field: 'receiptLabel',
      align: 'center',
    },
    {
      name: 'year',
      label: t('admin.receiptUsageReport.table.columns.year'),
      field: 'fiscalYearLabel',
      align: 'center',
    },
    {
      name: 'amount',
      label: t('admin.receiptUsageReport.table.columns.amount'),
      field: 'amountLabel',
      align: 'right',
    },
    {
      name: 'examName',
      label: t('admin.receiptUsageReport.table.columns.examName'),
      field: 'examLabel',
      align: 'left',
    },
    {
      name: 'applicant',
      label: t('admin.receiptUsageReport.table.columns.applicant'),
      field: 'applicantName',
      align: 'left',
    },
    {
      name: 'payer',
      label: t('admin.receiptUsageReport.table.columns.payer'),
      field: 'payerName',
      align: 'left',
    },
    {
      name: 'payee',
      label: t('admin.receiptUsageReport.table.columns.payee'),
      field: 'collectorName',
      align: 'left',
    },
  ];
});

const exportColumns = computed<FinanceReportColumn[]>(() =>
  columns.value.map((column) => ({
    label: column.label,
    align: column.align === 'right' || column.align === 'center' ? column.align : 'left',
    value: (row) => {
      const field = typeof column.field === 'string' ? column.field : column.name;
      return readReportField(row, field);
    },
  })),
);

const exportSections = computed<FinanceReportSection[]>(() =>
  displayGroups.value.map((group) => ({
    title: group.title,
    rows: group.rows,
    totalLabel: t('admin.receiptUsageReport.table.totalLabel'),
    totalValue: group.totalLabel,
  })),
);

const paginationFor = (count: number) => ({
  page: 1,
  rowsPerPage: count || 10,
  rowsNumber: count,
});

const loadRows = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const report = await fetchReceiptUsageReport({
      fiscalYear: filter.value.fiscalYear,
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
      fundSourceId: filter.value.fundSourceId,
      examName: filter.value.examName,
      payerName: filter.value.payerName,
      collectorName: filter.value.collectorName,
      receiptNo: filter.value.receiptNo,
      status: filter.value.status,
    });
    groups.value = report.groups;
    effectiveDates.value = report.effectiveDates;
  } catch {
    groups.value = [];
    effectiveDates.value = [];
    $q.notify({
      type: 'negative',
      message: t('admin.receiptUsageReport.notifications.loadError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const applyFilter = (next: FinanceReportFilter): void => {
  filter.value = { ...next };
  void loadRows();
};

const exportExcel = (): void => {
  downloadFinanceReportXlsx({
    fileName: 'receipt-usage-report.xlsx',
    title: t('admin.receiptUsageReport.pageTitle'),
    subtitle: effectiveDateLabel.value,
    columns: exportColumns.value,
    sections: exportSections.value,
  });
};

const exportPdf = (): void => {
  const opened = printFinanceReport({
    title: t('admin.receiptUsageReport.pageTitle'),
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

onMounted(() => {
  void loadRows();
});
</script>

<style scoped lang="scss">
.receipt-usage-report-page {
  overflow-x: hidden;
}

.total-row {
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-top: none;
  padding: 12px 16px;
  gap: 12px;
}

.total-label,
.total-value {
  font-weight: var(--font-weight-bold);
}
</style>
