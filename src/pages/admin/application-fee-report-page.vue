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
        :loading="loading"
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
import { fetchAllEnrollments } from 'src/services/enrollment.service';
import { useExamDocuments } from 'src/composables/use-exam-documents';
import ReceiptCard from 'src/components/receipt-card.vue';
import type { ExamEnrollment } from 'src/types/exam';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();

const { error, filter, departmentOptions, fetchData, loadDepartmentOptions, applyFilter } =
  useDailyRevenue();

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
};

const { t } = useI18n();

const searchQuery = ref('');
const loading = ref(false);
const enrollments = ref<ExamEnrollment[]>([]);

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

const loadEnrollments = async (): Promise<void> => {
  loading.value = true;
  try {
    const data = await fetchAllEnrollments();
    // Filter only those that are paid
    // Statuses representing paid are: PAID (1), SEAT_ASSIGNED (2), SEAT_PUBLISHED (3), ATTENDED (4)
    enrollments.value = (data as unknown as ExamEnrollment[]).filter((e) =>
      [1, 2, 3, 4].includes(e.ERM_STATUS),
    );
  } catch (err) {
    console.error(err);
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถดึงข้อมูลค่าธรรมเนียมสมัครสอบได้',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

const feeRows = computed(() => {
  return enrollments.value.map((enrollment, index) => {
    const transaction = enrollment.TRANSACTION;
    const receipt = transaction?.RECEIPTS?.[0];
    const examObj = enrollment.SESSION?.EXAM;

    const receiptYear = transaction?.TRANX_PAID_AT
      ? new Date(transaction.TRANX_PAID_AT).getFullYear()
      : examObj?.EXAM_DATE
        ? new Date(examObj.EXAM_DATE).getFullYear()
        : new Date().getFullYear();

    const receiptNo =
      (receipt?.RC_ID ? `RC${receiptYear}-${String(receipt.RC_ID).padStart(5, '0')}` : '') ||
      `RC${receiptYear}-${String(enrollment.ERM_ID).padStart(5, '0')}`;

    const payer =
      receipt?.RC_NAME ||
      `${enrollment.USER?.PROFILE?.userTitleTh || ''} ${enrollment.USER?.PROFILE?.userFullnameTh || ''}`.trim() ||
      'ผู้สมัครสอบ';

    const amount = Number(transaction?.TRANX_AMOUNT ?? examObj?.EXAM_FEE ?? 0);

    const paymentDate = formatThaiDate(transaction?.TRANX_PAID_AT);
    const importedDate = formatThaiDate(enrollment.CREATED_AT);

    const payee = 'สิงหา มานะอมรกุล';

    return {
      index: index + 1,
      receiptNo,
      payer,
      amount,
      paymentDate,
      examName: examObj?.EXAM_NAME || 'BUU-GET Exam',
      importedDate,
      payee,
      rawEnrollment: enrollment,
    };
  });
});

const filteredReceipts = computed(() => {
  let rows = feeRows.value;

  // 1. Date Filters
  if (filter.value.startDate) {
    const start = new Date(`${filter.value.startDate}T00:00:00`);
    rows = rows.filter((r) => {
      const paidDate = r.rawEnrollment.TRANSACTION?.TRANX_PAID_AT;
      return paidDate ? new Date(paidDate) >= start : false;
    });
  }
  if (filter.value.endDate) {
    const end = new Date(`${filter.value.endDate}T23:59:59`);
    rows = rows.filter((r) => {
      const paidDate = r.rawEnrollment.TRANSACTION?.TRANX_PAID_AT;
      return paidDate ? new Date(paidDate) <= end : false;
    });
  }

  // 2. Department Filter
  if (filter.value.department) {
    rows = rows.filter((r) => {
      const dept = r.rawEnrollment.SESSION?.EXAM?.FUND_SOURCE?.FS_FACULTY;
      return dept === filter.value.department;
    });
  }

  // 3. Exam Name Filter
  if (filter.value.examName) {
    const searchExam = filter.value.examName.toLowerCase();
    rows = rows.filter((r) => {
      const examName = r.rawEnrollment.SESSION?.EXAM?.EXAM_NAME || '';
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
    const examItem = {
      id: row.rawEnrollment.ERM_ID,
      title: row.examName,
      status: 'SUCCESS',
      statusType: 'success' as const,
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
  void loadDepartmentOptions();
  void fetchData();
  void loadEnrollments();
});
</script>

<style scoped lang="scss">
.application-fee-report-page {
  overflow-x: hidden;
}
</style>
