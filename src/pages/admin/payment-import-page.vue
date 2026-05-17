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
        <!-- Department Label -->
        <div class="text-weight-medium text-dark q-mt-xs q-ml-xs department-label">
          {{ $t('admin.paymentImport.departmentLabel') }}
          {{ departmentLabel }}
        </div>

        <q-card-section class="q-pt-none">
          <!-- File Upload Zone -->
          <AppFileUploadZone
            ref="uploadZoneRef"
            :label="$t('admin.paymentImport.uploadLabel')"
            hint=""
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
            :label="$t('admin.paymentImport.clearAll')"
            color="negative"
            class="action-btn"
            @click="handleClearAll"
          />
          <AppButton
            :label="$t('admin.paymentImport.verifyData')"
            color="primary"
            class="action-btn"
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

      <!-- Custom Confirmation Dialog for Clear All -->
      <AppConfirmDialog v-model="showClearConfirm" @confirm="confirmClearAll" />
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
import AppConfirmDialog from 'src/components/shared/app-confirm-dialog.vue';
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

const showClearConfirm = ref(false);

const handleClearAll = (): void => {
  showClearConfirm.value = true;
};

const confirmClearAll = (): void => {
  showClearConfirm.value = false;
  clearAllData();
  uploadZoneRef.value?.reset();
  $q.notify({
    type: 'positive',
    message: i18n.t('admin.paymentImport.notifications.clearSuccess'),
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
.payment-import-page {
  background-color: #fafbfc;
  min-height: 100vh;
}

.upload-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #eef2f6;
  box-shadow: 0px 4px 4px 0px #00000040 !important;
  padding: 8px;
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

:deep(.upload-zone) {
  max-width: 420px;
  width: 100%;
  margin: 16px auto !important;
  border-radius: 16px !important;
  background-color: #ffffff !important;
  min-height: 130px !important; /* Sleek height matching mockup */
  box-shadow: none !important;
  transition: all 0.25s ease !important;

  /* Standard state: bright blue dashed border with wide gaps (inset SVG to prevent clipping) */
  border: none !important;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 420 130' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M 1.5 16.5 A 15 15 0 0 1 16.5 1.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-linecap='round'/%3e%3cpath d='M 403.5 1.5 A 15 15 0 0 1 418.5 16.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-linecap='round'/%3e%3cpath d='M 418.5 113.5 A 15 15 0 0 1 403.5 128.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-linecap='round'/%3e%3cpath d='M 16.5 128.5 A 15 15 0 0 1 1.5 113.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-linecap='round'/%3e%3cpath d='M 16.5 1.5 L 403.5 1.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-dasharray='12%2c 24' stroke-linecap='square'/%3e%3cpath d='M 418.5 16.5 L 418.5 113.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-dasharray='12%2c 24' stroke-linecap='square'/%3e%3cpath d='M 403.5 128.5 L 16.5 128.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-dasharray='12%2c 24' stroke-linecap='square'/%3e%3cpath d='M 1.5 113.5 L 1.5 16.5' fill='none' stroke='%231e89e5' stroke-width='1.5' stroke-dasharray='12%2c 24' stroke-linecap='square'/%3e%3c/svg%3e") !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: 100% 100% !important;

  .q-icon {
    font-size: 56px !important;
    color: var(--primary-light, #1e89e5) !important;
    transition: color 0.25s ease !important;
  }

  .text-weight-medium {
    font-size: 15px !important;
    margin-top: 12px !important;
    color: #000000 !important;
    font-weight: 500 !important;
    transition: color 0.25s ease !important;
  }

  /* Hover/Hold state: solid bright blue background with white icon and white text */
  &:hover:not(.upload-zone--has-file),
  &.upload-zone--dragover {
    background-image: none !important;
    background-color: var(--primary-light, #1e89e5) !important;
    border-color: var(--primary-light, #1e89e5) !important;

    .q-icon {
      color: #ffffff !important;
    }

    .text-weight-medium {
      color: #ffffff !important;
    }
  }
}

.payment-import-table {
  :deep(.q-table__container) {
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }
}
</style>
