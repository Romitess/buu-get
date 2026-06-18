<template>
  <q-page class="page-container receipt-usage-report-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="$t('admin.receiptUsageReport.pageTitle')"
      :subtitle="$t('admin.receiptUsageReport.pageSubtitle')"
    />
    <!-- Filter Bar Component -->
    <DailyRevenueFilter
      :filter="filter"
      :department-options="departmentOptions"
      mode="full"
      @filter-change="applyFilter"
    />

    <div class="row items-center justify-between q-mb-lg">
      <div class="col-6">
        <SearchBar v-model="searchQuery" />
      </div>
      <div class="text-weight-bold">&nbsp;</div>
      <ExportCsvButton
        :columns="exportColumns"
        :rows="filteredReceipts"
        file-name-prefix="receipt-usage-report"
        color="primary"
        unelevated
        class="text-weight-bold"
      />
    </div>

    <!-- Receipt Usage Table -->
    <div class="q-mt-lg receipt-usage-table">
      <BaseTable
        :columns="columns"
        :rows="filteredReceipts"
        :loading="false"
        :pagination="pagination"
        :empty-label="$t('admin.receiptUsageReport.table.emptyLabel')"
      >
      </BaseTable>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import DailyRevenueFilter from 'src/components/report/daily-revenue-filter.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import { useDailyRevenue } from 'src/composables/use-daily-revenue';
import BaseTable from 'src/components/shared/base-table.vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();

const { error, filter, departmentOptions, fetchData, loadDepartmentOptions, applyFilter } =
  useDailyRevenue();

// Mock rows for receipt usage table (not connected to API yet)
const receiptRows = ref([
  {
    index: 1,
    receiptNo: '6751300100001',
    paymentDate: '01/05/2569 14:05:06',
    receiptDate: '11/05/2569 09:31:07',
    year: '2569',
    documentType: 'ใบเสร็จ',
    amount: 500.0,
    examName: '1/2026 การสอบวัดระดับภาษาอังกฤษ BUU-GET',
    payer: 'นาย สมศรี ใจดี',
    payee: 'สิงหา มานะอมรกุล',
  },
  {
    index: 2,
    receiptNo: '6751300100002',
    paymentDate: '01/05/2569 14:25:16',
    receiptDate: '11/05/2569 09:31:07',
    year: '2569',
    documentType: 'ใบเสร็จ',
    amount: 500.0,
    examName: '1/2026 การสอบวัดระดับภาษาอังกฤษ BUU-GET',
    payer: 'นาย สมกบ ใจดี',
    payee: 'สิงหา มานะอมรกุล',
  },
]);

const { t } = useI18n();

const searchQuery = ref('');

const filteredReceipts = computed(() => {
  if (!searchQuery.value) return receiptRows.value;
  const q = searchQuery.value.toString().toLowerCase();
  return receiptRows.value.filter((r) => {
    return (
      String(r.receiptNo).toLowerCase().includes(q) ||
      String(r.examName).toLowerCase().includes(q) ||
      String(r.payer).toLowerCase().includes(q) ||
      String(r.payee).toLowerCase().includes(q)
    );
  });
});

const pagination = computed(() => ({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: filteredReceipts.value.length,
}));

const columns = computed<QTableColumn[]>(() => [
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
    align: 'left',
  },
  {
    name: 'paymentDate',
    label: t('admin.receiptUsageReport.table.columns.paymentDate'),
    field: 'paymentDate',
    align: 'center',
  },
  {
    name: 'receiptDate',
    label: t('admin.receiptUsageReport.table.columns.receiptDate'),
    field: 'receiptDate',
    align: 'center',
  },
  {
    name: 'year',
    label: t('admin.receiptUsageReport.table.columns.year'),
    field: 'year',
    align: 'center',
  },
  {
    name: 'amount',
    label: t('admin.receiptUsageReport.table.columns.amount'),
    field: 'amount',
    align: 'center',
    style: 'width:120px',
    format: (val: unknown) => {
      const n = Number(val);
      return Number.isNaN(n) ? '0.00' : n.toFixed(2);
    },
  },
  {
    name: 'examName',
    label: t('admin.receiptUsageReport.table.columns.examName'),
    field: 'examName',
    align: 'left',
  },
  {
    name: 'payer',
    label: t('admin.receiptUsageReport.table.columns.payer'),
    field: 'payer',
    align: 'left',
  },
  {
    name: 'payee',
    label: t('admin.receiptUsageReport.table.columns.payee'),
    field: 'payee',
    align: 'left',
  },
]);

const exportColumns: QTableColumn[] = [
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
    align: 'left',
  },
  {
    name: 'paymentDate',
    label: t('admin.receiptUsageReport.table.columns.paymentDate'),
    field: 'paymentDate',
    align: 'left',
  },
  {
    name: 'receiptDate',
    label: t('admin.receiptUsageReport.table.columns.receiptDate'),
    field: 'receiptDate',
    align: 'left',
  },
  {
    name: 'year',
    label: t('admin.receiptUsageReport.table.columns.year'),
    field: 'year',
    align: 'center',
  },
  {
    name: 'amount',
    label: t('admin.receiptUsageReport.table.columns.amount'),
    field: 'amount',
    align: 'right',
  },
  {
    name: 'examName',
    label: t('admin.receiptUsageReport.table.columns.examName'),
    field: 'examName',
    align: 'left',
  },
  {
    name: 'payer',
    label: t('admin.receiptUsageReport.table.columns.payer'),
    field: 'payer',
    align: 'left',
  },
  {
    name: 'payee',
    label: t('admin.receiptUsageReport.table.columns.payee'),
    field: 'payee',
    align: 'left',
  },
];

// Show error notification when error changes
watch(error, (newVal) => {
  if (newVal) {
    $q.notify({
      type: 'negative',
      message: newVal,
      position: 'top',
    });
  }
});

// Initial load
onMounted(() => {
  void loadDepartmentOptions();
  void fetchData();
});
</script>

<style scoped lang="scss">
.receipt-usage-report-page {
  overflow-x: hidden;
}

.receipt-usage-table {
  :deep(.base-table) {
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }
}
</style>
