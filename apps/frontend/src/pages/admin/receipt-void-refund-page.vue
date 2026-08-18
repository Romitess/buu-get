<template>
  <q-page class="page-container receipt-void-refund-page">
    <AppBreadcrumbs />

    <AppPageHeader
      :title="t('admin.receiptVoidRefund.pageTitle')"
      :subtitle="t('admin.receiptVoidRefund.pageSubtitle')"
    />

    <q-card flat bordered class="search-card q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">
          {{ t('admin.receiptVoidRefund.searchTitle') }}
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <q-input
              v-model="searchForm.ref1"
              outlined
              dense
              bg-color="white"
              :label="t('admin.searchUser.table.applicantId')"
              :placeholder="t('admin.searchUser.placeholderRef1')"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="searchForm.ref2"
              outlined
              dense
              bg-color="white"
              :label="t('admin.searchUser.table.referenceNo')"
              :placeholder="t('admin.searchUser.placeholderRef2')"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="searchForm.name"
              outlined
              dense
              bg-color="white"
              :label="t('admin.searchUser.table.fullName')"
              :placeholder="t('admin.searchUser.placeholderName')"
              clearable
            />
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="searchForm.examName"
              outlined
              dense
              bg-color="white"
              :label="t('admin.searchUser.table.examName')"
              :placeholder="t('admin.receiptVoidRefund.placeholderExamName')"
              clearable
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      row-key="id"
      :empty-label="t('admin.receiptVoidRefund.emptyTable')"
      @request="onRequest"
    >
      <template #body-cell-paymentStatus="{ row }">
        <q-td class="text-center">{{ row.paymentStatusLabel }}</q-td>
      </template>
      <template #body-cell-receiptStatus="{ row }">
        <q-td class="text-center">{{ row.receiptStatusLabel }}</q-td>
      </template>
      <template #body-cell-actions="{ row }">
        <q-td class="text-center">
          <div class="row q-gutter-sm justify-center no-wrap">
            <AppButton
              v-if="row.canRefund"
              class="action-status-btn"
              :label="t('admin.receiptVoidRefund.actions.refund')"
              color="warning"
              size="sm"
              :disable="isActionLoading"
              @click="openRefundDialog(row)"
            />
            <AppButton
              v-if="row.canVoid"
              class="action-status-btn"
              :label="t('admin.receiptVoidRefund.actions.voidReceipt')"
              color="negative"
              size="sm"
              :disable="isActionLoading"
              @click="openVoidDialog(row)"
            />
            <span v-if="!row.canRefund && !row.canVoid" class="text-grey-6">
              {{ t('admin.receiptVoidRefund.actions.none') }}
            </span>
          </div>
        </q-td>
      </template>
    </BaseTable>

    <AppConfirmDialog
      v-model="showRefundConfirm"
      :title="t('admin.receiptVoidRefund.refundDialog.title')"
      :message="t('admin.receiptVoidRefund.refundDialog.message')"
      :confirm-label="t('admin.receiptVoidRefund.actions.refund')"
      confirm-color="warning"
      @confirm="confirmRefund"
    />

    <q-dialog v-model="showVoidDialog" persistent>
      <q-card class="void-dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-weight-bold">
            {{ t('admin.receiptVoidRefund.voidDialog.title') }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="text-body2 q-mb-md">
            {{ t('admin.receiptVoidRefund.voidDialog.message') }}
          </div>
          <q-input
            v-model="voidReason"
            type="textarea"
            outlined
            autogrow
            :label="t('admin.receiptVoidRefund.voidDialog.reasonLabel')"
            :error="voidReasonError"
            :error-message="t('admin.receiptVoidRefund.voidDialog.reasonRequired')"
            hide-bottom-space
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-gutter-sm">
          <AppButton :label="t('common.cancel')" @click="showVoidDialog = false" />
          <AppButton
            :label="t('admin.receiptVoidRefund.actions.voidReceipt')"
            color="negative"
            :loading="isActionLoading"
            @click="confirmVoid"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import { debounce, useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppConfirmDialog from 'src/components/shared/app-confirm-dialog.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import {
  searchTransactionRefs,
  type BackendTransactionRef,
  type BackendTransactionRefEnrollment,
  type TransactionRefSearchParams,
} from 'src/services/transaction-ref.service';
import { refundTransaction } from 'src/services/transaction.service';
import { voidReceipt } from 'src/services/voided-receipt.service';
import { ReceiptStatus, TRANSACTION_PAYMENT_STATUS } from 'src/constants/exam';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface SearchCriteria {
  ref1: string;
  ref2: string;
  name: string;
  examName: string;
}

interface VoidRefundRow {
  id: number;
  index: number;
  ref1: string;
  ref2: string;
  name: string;
  examName: string;
  amount: string;
  paymentStatusLabel: string;
  receiptStatusLabel: string;
  tranxId: number;
  receiptId: number | null;
  canRefund: boolean;
  canVoid: boolean;
}

const { t, locale } = useI18n();
const $q = useQuasar();

const isLoading = ref(false);
const isActionLoading = ref(false);
const rows = ref<VoidRefundRow[]>([]);
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const createEmptyCriteria = (): SearchCriteria => ({
  ref1: '',
  ref2: '',
  name: '',
  examName: '',
});

const searchForm = ref({
  ref1: '',
  ref2: '',
  name: '',
  examName: '',
});
const activeSearchCriteria = ref<SearchCriteria>(createEmptyCriteria());

const showRefundConfirm = ref(false);
const showVoidDialog = ref(false);
const voidReason = ref('');
const voidReasonError = ref(false);
const selectedRow = ref<VoidRefundRow | null>(null);

const paymentStatusLabels: Record<number, string> = {
  [TRANSACTION_PAYMENT_STATUS.PENDING]: t('admin.receiptVoidRefund.paymentStatus.pending'),
  [TRANSACTION_PAYMENT_STATUS.APPROVED]: t('admin.receiptVoidRefund.paymentStatus.approved'),
  [TRANSACTION_PAYMENT_STATUS.REJECTED]: t('admin.receiptVoidRefund.paymentStatus.rejected'),
  [TRANSACTION_PAYMENT_STATUS.PAID]: t('admin.receiptVoidRefund.paymentStatus.paid'),
  [TRANSACTION_PAYMENT_STATUS.PAYMENT_FAILED]: t(
    'admin.receiptVoidRefund.paymentStatus.paymentFailed',
  ),
  [TRANSACTION_PAYMENT_STATUS.EXPIRED]: t('admin.receiptVoidRefund.paymentStatus.expired'),
  [TRANSACTION_PAYMENT_STATUS.REVERSED]: t('admin.receiptVoidRefund.paymentStatus.reversed'),
  [TRANSACTION_PAYMENT_STATUS.REFUND]: t('admin.receiptVoidRefund.paymentStatus.refund'),
  [TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED]: t(
    'admin.receiptVoidRefund.paymentStatus.receiptVoided',
  ),
};

const receiptStatusLabels: Record<number, string> = {
  [ReceiptStatus.UNISSUED]: t('admin.receiptVoidRefund.receiptStatus.unissued'),
  [ReceiptStatus.ISSUED]: t('admin.receiptVoidRefund.receiptStatus.issued'),
  [ReceiptStatus.VOIDED]: t('admin.receiptVoidRefund.receiptStatus.voided'),
};

const columns = computed<QTableColumn[]>(() => {
  void locale.value;
  return [
  {
    name: 'index',
    field: 'index',
    label: t('admin.searchUser.table.index'),
    align: 'center',
  },
  {
    name: 'ref1',
    field: 'ref1',
    label: t('admin.searchUser.table.applicantId'),
    align: 'center',
  },
  {
    name: 'ref2',
    field: 'ref2',
    label: t('admin.searchUser.table.referenceNo'),
    align: 'center',
  },
  {
    name: 'name',
    field: 'name',
    label: t('admin.searchUser.table.fullName'),
    align: 'left',
  },
  {
    name: 'examName',
    field: 'examName',
    label: t('admin.searchUser.table.examName'),
    align: 'left',
  },
  {
    name: 'amount',
    field: 'amount',
    label: t('admin.searchUser.table.amount'),
    align: 'center',
  },
  {
    name: 'paymentStatus',
    field: 'paymentStatusLabel',
    label: t('admin.receiptVoidRefund.table.paymentStatus'),
    align: 'center',
  },
  {
    name: 'receiptStatus',
    field: 'receiptStatusLabel',
    label: t('admin.receiptVoidRefund.table.receiptStatus'),
    align: 'center',
  },
  {
    name: 'actions',
    field: 'actions',
    label: t('admin.receiptVoidRefund.table.actions'),
    align: 'center',
  },
];});
const getEnrollmentName = (
  enrollment: BackendTransactionRefEnrollment | null | undefined,
): string =>
  enrollment?.USER?.PROFILE?.userFullnameTh || enrollment?.USER?.PROFILE?.userFullnameEn || '-';

const getExamName = (enrollment: BackendTransactionRefEnrollment | null | undefined): string => {
  const exam = enrollment?.SESSION?.EXAM;
  if (!exam) return '-';
  return (
    formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
    exam.EXAM_NAME ||
    '-'
  );
};

const formatAmount = (amount: number | string | null | undefined): string => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : '-';
};

