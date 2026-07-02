<template>
  <div>
    <!-- Button Trigger -->
    <q-btn
      :label="t('admin.searchUser.triggerLabel')"
      unelevated
      class="btn-search-trigger"
      @click="openDialog"
    />

    <!-- Dialog -->
    <q-dialog v-model="isDialogOpen" persistent>
      <q-card class="search-user-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-lg header-row">
          <div class="dialog-title">
            {{ t('admin.searchUser.dialogTitle') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="close-btn" />
        </div>

        <!-- Filter Fields -->
        <div class="dialog-fields">
          <!-- Ref 1 -->
          <div class="row items-center field-row">
            <div class="col-4 text-left field-label">
              {{ t('admin.searchUser.table.applicantId') }}
            </div>
            <div class="col-8">
              <q-input
                v-model="searchForm.ref1"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.searchUser.placeholderRef1')"
                @keyup.enter="handleSearch"
                :error="errors.ref1"
                :error-message="t('profile.required')"
                no-error-icon
                hide-bottom-space
                @update:model-value="errors.ref1 = false"
              />
            </div>
          </div>

          <!-- Ref 2 -->
          <div class="row items-center field-row">
            <div class="col-4 text-left field-label">
              {{ t('admin.searchUser.table.referenceNo') }}
            </div>
            <div class="col-8">
              <q-input
                v-model="searchForm.ref2"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.searchUser.placeholderRef2')"
                @keyup.enter="handleSearch"
                :error="errors.ref2"
                :error-message="t('profile.required')"
                no-error-icon
                hide-bottom-space
                @update:model-value="errors.ref2 = false"
              />
            </div>
          </div>

          <!-- Applicant Name -->
          <div class="row items-center field-row">
            <div class="col-4 text-left field-label">
              {{ t('admin.searchUser.table.fullName') }}
            </div>
            <div class="col-8">
              <q-input
                v-model="searchForm.name"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.searchUser.placeholderName')"
                @keyup.enter="handleSearch"
                :error="errors.name"
                :error-message="t('profile.required')"
                no-error-icon
                hide-bottom-space
                @update:model-value="errors.name = false"
              />
            </div>
          </div>
        </div>

        <!-- Search Action Button -->
        <div class="row justify-end button-row">
          <div class="col-8 row justify-end">
            <q-btn
              :label="t('admin.searchUser.searchBtn')"
              unelevated
              class="btn-dialog-search text-weight-bold"
              @click="handleSearch"
              :loading="isLoading"
            />
          </div>
        </div>

        <!-- Table Area -->
        <SearchUserTable
          :rows="rows"
          :loading="isLoading"
          :pagination="pagination"
          @request="handleTableRequest"
        />
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import SearchUserTable from './search-user-table.vue';
import {
  searchTransactionRefs,
  type BackendTransactionRef,
  type BackendTransactionRefEnrollment,
  type TransactionRefSearchParams,
} from 'src/services/transaction-ref.service';
import { PAYMENT_STATUS_LABELS } from 'src/types/enrollment.types';
import type { PaginationModel, SearchRow, TableRequestProps } from 'src/types/exam.types';

const { t } = useI18n();
const $q = useQuasar();

const isDialogOpen = ref(false);
const isLoading = ref(false);
const rows = ref<SearchRow[]>([]);
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

interface SearchCriteria {
  ref1: string;
  ref2: string;
  name: string;
}

const createEmptySearchCriteria = (): SearchCriteria => ({
  ref1: '',
  ref2: '',
  name: '',
});

const searchForm = ref({
  ref1: '',
  ref2: '',
  name: '',
});
const activeSearchCriteria = ref<SearchCriteria>(createEmptySearchCriteria());

const errors = ref({
  ref1: false,
  ref2: false,
  name: false,
});

const normalizeSearchValue = (value: string | number | null | undefined): string =>
  String(value ?? '').trim();

const getEnrollmentName = (
  enrollment: BackendTransactionRefEnrollment | null | undefined,
): string => {
  if (!enrollment) return '-';
  return (
    enrollment.USER?.PROFILE?.userFullnameTh || enrollment.USER?.PROFILE?.userFullnameEn || '-'
  );
};

const getExamName = (enrollment: BackendTransactionRefEnrollment | null | undefined): string => {
  if (!enrollment) return '-';
  const exam = enrollment.SESSION?.EXAM;
  if (!exam) return '-';
  return exam.EXAM_ROUND ? `${exam.EXAM_NAME} ${exam.EXAM_ROUND}` : exam.EXAM_NAME || '-';
};

const formatAmount = (amount: number | string | null | undefined): string => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : '500.00';
};

const getPaymentStatusLabel = (
  enrollmentStatus: number | undefined,
  transactionPaymentStatus: number | null | undefined,
): string => {
  if (enrollmentStatus !== undefined) {
    return PAYMENT_STATUS_LABELS[enrollmentStatus] || 'ไม่ระบุ';
  }
  if (transactionPaymentStatus === 3) return 'ชำระเงินแล้ว';
  if (transactionPaymentStatus === 0) return 'ค้างชำระ';
  return 'ไม่ระบุ';
};

const resetPagination = (): void => {
  pagination.value = {
    page: 1,
    rowsPerPage: 10,
    rowsNumber: 0,
  };
};

const openDialog = () => {
  isDialogOpen.value = true;
  // Reset form, rows, and errors on open
  searchForm.value = createEmptySearchCriteria();
  activeSearchCriteria.value = createEmptySearchCriteria();
  rows.value = [];
  resetPagination();
  errors.value = { ref1: false, ref2: false, name: false };
};

const getTrimmedSearchCriteria = (): SearchCriteria => ({
  ref1: searchForm.value.ref1.trim(),
  ref2: searchForm.value.ref2.trim(),
  name: searchForm.value.name.trim(),
});

const hasSearchCriteria = (criteria: SearchCriteria): boolean =>
  Boolean(criteria.ref1 || criteria.ref2 || criteria.name);

const buildSearchParams = (): TransactionRefSearchParams => {
  const params: TransactionRefSearchParams = {
    page: pagination.value.page,
    limit: pagination.value.rowsPerPage,
  };
  const criteria = activeSearchCriteria.value;

  if (criteria.ref1) params.ref1 = criteria.ref1;
  if (criteria.ref2) params.ref2 = criteria.ref2;
  if (criteria.name) params.name = criteria.name;

  return params;
};

const mapTransactionRefToRow = (
  transactionRef: BackendTransactionRef,
  index: number,
): SearchRow => {
  const transaction = transactionRef.TRANSACTION;
  const enrollment = transaction?.ENROLLMENT;

  return {
    id: (pagination.value.page - 1) * pagination.value.rowsPerPage + index + 1,
    ref1: normalizeSearchValue(transactionRef.TSC_REF1) || '-',
    ref2: normalizeSearchValue(transactionRef.TSC_REF2) || '-',
    name: getEnrollmentName(enrollment),
    amount: formatAmount(transaction?.TRANX_AMOUNT ?? enrollment?.SESSION?.EXAM?.EXAM_FEE),
    exam_name: getExamName(enrollment),
    payment_status: getPaymentStatusLabel(
      enrollment?.ERM_STATUS,
      transaction?.TRANX_PAYMENT_STATUS,
    ),
  };
};

const loadSearchResults = async (showNotFoundDialog: boolean): Promise<void> => {
  isLoading.value = true;
  try {
    const response = await searchTransactionRefs(buildSearchParams());
    pagination.value.rowsNumber = response.total;
    rows.value = response.data.map(mapTransactionRefToRow);

    if (response.total === 0 && showNotFoundDialog) {
      $q.dialog({
        title: t('admin.searchUser.dialogTitle'),
        message: t('admin.searchUser.validation.notFound'),
        persistent: true,
        ok: {
          label: t('profile.dialogClose') || 'ตกลง',
          color: 'primary',
          unelevated: true,
        },
      });
    }
  } catch (err) {
    console.error('Failed to search users:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = async (): Promise<void> => {
  // Reset errors
  errors.value = { ref1: false, ref2: false, name: false };
  const criteria = getTrimmedSearchCriteria();

  if (!hasSearchCriteria(criteria)) {
    errors.value = {
      ref1: true,
      ref2: true,
      name: true,
    };
    return;
  }

  activeSearchCriteria.value = criteria;
  pagination.value.page = 1;
  pagination.value.rowsNumber = 0;
  await loadSearchResults(true);
};

const handleTableRequest = (requestProps: TableRequestProps): void => {
  pagination.value.page = requestProps.pagination.page;
  pagination.value.rowsPerPage = requestProps.pagination.rowsPerPage;

  if (!hasSearchCriteria(activeSearchCriteria.value)) return;

  void loadSearchResults(false);
};
</script>

<style scoped lang="scss">
.btn-search-trigger {
  background-color: var(--primary) !important;
  color: white !important;
  border-radius: var(--radius-sm);
  height: 40px;
  padding: 0 20px;
  text-transform: none;
  font-size: 0.95rem;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}

.search-user-dialog-card {
  width: 960px;
  max-width: 95vw;
  border-radius: 20px;
  padding: 40px 48px;
  box-shadow: var(--shadow-lg);
  overflow-x: hidden;
  background-color: var(--surface-card);
}

.header-row {
  margin-bottom: 24px;
}

.dialog-title {
  color: var(--label-color);
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  color: var(--neutral-400);
  font-size: 1.25rem;
}

.dialog-fields {
  font-size: 0.95rem;
}

.field-row {
  margin-bottom: 20px;
}

.field-label {
  color: var(--label-color);
  font-size: 16px;
  font-weight: 500;
}

.input-rounded {
  :deep(.q-field__control) {
    border-radius: 16px !important;
    background-color: var(--surface-card);
    border: 1px solid var(--neutral-200) !important;
    height: 48px;
    min-height: 48px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:before {
      border: none !important;
    }

    &:after {
      border: none !important;
    }

    &:hover {
      border-color: var(--primary) !important;
    }
  }

  &.q-field--error {
    :deep(.q-field__control) {
      border-color: var(--negative) !important;

      &:hover {
        border-color: var(--negative) !important;
      }
    }
  }

  :deep(.q-field__control-container) {
    padding-top: 0 !important;
  }

  :deep(.q-field__native) {
    padding: 0 16px;
    font-size: 15px;
    align-items: center;
  }
}

.button-row {
  margin-top: 0;
  margin-bottom: 20px;
}

.btn-dialog-search {
  background-color: var(--primary) !important;
  color: white !important;
  width: 200px;
  height: 52px;
  border-radius: 8px !important;
  text-transform: none;
  font-size: 18px;
  font-weight: 600;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}
</style>
