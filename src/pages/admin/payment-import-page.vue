<template>
  <q-page class="payment-import-page q-px-lg q-px-sm-xl q-py-lg">
    <div class="full-width">
      <!-- Breadcrumbs -->
      <AppBreadcrumbs />

      <!-- Page Header -->
      <AppPageHeader
        :title="$t('admin.paymentImport.pageTitle')"
        :subtitle="$t('admin.paymentImport.pageSubtitle')"
      />

      <!-- Upload Card -->
      <q-card flat bordered class="upload-card q-mb-lg">
        <q-card-section>
          <!-- Department Label -->
          <div class="text-weight-medium text-dark q-mb-md department-label">
            {{ $t('admin.paymentImport.departmentLabel') }}
            {{ departmentLabel }}
          </div>

          <!-- File Upload Zone -->
          <AppFileUploadZone
            ref="uploadZoneRef"
            :label="$t('admin.paymentImport.uploadLabel')"
            :hint="$t('admin.paymentImport.uploadHint')"
            accept=".csv,.xlsx,.xls"
            @file-selected="onFileSelected"
            @file-removed="onFileRemoved"
            @error="onUploadError"
          />
        </q-card-section>
      </q-card>

      <!-- Toolbar: Search + Action Buttons -->
      <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
        <SearchBar v-model="searchQuery" class="col-12 col-sm-auto" />

        <q-space class="gt-xs" />

        <div class="row q-gutter-sm col-12 col-sm-auto justify-end">
          <AppButton
            icon="delete_sweep"
            :label="$t('admin.paymentImport.clearAll')"
            color="negative"
            class="action-btn"
            :disable="totalCount === 0"
            @click="handleClearAll"
          />
          <AppButton
            icon="fact_check"
            :label="$t('admin.paymentImport.verifyData')"
            color="primary"
            class="action-btn"
            :disable="totalCount === 0"
            @click="handleVerify"
          />
        </div>
      </nav>

      <!-- Table -->
      <main>
        <BaseTable
          :columns="columns"
          :rows="filteredRows"
          :loading="isLoading"
          :pagination="pagination"
          :empty-label="$t('admin.paymentImport.emptyTable')"
          class="payment-import-table"
          @request="onRequest"
        >
          <template v-slot:body-cell-index="{ row }">
            <div class="text-center">{{ row.index }}</div>
          </template>

          <template v-slot:body-cell-applicantId="{ row }">
            <div class="text-center">{{ row.applicantId }}</div>
          </template>

          <template v-slot:body-cell-referenceNo="{ row }">
            <div class="text-center">{{ row.referenceNo }}</div>
          </template>

          <template v-slot:body-cell-payerName="{ row }">
            <div class="text-center">{{ row.payerName }}</div>
          </template>

          <template v-slot:body-cell-paymentDate="{ row }">
            <div class="text-center">{{ row.paymentDate }}</div>
          </template>

          <template v-slot:body-cell-paymentTime="{ row }">
            <div class="text-center">{{ row.paymentTime }}</div>
          </template>

          <template v-slot:body-cell-amount="{ row }">
            <div class="text-center text-weight-medium">{{ row.amount }}</div>
          </template>

          <template v-slot:body-cell-importedAt="{ row }">
            <div class="text-center">{{ row.importedAt }}</div>
          </template>

          <template v-slot:body-cell-importedBy="{ row }">
            <div class="text-center">{{ row.importedBy }}</div>
          </template>
        </BaseTable>
      </main>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';

import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppFileUploadZone from 'src/components/shared/app-file-upload-zone.vue';
import { usePaymentImport } from 'src/composables/use-payment-import';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

const i18n = useI18n();
const $q = useQuasar();

const uploadZoneRef = ref<InstanceType<typeof AppFileUploadZone> | null>(null);

const {
  filteredRows,
  isLoading,
  searchQuery,
  departmentLabel,
  totalCount,
  parseFile,
  clearAllData,
  verifyData,
} = usePaymentImport();

// ── Event Handlers ────────────────────────────────────────
const onFileSelected = (file: File): void => {
  void parseFile(file);
};

const onFileRemoved = (): void => {
  clearAllData();
};

const onUploadError = (message: string): void => {
  $q.notify({ type: 'negative', message });
};

const handleClearAll = (): void => {
  $q.dialog({
    title: i18n.t('admin.paymentImport.confirmClearTitle'),
    message: i18n.t('admin.paymentImport.confirmClearMessage'),
    cancel: { flat: true, label: i18n.t('admin.paymentImport.cancel') },
    ok: { color: 'negative', label: i18n.t('admin.paymentImport.confirmClear') },
    persistent: true,
  }).onOk(() => {
    clearAllData();
    uploadZoneRef.value?.reset();
    $q.notify({
      type: 'positive',
      message: i18n.t('admin.paymentImport.notifications.clearSuccess'),
    });
  });
};

const handleVerify = (): void => {
  verifyData();
  $q.notify({
    type: 'positive',
    message: i18n.t('admin.paymentImport.notifications.verifySuccess'),
  });
};

// ── Pagination ────────────────────────────────────────────
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

watch(filteredRows, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

// ── Table Columns ─────────────────────────────────────────
const columns: QTableColumn[] = [
  {
    name: 'index',
    label: i18n.t('admin.paymentImport.table.index'),
    field: 'index',
    align: 'center',
    style: 'width: 70px',
  },
  {
    name: 'applicantId',
    label: i18n.t('admin.paymentImport.table.applicantId'),
    field: 'applicantId',
    align: 'center',
  },
  {
    name: 'referenceNo',
    label: i18n.t('admin.paymentImport.table.referenceNo'),
    field: 'referenceNo',
    align: 'center',
  },
  {
    name: 'payerName',
    label: i18n.t('admin.paymentImport.table.payerName'),
    field: 'payerName',
    align: 'center',
  },
  {
    name: 'paymentDate',
    label: i18n.t('admin.paymentImport.table.paymentDate'),
    field: 'paymentDate',
    align: 'center',
  },
  {
    name: 'paymentTime',
    label: i18n.t('admin.paymentImport.table.paymentTime'),
    field: 'paymentTime',
    align: 'center',
  },
  {
    name: 'amount',
    label: i18n.t('admin.paymentImport.table.amount'),
    field: 'amount',
    align: 'center',
  },
  {
    name: 'importedAt',
    label: i18n.t('admin.paymentImport.table.importedAt'),
    field: 'importedAt',
    align: 'center',
  },
  {
    name: 'importedBy',
    label: i18n.t('admin.paymentImport.table.importedBy'),
    field: 'importedBy',
    align: 'center',
  },
];
</script>

<style scoped lang="scss">
.upload-card {
  border-radius: var(--radius-md, 12px);
  border-color: var(--border-color, #e0e0e0);
}

.department-label {
  font-size: 14px;
}

.action-btn {
  height: 40px;
  min-width: 160px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

.payment-import-table {
  :deep(.q-table__container) {
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }
}
</style>