const getIssuedReceipt = (item: BackendTransactionRef) => {
  const receipts = item.TRANSACTION?.RECEIPTS ?? [];
  return receipts.find((receipt) => receipt.RC_STATUS === ReceiptStatus.ISSUED) ?? null;
};

const getPrimaryReceipt = (item: BackendTransactionRef) => {
  const receipts = item.TRANSACTION?.RECEIPTS ?? [];
  if (receipts.length === 0) return null;
  return (
    receipts.find((receipt) => receipt.RC_STATUS === ReceiptStatus.ISSUED) ??
    receipts.find((receipt) => receipt.RC_STATUS === ReceiptStatus.VOIDED) ??
    receipts[0] ??
    null
  );
};

const mapToRow = (item: BackendTransactionRef, index: number): VoidRefundRow => {
  const transaction = item.TRANSACTION;
  const enrollment = transaction?.ENROLLMENT;
  const paymentStatus = transaction?.TRANX_PAYMENT_STATUS ?? null;
  const issuedReceipt = getIssuedReceipt(item);
  const primaryReceipt = getPrimaryReceipt(item);
  const isTerminal =
    paymentStatus === TRANSACTION_PAYMENT_STATUS.REFUND ||
    paymentStatus === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED ||
    primaryReceipt?.RC_STATUS === ReceiptStatus.VOIDED;

  const canRefund =
    !isTerminal &&
    !issuedReceipt &&
    (paymentStatus === TRANSACTION_PAYMENT_STATUS.PAID ||
      paymentStatus === TRANSACTION_PAYMENT_STATUS.APPROVED);

  const canVoid = !isTerminal && !!issuedReceipt;

  return {
    id: item.TSR_ID,
    index,
    ref1: item.TSC_REF1 || '-',
    ref2: item.TSC_REF2 || '-',
    name: getEnrollmentName(enrollment),
    examName: getExamName(enrollment),
    amount: formatAmount(transaction?.TRANX_AMOUNT),
    paymentStatusLabel:
      paymentStatus !== null
        ? paymentStatusLabels[paymentStatus] || t('admin.receiptVoidRefund.paymentStatus.unknown')
        : '-',
    receiptStatusLabel: primaryReceipt
      ? receiptStatusLabels[primaryReceipt.RC_STATUS] ||
        t('admin.receiptVoidRefund.receiptStatus.unknown')
      : t('admin.receiptVoidRefund.receiptStatus.none'),
    tranxId: transaction?.TRANX_ID ?? item.TRANX_ID,
    receiptId: issuedReceipt?.RC_ID ?? null,
    canRefund,
    canVoid,
  };
};

