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
        :loading="loading"
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
import { fetchIssuedReceipts, type IssuedReceipt } from 'src/services/receipt.service';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import type { DailyRevenueFilter as DailyRevenueFilterModel } from 'src/types/daily-revenue.types';

const $q = useQuasar();

const { error, filter, departmentOptions, loadDepartmentOptions } = useDailyRevenue();

const { t } = useI18n();

const searchQuery = ref('');
const loading = ref(false);
const receipts = ref<IssuedReceipt[]>([]);

type ReceiptUsageRow = {
  index: number;
  receiptNo: string;
  paymentDate: string;
  receiptDate: string;
  year: string;
  documentType: string;
  amount: number;
  examName: string;
  payer: string;
  payee: string;
  paymentDateRaw: string | null;
  department: string;
};

const applyFilter = (newFilter: DailyRevenueFilterModel): void => {
  filter.value = { ...newFilter };
};

const formatThaiDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const buddhistYear = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${buddhistYear} ${hours}:${minutes}:${seconds}`;
};

const formatReceiptYear = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? '-' : String(date.getFullYear() + 543);
};

const getReceiptNo = (receipt: IssuedReceipt, paymentDate: string | null): string => {
  const receiptYear = paymentDate
    ? new Date(paymentDate).getFullYear()
    : receipt.RC_ISSUED_AT
      ? new Date(receipt.RC_ISSUED_AT).getFullYear()
      : new Date(receipt.CREATED_AT).getFullYear();

  return `RC${receiptYear}-${String(receipt.RC_ID).padStart(5, '0')}`;
};

const getReceiptBankReconcile = (receipt: IssuedReceipt) => {
  const bankReconciles = receipt.TRANSACTION?.BANK_RECONCILES ?? [];
  return [...bankReconciles].sort(
    (left, right) => new Date(right.CREATED_AT).getTime() - new Date(left.CREATED_AT).getTime(),
  )[0];
};

const getPersonName = (
  profile?: {
    userTitleTh?: string | null;
    userFullnameTh?: string | null;
    userTitleEn?: string | null;
    userFullnameEn?: string | null;
  } | null,
): string => {
  const fullnameTh = [profile?.userTitleTh, profile?.userFullnameTh].filter(Boolean).join(' ');
  const fullnameEn = [profile?.userTitleEn, profile?.userFullnameEn].filter(Boolean).join(' ');
  return fullnameTh || fullnameEn;
};

const getPayeeName = (receipt: IssuedReceipt): string => {
  const bankReconcile = getReceiptBankReconcile(receipt);
  return getPersonName(bankReconcile?.USER?.PROFILE) || bankReconcile?.USER?.USER_EMAIL || '-';
};

const loadReceipts = async (): Promise<void> => {
  loading.value = true;
  try {
    receipts.value = await fetchIssuedReceipts();
  } catch (err) {
    console.error(err);
    receipts.value = [];
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถดึงข้อมูลการใช้ใบเสร็จรับเงินได้',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const receiptRows = computed<ReceiptUsageRow[]>(() =>
  receipts.value.flatMap((receipt, index) => {
    const transaction = receipt.TRANSACTION;
    const enrollment = transaction?.ENROLLMENT;
    if (!transaction || !enrollment) return [];

    const exam = enrollment.SESSION?.EXAM;
    const paymentDateRaw = transaction.TRANX_PAID_AT ?? receipt.RC_ISSUED_AT;
    const receiptDateRaw = receipt.RC_ISSUED_AT ?? receipt.CREATED_AT;
    const payer =
      receipt.RC_NAME ||
      getPersonName(enrollment.USER?.PROFILE) ||
      enrollment.USER?.USER_EMAIL ||
      'ผู้สมัครสอบ';

    return [
      {
        index: index + 1,
        receiptNo: getReceiptNo(receipt, paymentDateRaw),
        paymentDate: formatThaiDate(paymentDateRaw),
        receiptDate: formatThaiDate(receiptDateRaw),
        year: formatReceiptYear(receiptDateRaw),
        documentType: 'ใบเสร็จ',
        amount: Number(transaction.TRANX_AMOUNT ?? exam?.EXAM_FEE ?? 0),
        examName: exam?.EXAM_ROUND
          ? `${exam.EXAM_NAME} ${exam.EXAM_ROUND}`
          : exam?.EXAM_NAME || 'BUU-GET Exam',
        payer,
        payee: getPayeeName(receipt),
        paymentDateRaw,
        department: exam?.FUND_SOURCE?.FS_FACULTY || '',
      },
    ];
  }),
);

const filteredReceipts = computed(() => {
  let rows = receiptRows.value;

  if (filter.value.startDate) {
    const start = new Date(`${filter.value.startDate}T00:00:00`);
    rows = rows.filter((row) =>
      row.paymentDateRaw ? new Date(row.paymentDateRaw) >= start : false,
    );
  }

  if (filter.value.endDate) {
    const end = new Date(`${filter.value.endDate}T23:59:59`);
    rows = rows.filter((row) => (row.paymentDateRaw ? new Date(row.paymentDateRaw) <= end : false));
  }

  if (filter.value.department) {
    rows = rows.filter((row) => row.department === filter.value.department);
  }

  if (filter.value.examName) {
    const examName = filter.value.examName.toLowerCase();
    rows = rows.filter((row) => row.examName.toLowerCase().includes(examName));
  }

  if (filter.value.receiptNo) {
    const receiptNo = filter.value.receiptNo.toLowerCase();
    rows = rows.filter((row) => row.receiptNo.toLowerCase().includes(receiptNo));
  }

  if (filter.value.payerName) {
    const payerName = filter.value.payerName.toLowerCase();
    rows = rows.filter((row) => row.payer.toLowerCase().includes(payerName));
  }

  if (filter.value.payeeName) {
    const payeeName = filter.value.payeeName.toLowerCase();
    rows = rows.filter((row) => row.payee.toLowerCase().includes(payeeName));
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toString().toLowerCase();
    rows = rows.filter((row) =>
      [
        row.receiptNo,
        row.paymentDate,
        row.receiptDate,
        row.year,
        row.documentType,
        row.examName,
        row.payer,
        row.payee,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }

  return rows.map((row, index) => ({ ...row, index: index + 1 }));
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
  void loadReceipts();
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
