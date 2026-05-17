<template>
  <q-page class="q-pa-md">
    <!-- Breadcrumbs -->
    <app-breadcrumbs />

    <!-- Page Header -->
    <app-page-header :title="t('admin.finCheckTranscript.pageTitle')" />

    <!-- Search and Filters Area -->
    <div class="row q-mb-md items-center justify-between">
      <div class="col-12 col-sm-5">
        <search-bar
          v-model="searchQuery"
          :placeholder="t('admin.finCheckTranscript.searchPlaceholder')"
          class="full-width"
        />
      </div>
      <div class="col-auto">
        <search-user />
      </div>
    </div>

    <!-- Table Card -->
    <q-card flat bordered class="q-mt-sm">
      <q-card-section class="q-pa-none">
        <base-table :rows="filteredRows" :columns="columns" :loading="isLoading" row-key="id">
          <!-- Custom Header matching the design in the image -->
          <template #header="props">
            <q-tr :props="props">
              <q-th rowspan="2">{{ t('admin.paymentImport.table.index') }}</q-th>
              <q-th colspan="6">{{ t('admin.finCheckTranscript.titleFile') }}</q-th>
              <q-th colspan="4">{{ t('admin.finCheckTranscript.titleDb') }}</q-th>
              <q-th rowspan="2">{{ t('admin.examManagement.table.columns.tools') }}</q-th>
            </q-tr>
            <q-tr :props="props">
              <q-th>{{ t('admin.paymentImport.table.paymentDate') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.paymentTime') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.applicantId') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.referenceNo') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.payerName') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.amount') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.applicantId') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.referenceNo') }}</q-th>
              <q-th>{{ t('admin.registrantManagement.table.columns.fullName') }}</q-th>
              <q-th>{{ t('admin.paymentImport.table.amount') }}</q-th>
            </q-tr>
          </template>

          <!-- Custom Body Rows to match custom colspan layout -->
          <template #body="props">
            <q-tr :props="props">
              <!-- Index -->
              <q-td class="text-center">{{ props.row.id }}</q-td>

              <!-- Payment File Columns -->
              <q-td class="text-center">{{ props.row.file_payment_date }}</q-td>
              <q-td class="text-center">{{ props.row.file_payment_time }}</q-td>
              <q-td class="text-center">{{ props.row.file_ref }}</q-td>
              <q-td class="text-center">{{ props.row.file_ref2 }}</q-td>
              <q-td>{{ props.row.file_payer }}</q-td>
              <q-td class="text-center">{{ props.row.file_amount }}</q-td>

              <!-- Database Columns -->
              <template v-if="props.row.db_ref">
                <q-td class="text-center">{{ props.row.db_ref }}</q-td>
                <q-td class="text-center">{{ props.row.db_ref2 }}</q-td>
                <q-td>{{ props.row.db_name }}</q-td>
                <q-td class="text-center">{{ props.row.db_amount }}</q-td>
              </template>
              <template v-else>
                <q-td class="text-center">-</q-td>
                <q-td class="text-center">-</q-td>
                <q-td class="text-center text-grey-5">{{
                  t('admin.finCheckTranscript.noData')
                }}</q-td>
                <q-td class="text-center text-grey-5">-</q-td>
              </template>

              <!-- Actions Column -->
              <q-td class="text-center">
                <div class="row justify-center">
                  <action-button
                    icon="edit"
                    @click="handleEdit(props.row)"
                    v-if="!props.row.db_ref"
                    :tooltip="t('admin.finCheckTranscript.editTooltip')"
                  />
                  <span v-else class="text-grey-6">-</span>
                </div>
              </q-td>
            </q-tr>
          </template>
        </base-table>
      </q-card-section>
    </q-card>

    <!-- Action Bar below Table -->
    <div class="row justify-center q-mt-md">
      <div class="col-12 col-sm-4">
        <fin-save-transcription :disabled="hasUnresolvedRows" :rows="transcriptRows" />
      </div>
    </div>

    <!-- Edit Dialog -->
    <q-dialog v-model="isDialogOpened" persistent>
      <q-card class="edit-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-lg">
          <div class="text-h6 text-weight-bold dialog-title">
            {{ t('admin.finCheckTranscript.dialogTitle') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6" />
        </div>

        <!-- Info fields -->
        <div class="q-gutter-y-md dialog-fields">
          <div class="row items-center field-row">
            <div class="col-5 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.payerName') }}
            </div>
            <div class="col-7 text-weight-bold field-value">{{ selectedRow?.file_payer }}</div>
          </div>

          <div class="row items-center field-row">
            <div class="col-5 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.paymentDate') }}
            </div>
            <div class="col-7 field-value">{{ selectedRow?.file_payment_date }}</div>
          </div>

          <div class="row items-center field-row">
            <div class="col-5 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.paymentTime') }}
            </div>
            <div class="col-7 field-value">{{ selectedRow?.file_payment_time }}</div>
          </div>

          <div class="row items-center field-row">
            <div class="col-5 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.amount') }}
            </div>
            <div class="col-7 field-value">{{ selectedRow?.file_amount }}</div>
          </div>

          <!-- Ref 1 Input -->
          <div class="row items-center field-row">
            <div class="col-5 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.applicantId') }}
            </div>
            <div class="col-7">
              <q-input
                v-model="editForm.ref1"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.finCheckTranscript.dialogPlaceholderRef1')"
              />
            </div>
          </div>

          <!-- Ref 2 Input -->
          <div class="row items-center field-row">
            <div class="col-5 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.referenceNo') }}
            </div>
            <div class="col-7">
              <q-input
                v-model="editForm.ref2"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.finCheckTranscript.dialogPlaceholderRef2')"
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row justify-center q-gutter-x-md q-mt-xl">
          <q-btn
            :label="t('profile.cancel')"
            unelevated
            v-close-popup
            class="btn-dialog-cancel font-weight-bold"
          />
          <q-btn
            :label="t('profile.save')"
            unelevated
            @click="handleSave"
            class="btn-dialog-save font-weight-bold"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import SearchUser from 'src/components/shared/search-user.vue';
import FinSaveTranscription from 'src/components/shared/fin-save-transcription.vue';
import { globalImportedRows } from 'src/composables/use-payment-import';
import { fetchAllEnrollments } from 'src/services/enrollment.service';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import type { PaymentRow } from 'src/types/exam.types';

const { t } = useI18n();

const searchQuery = ref('');

const transcriptRows = ref<PaymentRow[]>([]);
const isLoading = ref(false);
const allEnrollments = ref<BackendEnrollmentDetail[]>([]);

const loadData = async () => {
  isLoading.value = true;
  try {
    allEnrollments.value = await fetchAllEnrollments();

    transcriptRows.value = globalImportedRows.value.map((imported) => {
      const matched = allEnrollments.value.find(
        (e) =>
          e.USER?.USER_NATIONAL_ID === imported.applicantId ||
          String(e.ERM_ID) === imported.applicantId ||
          String(e.ERM_ID) === imported.referenceNo,
      );

      return {
        id: imported.index,
        file_payment_date: imported.paymentDate,
        file_payment_time: imported.paymentTime,
        file_ref: imported.applicantId,
        file_ref2: imported.referenceNo,
        file_payer: imported.payerName,
        file_amount: imported.amount,
        db_ref: matched ? matched.USER?.USER_NATIONAL_ID || String(matched.ERM_ID) : '',
        db_ref2: matched ? String(matched.ERM_ID) : '',
        db_name: matched ? matched.USER?.PROFILE?.userFullnameTh || '-' : '',
        db_amount: matched?.SESSION?.EXAM?.EXAM_FEE ? String(matched.SESSION.EXAM.EXAM_FEE) : '',
      };
    });
  } catch (err) {
    console.error('Failed to load data:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  void loadData();
});

// Filtered rows based on the search query
const filteredRows = computed(() => {
  if (!searchQuery.value) return transcriptRows.value;
  const query = searchQuery.value.trim().toLowerCase();
  return transcriptRows.value.filter((row) => {
    return (
      row.file_payer.toLowerCase().includes(query) ||
      row.file_ref.includes(query) ||
      row.file_ref2.includes(query) ||
      row.db_name.toLowerCase().includes(query) ||
      row.db_ref.includes(query) ||
      row.db_ref2.includes(query)
    );
  });
});

const hasUnresolvedRows = computed(() => {
  return transcriptRows.value.length === 0 || transcriptRows.value.some((row) => !row.db_ref);
});

const columns = computed<QTableColumn[]>(() => [
  { name: 'id', field: 'id', label: t('admin.paymentImport.table.index'), align: 'center' },
  {
    name: 'file_payment_date',
    field: 'file_payment_date',
    label: t('admin.paymentImport.table.paymentDate'),
    align: 'center',
  },
  {
    name: 'file_payment_time',
    field: 'file_payment_time',
    label: t('admin.paymentImport.table.paymentTime'),
    align: 'center',
  },
  {
    name: 'file_ref',
    field: 'file_ref',
    label: t('admin.paymentImport.table.applicantId'),
    align: 'center',
  },
  {
    name: 'file_ref2',
    field: 'file_ref2',
    label: t('admin.paymentImport.table.referenceNo'),
    align: 'center',
  },
  {
    name: 'file_payer',
    field: 'file_payer',
    label: t('admin.paymentImport.table.payerName'),
    align: 'left',
  },
  {
    name: 'file_amount',
    field: 'file_amount',
    label: t('admin.paymentImport.table.amount'),
    align: 'center',
  },
  {
    name: 'db_ref',
    field: 'db_ref',
    label: t('admin.paymentImport.table.applicantId'),
    align: 'center',
  },
  {
    name: 'db_ref2',
    field: 'db_ref2',
    label: t('admin.paymentImport.table.referenceNo'),
    align: 'center',
  },
  {
    name: 'db_name',
    field: 'db_name',
    label: t('admin.registrantManagement.table.columns.fullName'),
    align: 'left',
  },
  {
    name: 'db_amount',
    field: 'db_amount',
    label: t('admin.paymentImport.table.amount'),
    align: 'center',
  },
  {
    name: 'actions',
    field: 'actions',
    label: t('admin.examManagement.table.columns.tools'),
    align: 'center',
  },
]);

const isDialogOpened = ref(false);
const selectedRow = ref<PaymentRow | null>(null);
const editForm = ref({
  ref1: '',
  ref2: '',
});

const handleEdit = (row: PaymentRow) => {
  selectedRow.value = row;
  editForm.value.ref1 = row.file_ref || '';
  editForm.value.ref2 = row.file_ref2 || '';
  isDialogOpened.value = true;
};

const handleSave = () => {
  if (selectedRow.value) {
    const row = transcriptRows.value.find((r) => r.id === selectedRow.value?.id);
    if (row) {
      row.file_ref = editForm.value.ref1;
      row.file_ref2 = editForm.value.ref2;

      // Re-match against the modified refs
      const matched = allEnrollments.value.find(
        (e) =>
          e.USER?.USER_NATIONAL_ID === row.file_ref ||
          String(e.ERM_ID) === row.file_ref ||
          String(e.ERM_ID) === row.file_ref2,
      );

      row.db_ref = matched ? matched.USER?.USER_NATIONAL_ID || String(matched.ERM_ID) : '';
      row.db_ref2 = matched ? String(matched.ERM_ID) : '';
      row.db_name = matched ? matched.USER?.PROFILE?.userFullnameTh || '-' : '';
      row.db_amount = matched?.SESSION?.EXAM?.EXAM_FEE ? String(matched.SESSION.EXAM.EXAM_FEE) : '';
    }
  }
  isDialogOpened.value = false;
};
</script>

<style scoped lang="scss">
.edit-dialog-card {
  width: 600px;
  max-width: 95vw;
  border-radius: var(--radius-lg);
  padding: 32px 40px;
  box-shadow: var(--shadow-lg);
}

.dialog-title {
  color: var(--text-primary);
  font-size: 1.25rem;
}

.dialog-fields {
  font-size: 0.95rem;
}

.field-row {
  margin-bottom: 16px;
}

.field-label {
  color: var(--text-primary);
  font-weight: 500;
}

.field-value {
  color: var(--text-primary);
}

.input-rounded {
  :deep(.q-field__control) {
    border-radius: var(--radius-10) !important;
    background-color: #fff;
    border: 1px solid var(--neutral-200) !important;

    &:before {
      border: none !important;
    }

    &:after {
      border: none !important;
    }
  }
}

.btn-dialog-cancel {
  background-color: var(--neutral-200) !important;
  color: var(--neutral-600) !important;
  width: 140px;
  height: 44px;
  border-radius: var(--radius-sm);
  text-transform: none;
}

.btn-dialog-save {
  background-color: var(--primary) !important;
  color: white !important;
  width: 140px;
  height: 44px;
  border-radius: var(--radius-sm);
  text-transform: none;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}
</style>