const buildSearchParams = (): TransactionRefSearchParams => {
  const params: TransactionRefSearchParams = {
    page: pagination.value.page,
    limit: pagination.value.rowsPerPage,
  };
  const criteria = activeSearchCriteria.value;
  if (criteria.ref1) params.ref1 = criteria.ref1;
  if (criteria.ref2) params.ref2 = criteria.ref2;
  if (criteria.name) params.name = criteria.name;
  if (criteria.examName) params.examName = criteria.examName;
  return params;
};

const hasAnySearchCriteria = (criteria: SearchCriteria): boolean =>
  Boolean(criteria.ref1 || criteria.ref2 || criteria.name || criteria.examName);

const loadRows = async (): Promise<void> => {
  const criteria = activeSearchCriteria.value;
  if (!hasAnySearchCriteria(criteria)) {
    rows.value = [];
    pagination.value.rowsNumber = 0;
    return;
  }

  isLoading.value = true;
  try {
    const response = await searchTransactionRefs(buildSearchParams());
    const offset = (pagination.value.page - 1) * pagination.value.rowsPerPage;
    rows.value = response.data.map((item, idx) => mapToRow(item, offset + idx + 1));
    pagination.value.rowsNumber = response.total;
  } catch {
    rows.value = [];
    pagination.value.rowsNumber = 0;
    $q.notify({
      type: 'negative',
      message: t('admin.receiptVoidRefund.notifications.searchError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = async (): Promise<void> => {
  const criteria: SearchCriteria = {
    ref1: (searchForm.value.ref1 ?? '').trim(),
    ref2: (searchForm.value.ref2 ?? '').trim(),
    name: (searchForm.value.name ?? '').trim(),
    examName: (searchForm.value.examName ?? '').trim(),
  };

  activeSearchCriteria.value = criteria;
  pagination.value.page = 1;

  if (!hasAnySearchCriteria(criteria)) {
    rows.value = [];
    pagination.value.rowsNumber = 0;
    return;
  }

  await loadRows();
};

const debouncedSearch = debounce(() => {
  void handleSearch();
}, 400);

watch(
  searchForm,
  () => {
    debouncedSearch();
  },
  { deep: true },
);

const onRequest = async (requestProps: TableRequestProps): Promise<void> => {
  pagination.value.page = requestProps.pagination.page;
  pagination.value.rowsPerPage = requestProps.pagination.rowsPerPage;
  await loadRows();
};

const openRefundDialog = (row: VoidRefundRow): void => {
  selectedRow.value = row;
  showRefundConfirm.value = true;
};

const openVoidDialog = (row: VoidRefundRow): void => {
  selectedRow.value = row;
  voidReason.value = '';
  voidReasonError.value = false;
  showVoidDialog.value = true;
};

const confirmRefund = async (): Promise<void> => {
  if (!selectedRow.value) return;
  isActionLoading.value = true;
  try {
    await refundTransaction(selectedRow.value.tranxId);
    showRefundConfirm.value = false;
    $q.notify({
      type: 'positive',
      message: t('admin.receiptVoidRefund.notifications.refundSuccess'),
      position: 'top',
    });
    await loadRows();
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.receiptVoidRefund.notifications.refundError'),
      position: 'top',
    });
  } finally {
    isActionLoading.value = false;
    selectedRow.value = null;
  }
};

const confirmVoid = async (): Promise<void> => {
  if (!selectedRow.value?.receiptId) return;
  const reason = voidReason.value.trim();
  if (!reason) {
    voidReasonError.value = true;
    return;
  }
  voidReasonError.value = false;
  isActionLoading.value = true;
  try {
    await voidReceipt({
      RC_ID: selectedRow.value.receiptId,
      VR_REASON: reason,
    });
    showVoidDialog.value = false;
    $q.notify({
      type: 'positive',
      message: t('admin.receiptVoidRefund.notifications.voidSuccess'),
      position: 'top',
    });
    await loadRows();
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.receiptVoidRefund.notifications.voidError'),
      position: 'top',
    });
  } finally {
    isActionLoading.value = false;
    selectedRow.value = null;
  }
};
</script>

<style scoped lang="scss">
.receipt-void-refund-page {
  .search-card {
    border-radius: 12px;
  }

  .void-dialog-card {
    width: 520px;
    max-width: 90vw;
    border-radius: 16px;
  }

  :deep(.action-status-btn) {
    min-width: 140px;
  }
}
</style>
