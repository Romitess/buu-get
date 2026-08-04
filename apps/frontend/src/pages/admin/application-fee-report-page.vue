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
    <DailyRevenueFilter :filter="filter" mode="compact" @filter-change="applyFilter" />

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

    <!-- Revenue Table -->
    <div class="q-mt-lg application-fee-table">
      <BaseTable
        :columns="columns"
        :rows="filteredReceipts"
        :loading="isLoading"
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

    <!-- Hidden container for Receipt PDF generation -->
    <div
      v-if="isDownloadingReceipt"
      id="receipt-render-container"
      style="
        position: absolute;
        left: -9999px;
        top: -9999px;
        width: 210mm;
        height: 297mm;
        z-index: -1000;
        pointer-events: none;
        background-color: #ffffff;
      "
    >
      <ReceiptCard :receipt="selectedReceiptData" :is-copy="true" />
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
import { useExamDocuments } from 'src/composables/use-exam-documents';
import { fetchIssuedReceipts, type IssuedReceipt } from 'src/services/receipt.service';
import ReceiptCard from 'src/components/receipt-card.vue';
import type { ExamEnrollment, ExamHistoryItem } from 'src/types/exam';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';

const $q = useQuasar();

const { error, filter, fetchData, applyFilter } = useDailyRevenue();

const { isDownloadingReceipt, selectedReceiptData, printReceipt } = useExamDocuments();

type ApplicationFeeRow = {
  index: number;
  receiptNo: string;
  payer: string;
  amount: number;
  paymentDate: string;
  examName: string;
  importedDate: string;
  payee: string;
  rawEnrollment: ExamEnrollment;
  paymentDateRaw: string | null;
};

const { t } = useI18n();

const searchQuery = ref('');
const isLoading = ref(false);
const receipts = ref<IssuedReceipt[]>([]);

