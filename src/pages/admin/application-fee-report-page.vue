<template>
  <q-page class="page-container application-fee-report-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="$t('admin.applicationFeeReport.pageTitle')"
      :subtitle="$t('admin.applicationFeeReport.pageSubtitle')"
    />

    <!-- Filter Bar Component -->
    <DailyRevenueFilter
      :filter="filter"
      :department-options="departmentOptions"
      mode="compact"
      @filter-change="applyFilter"
    />

    <div class="row items-center justify-between q-mb-lg">
      <div style="width: 340px">
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

    <!-- Revenue Table -->
    <div class="q-mt-lg application-fee-table">
      <BaseTable
        :columns="columns"
        :rows="filteredReceipts"
        :loading="false"
        :pagination="pagination"
        :empty-label="$t('admin.applicationFeeReport.table.emptyLabel')"
      >
        <template #body-cell-actions="{ row }">
          <div class="row items-center justify-center">
            <ActionButton
              icon="download"
              color="scecondary"
              :tooltip="t('admin.applicationFeeReport.actions.viewRecord')"
              @click="onRecordAction(row)"
            />
          </div>
        </template>
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
import ActionButton from 'src/components/shared/action-button.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import { useDailyRevenue } from 'src/composables/use-daily-revenue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();

const { error, filter, departmentOptions, fetchData, loadDepartmentOptions, applyFilter } =
  useDailyRevenue();

type ApplicationFeeRow = {
  index: number;
  receiptNo: string;
  payer: string;
  amount: number;
  paymentDate: string;
  examName: string;
  importedDate: string;
  payee: string;
};

const { t } = useI18n();

const searchQuery = ref('');

const feeRows = ref([
  {
    index: 1,
    receiptNo: '6751300100001',
    payer: 'นาย สมศรี ใจดี',
    amount: 500.0,
    paymentDate: '01/05/2569 14:05:06',
    examName: '1/2026 การสอบวัดระดับภาษาอังกฤษ BUU-GET',
    importedDate: '11/05/2569 09:31:07',
    payee: 'สิงหา มานะอมรกุล',
  },
  {
    index: 2,
    receiptNo: '6751300100002',
    payer: 'นาย สมกบ ใจดี',
    amount: 500.0,
    paymentDate: '01/05/2569 14:25:16',
    examName: '1/2026 การสอบวัดระดับภาษาอังกฤษ BUU-GET',
    importedDate: '11/05/2569 09:31:07',
    payee: 'สิงหา มานะอมรกุล',
  },
]);

const filteredReceipts = computed(() => {
  if (!searchQuery.value) return feeRows.value;
  const q = searchQuery.value.toString().toLowerCase();
  return feeRows.value.filter((r) =>
    [r.receiptNo, r.payer, r.examName, r.payee].join(' ').toLowerCase().includes(q),
  );
});

const pagination = computed(() => ({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: filteredReceipts.value.length,
}));

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.applicationFeeReport.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width:60px',
  },
  {
    name: 'receiptNo',
    label: t('admin.applicationFeeReport.table.columns.receiptNo'),
    field: 'receiptNo',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'payer',
    label: t('admin.applicationFeeReport.table.columns.payer'),
    field: 'payer',
    align: 'left',
    style: 'width:180px',
  },
  {
    name: 'amount',
    label: t('admin.applicationFeeReport.table.columns.amount'),
    field: 'amount',
    align: 'center',
    style: 'width:120px',
    format: (val: unknown) => {
      const n = Number(val);
      return Number.isNaN(n) ? '0.00' : n.toFixed(2);
    },
  },
  {
    name: 'paymentDate',
    label: t('admin.applicationFeeReport.table.columns.paymentDate'),
    field: 'paymentDate',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'examName',
    label: t('admin.applicationFeeReport.table.columns.examName'),
    field: 'examName',
    align: 'left',
  },
  {
    name: 'importedDate',
    label: t('admin.applicationFeeReport.table.columns.importedDate'),
    field: 'importedDate',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'payee',
    label: t('admin.applicationFeeReport.table.columns.payee'),
    field: 'payee',
    align: 'left',
    style: 'width:160px',
  },
  {
    name: 'actions',
    label: t('admin.applicationFeeReport.table.columns.actions'),
    field: 'actions',
    align: 'center',
    style: 'width:110px',
  },
]);
const exportColumns: QTableColumn[] = [
  {
    name: 'index',
    label: t('admin.applicationFeeReport.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width:60px',
  },
  {
    name: 'receiptNo',
    label: t('admin.applicationFeeReport.table.columns.receiptNo'),
    field: 'receiptNo',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'payer',
    label: t('admin.applicationFeeReport.table.columns.payer'),
    field: 'payer',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'amount',
    label: t('admin.applicationFeeReport.table.columns.amount'),
    field: 'amount',
    align: 'center',
    style: 'width:120px',
  },
  {
    name: 'paymentDate',
    label: t('admin.applicationFeeReport.table.columns.paymentDate'),
    field: 'paymentDate',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'examName',
    label: t('admin.applicationFeeReport.table.columns.examName'),
    field: 'examName',
    align: 'center',
  },
  {
    name: 'importedDate',
    label: t('admin.applicationFeeReport.table.columns.importedDate'),
    field: 'importedDate',
    align: 'center',
    style: 'width:180px',
  },
  {
    name: 'payee',
    label: t('admin.applicationFeeReport.table.columns.payee'),
    field: 'payee',
    align: 'center',
    style: 'width:160px',
  },
];

const onRecordAction = (row: ApplicationFeeRow): void => {
  $q.notify({
    type: 'info',
    message: t('admin.applicationFeeReport.actions.viewRecordMessage', {
      receiptNo: row.receiptNo,
    }),
    position: 'top',
  });
};

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
.application-fee-report-page {
  overflow-x: hidden;
}
</style>
