<template>
  <q-page class="page-container application-fee-report-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.applicationFeeReport.pageTitle')"
      :subtitle="$t('admin.applicationFeeReport.pageSubtitle')"
    />

    <DailyRevenueFilter :filter="filter" mode="application" @filter-change="applyFilter" />

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

    <div class="q-mt-lg application-fee-table">
      <BaseTable
        :columns="columns"
        :rows="displayRows"
        :loading="isLoading"
        :pagination="pagination"
        :empty-label="$t('admin.applicationFeeReport.table.emptyLabel')"
        hide-pagination
      >
        <template #body-cell-status="{ row }">
          <div>
            {{ statusLabel(row.status) }}
            <div v-if="row.status === 'voided'" class="text-caption text-negative">
              {{ voidDetail(row) }}
            </div>
          </div>
        </template>
        <template #body-cell-actions="{ row }">
          <div class="row items-center justify-center">
            <ActionButton
              v-if="row.status === 'issued'"
              icon="download"
              color="secondary"
              :tooltip="t('exam.history.downloadReceipt')"
              @click="onDownload(row)"
            />
            <span v-else>-</span>
          </div>
        </template>
      </BaseTable>
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
import ActionButton from 'src/components/shared/action-button.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import { downloadReceipt } from 'src/services/receipt.service';
import { fetchApplicationFeeReport } from 'src/services/finance-report.service';
import {
  emptyFinanceReportFilter,
  type ApplicationFeeReportRow,
  type FinanceReportFilter,
} from 'src/types/finance-report.types';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import {
  downloadFinanceReportXlsx,
  formatReportAmount,
  formatReportDateTime,
  printFinanceReport,
  readReportField,
  type FinanceReportColumn,
} from 'src/utils/finance-report-export';

const $q = useQuasar();
const { t, locale } = useI18n();

const filter = ref<FinanceReportFilter>(emptyFinanceReportFilter());
const rows = ref<ApplicationFeeReportRow[]>([]);
const isLoading = ref(false);

const statusLabel = (status: ApplicationFeeReportRow['status']): string =>
  status === 'voided'
    ? t('admin.applicationFeeReport.status.voided')
    : t('admin.applicationFeeReport.status.issued');

const voidDetail = (row: ApplicationFeeReportRow): string =>
  [row.voidedBy, formatReportDateTime(row.voidedAt), row.voidReason].filter(Boolean).join(' ');

const displayRows = computed(() =>
  rows.value.map((row) => ({
    ...row,
    examLabel: formatExamDisplayTitle(row.examName, row.examRound, row.fiscalYear),
    fundSourceLabel: [row.fundSourceCode, row.fundSourceName].filter(Boolean).join(' '),
    paidLabel: formatReportDateTime(row.paidAt),
    receiptLabel: formatReportDateTime(row.receiptIssuedAt),
    amountLabel: formatReportAmount(row.amount),
    collectorLabel: [row.collectorName, formatReportDateTime(row.receiptIssuedAt)]
      .filter((part) => part && part !== '-')
      .join(' '),
    statusLabel: statusLabel(row.status),
    voidLabel: row.status === 'voided' ? voidDetail(row) : '',
  })),
);

const pagination = computed(() => ({
  page: 1,
  rowsPerPage: displayRows.value.length || 10,
  rowsNumber: displayRows.value.length,
}));

const columns = computed<QTableColumn[]>(() => {
  void locale.value;
  return [
    {
      name: 'index',
      label: t('admin.applicationFeeReport.table.columns.index'),
      field: 'index',
      align: 'center',
    },
    {
      name: 'receiptNo',
      label: t('admin.applicationFeeReport.table.columns.receiptNo'),
      field: 'receiptNo',
      align: 'center',
    },
    {
      name: 'payer',
      label: t('admin.applicationFeeReport.table.columns.payer'),
      field: 'payerName',
      align: 'left',
    },
    {
      name: 'amount',
      label: t('admin.applicationFeeReport.table.columns.amount'),
      field: 'amountLabel',
      align: 'right',
    },
    {
      name: 'paymentDate',
      label: t('admin.applicationFeeReport.table.columns.paymentDate'),
      field: 'paidLabel',
      align: 'center',
    },
    {
      name: 'applicant',
      label: t('admin.applicationFeeReport.table.columns.applicant'),
      field: 'applicantName',
      align: 'left',
    },
    {
      name: 'examName',
      label: t('admin.applicationFeeReport.table.columns.examName'),
      field: 'examLabel',
      align: 'left',
    },
    {
      name: 'fundSource',
      label: t('admin.applicationFeeReport.table.columns.fundSource'),
      field: 'fundSourceLabel',
      align: 'left',
    },
    {
      name: 'collector',
      label: t('admin.applicationFeeReport.table.columns.collector'),
      field: 'collectorLabel',
      align: 'left',
    },
    {
      name: 'status',
      label: t('admin.applicationFeeReport.table.columns.status'),
      field: 'statusLabel',
      align: 'center',
    },
    {
      name: 'actions',
      label: t('admin.applicationFeeReport.table.columns.actions'),
      field: 'actions',
      align: 'center',
    },
  ];
});

const exportColumns = computed<FinanceReportColumn[]>(() =>
  columns.value
    .filter((column) => column.name !== 'actions')
    .map((column) => ({
      label: column.label,
      align: column.align === 'right' || column.align === 'center' ? column.align : 'left',
      value: (row) => {
        if (column.name === 'status') {
          const status = readReportField(row, 'statusLabel');
          const detail = readReportField(row, 'voidLabel');
          return detail ? `${status} ${detail}` : status;
        }
        const field = typeof column.field === 'string' ? column.field : column.name;
        return readReportField(row, field);
      },
    })),
);

const loadRows = async (): Promise<void> => {
  isLoading.value = true;
  try {
    const report = await fetchApplicationFeeReport({
      receiptDate: filter.value.receiptDate,
      paidDate: filter.value.paidDate,
      examName: filter.value.examName,
      fundSourceId: filter.value.fundSourceId,
    });
    rows.value = report.rows;
  } catch {
    rows.value = [];
    $q.notify({
      type: 'negative',
      message: t('admin.applicationFeeReport.notifications.loadError'),
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
    fileName: 'application-fee-report.xlsx',
    title: t('admin.applicationFeeReport.pageTitle'),
    columns: exportColumns.value,
    sections: [{ rows: displayRows.value }],
  });
};

const exportPdf = (): void => {
  const opened = printFinanceReport({
    title: t('admin.applicationFeeReport.pageTitle'),
    columns: exportColumns.value,
    sections: [{ rows: displayRows.value }],
  });
  if (!opened) {
    $q.notify({
      type: 'warning',
      message: t('admin.financeReport.printBlocked'),
      position: 'top',
    });
  }
};

const onDownload = async (row: ApplicationFeeReportRow): Promise<void> => {
  if (!row.tranxId || row.status !== 'issued') return;
  try {
    await downloadReceipt(row.tranxId);
    $q.notify({
      type: 'positive',
      message: t('admin.applicationFeeReport.notifications.downloadSuccess'),
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.applicationFeeReport.notifications.downloadError'),
      position: 'top',
    });
  }
};

onMounted(() => {
  void loadRows();
});
</script>

<style scoped lang="scss">
.application-fee-report-page {
  overflow-x: hidden;
}
</style>