const formatThaiDate = (dateStr?: string | Date) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const buddhistYear = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${buddhistYear} ${hours}:${minutes}:${seconds}`;
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

const getImporterName = (receipt: IssuedReceipt): string => {
  const bankReconcile = getReceiptBankReconcile(receipt);
  const profile = bankReconcile?.USER?.PROFILE;
  const fullnameTh = [profile?.userTitleTh, profile?.userFullnameTh].filter(Boolean).join(' ');
  const fullnameEn = [profile?.userTitleEn, profile?.userFullnameEn].filter(Boolean).join(' ');

  return fullnameTh || fullnameEn || bankReconcile?.USER?.USER_EMAIL || '-';
};

const buildReceiptEnrollment = (receipt: IssuedReceipt): ExamEnrollment | null => {
  const transaction = receipt.TRANSACTION;
  const enrollment = transaction?.ENROLLMENT;
  if (!transaction || !enrollment) return null;

  const bankReconciles = transaction.BANK_RECONCILES?.map((bankReconcile) => ({
    BR_ID: bankReconcile.BR_ID,
    TRANX_ID: transaction.TRANX_ID,
  }));
  const receiptTaxId = receipt.RC_TAX_ID === null ? null : Number(receipt.RC_TAX_ID);

  return {
    ...enrollment,
    TRANSACTION: {
      TRANX_ID: transaction.TRANX_ID,
      ...(enrollment.TRANSACTION?.TRANX_MATCH_STATUS !== undefined
        ? { TRANX_MATCH_STATUS: enrollment.TRANSACTION.TRANX_MATCH_STATUS }
        : {}),
      ...(transaction.TRANX_PAID_AT ? { TRANX_PAID_AT: transaction.TRANX_PAID_AT } : {}),
      ...(transaction.TRANX_CREATED_AT ? { TRANX_CREATED_AT: transaction.TRANX_CREATED_AT } : {}),
      TRANX_AMOUNT: Number(transaction.TRANX_AMOUNT ?? 0),
      ...(transaction.TRANX_CHANNEL !== null ? { TRANX_CHANNEL: transaction.TRANX_CHANNEL } : {}),
      RECEIPTS: [
        {
          RC_ID: receipt.RC_ID,
          RC_NAME: receipt.RC_NAME,
          RC_TAX_ID: receiptTaxId === null || Number.isNaN(receiptTaxId) ? null : receiptTaxId,
          RC_PHONE: receipt.RC_PHONE,
          RC_ADDRESS: receipt.RC_ADDRESS,
          RC_STATUS: receipt.RC_STATUS,
        },
      ],
      ...(bankReconciles ? { BANK_RECONCILES: bankReconciles } : {}),
    },
  };
};

const loadReceipts = async (): Promise<void> => {
  isLoading.value = true;
  try {
    receipts.value = await fetchIssuedReceipts();
  } catch (err) {
    console.error(err);
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถดึงข้อมูลค่าธรรมเนียมสมัครสอบได้',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const feeRows = computed(() => {
  return receipts.value.flatMap((receipt, index) => {
    const transaction = receipt.TRANSACTION;
    const enrollment = buildReceiptEnrollment(receipt);
    if (!transaction || !enrollment) return [];

    const examObj = enrollment.SESSION?.EXAM;
    const paymentDateRaw = transaction.TRANX_PAID_AT ?? receipt.RC_ISSUED_AT;

    const payer =
      receipt.RC_NAME ||
      `${enrollment.USER?.PROFILE?.userTitleTh || ''} ${enrollment.USER?.PROFILE?.userFullnameTh || ''}`.trim() ||
      'ผู้สมัครสอบ';

    const amount = Number(transaction.TRANX_AMOUNT ?? examObj?.EXAM_FEE ?? 0);
    const bankReconcile = getReceiptBankReconcile(receipt);

    const paymentDate = formatThaiDate(paymentDateRaw ?? undefined);
    const importedDate = formatThaiDate(bankReconcile?.CREATED_AT);
    const payee = getImporterName(receipt);

    return [
      {
        index: index + 1,
        receiptNo: getReceiptNo(receipt, paymentDateRaw),
        payer,
        amount,
        paymentDate,
        examName:
          formatExamDisplayTitle(
            examObj?.EXAM_NAME,
            examObj?.EXAM_ROUND,
            examObj?.EXAM_FISCAL_YEAR,
          ) ||
          examObj?.EXAM_NAME ||
          'BUU-GET Exam',
        importedDate,
        payee,
        rawEnrollment: enrollment,
        paymentDateRaw,
      },
    ];
  });
});

const filteredReceipts = computed(() => {
  let rows = feeRows.value;

  // 1. Date Filters
  if (filter.value.startDate) {
    const start = new Date(`${filter.value.startDate}T00:00:00`);
    rows = rows.filter((r) => {
      return r.paymentDateRaw ? new Date(r.paymentDateRaw) >= start : false;
    });
  }
  if (filter.value.endDate) {
    const end = new Date(`${filter.value.endDate}T23:59:59`);
    rows = rows.filter((r) => {
      return r.paymentDateRaw ? new Date(r.paymentDateRaw) <= end : false;
    });
  }

  // Exam Name Filter
  if (filter.value.examName) {
    const searchExam = filter.value.examName.toLowerCase();
    rows = rows.filter((r) => {
      const examName = r.examName || '';
      return examName.toLowerCase().includes(searchExam);
    });
  }

  // 4. Search Query Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toString().toLowerCase();
    rows = rows.filter((r) =>
      [r.receiptNo, r.payer, r.examName, r.payee].join(' ').toLowerCase().includes(q),
    );
  }

  return rows.map((r, i) => ({ ...r, index: i + 1 }));
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
    sortable: true,
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

const onRecordAction = async (row: ApplicationFeeRow): Promise<void> => {
  try {
    const examItem: ExamHistoryItem = {
      id: row.rawEnrollment.ERM_ID,
      title: row.examName,
      status: 'exam.status.verified',
      statusType: 'success',
      category: 'registration',
      registrationStatus: {
        label: 'exam.status.verified',
        type: 'success',
      },
      date: row.paymentDate,
      time: '',
      location: '',
      rawEnrollment: row.rawEnrollment,
    };
    await printReceipt(examItem);
  } catch (err) {
    console.error(err);
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ',
      position: 'top',
    });
  }
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
  void fetchData();
  void loadReceipts();
});
</script>

<style scoped lang="scss">
.application-fee-report-page {
  overflow-x: hidden;
}
</style>
