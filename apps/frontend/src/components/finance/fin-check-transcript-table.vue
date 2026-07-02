<template>
  <div>
    <base-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @request="onRequest"
    >
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
          <q-th class="th-narrow">{{ t('admin.paymentImport.table.applicantId') }}</q-th>
          <q-th class="th-narrow">{{ t('admin.paymentImport.table.referenceNo') }}</q-th>
          <q-th>{{ t('admin.paymentImport.table.payerName') }}</q-th>
          <q-th>{{ t('admin.paymentImport.table.amount') }}</q-th>
          <q-th class="th-narrow">{{ t('admin.finCheckTranscript.ref1') }}</q-th>
          <q-th class="th-narrow">{{ t('admin.finCheckTranscript.ref2') }}</q-th>
          <q-th>{{ t('admin.finCheckTranscript.applicantName') }}</q-th>
          <q-th>{{ t('admin.finCheckTranscript.amount') }}</q-th>
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
          <q-td class="text-center td-narrow">{{ props.row.file_ref }}</q-td>
          <q-td class="text-center td-narrow">{{ props.row.file_ref2 }}</q-td>
          <q-td>{{ props.row.file_payer }}</q-td>
          <q-td class="text-center">{{ props.row.file_amount }}</q-td>

          <!-- Database Columns -->
          <template v-if="props.row.db_ref">
            <q-td class="text-center td-narrow">{{ props.row.db_ref }}</q-td>
            <q-td class="text-center td-narrow">{{ props.row.db_ref2 }}</q-td>
            <q-td>{{ props.row.db_applicant_name }}</q-td>
            <q-td class="text-center">{{ props.row.db_amount }}</q-td>
          </template>
          <template v-else>
            <q-td class="text-center text-grey-5">-</q-td>
            <q-td class="text-center text-grey-5">-</q-td>
            <q-td class="text-center text-grey-5">-</q-td>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import BaseTable from '../shared/base-table.vue';
import ActionButton from '../shared/action-button.vue';
import type { PaymentRow } from 'src/types/exam.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface Props {
  rows: PaymentRow[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<{
  (e: 'save-row', payload: { rowId: number; ref1: string; ref2: string }): void;
}>();

const { t } = useI18n();

const isDialogOpened = ref(false);
const selectedRow = ref<PaymentRow | null>(null);
const editForm = ref({
  ref1: '',
  ref2: '',
});

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const onRequest = (requestProps: TableRequestProps): void => {
  const { page, rowsPerPage } = requestProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

watch(
  () => props.rows.length,
  (rowsNumber) => {
    pagination.value.rowsNumber = rowsNumber;
    const lastPage = Math.max(1, Math.ceil(rowsNumber / pagination.value.rowsPerPage));
    if (pagination.value.page > lastPage) {
      pagination.value.page = lastPage;
    }
  },
  { immediate: true },
);

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
    label: t('admin.finCheckTranscript.ref1'),
    align: 'center',
  },
  {
    name: 'db_ref2',
    field: 'db_ref2',
    label: t('admin.finCheckTranscript.ref2'),
    align: 'center',
  },
  {
    name: 'db_applicant_name',
    field: 'db_applicant_name',
    label: t('admin.finCheckTranscript.applicantName'),
    align: 'left',
  },
  {
    name: 'db_amount',
    field: 'db_amount',
    label: t('admin.finCheckTranscript.amount'),
    align: 'center',
  },
  {
    name: 'actions',
    field: 'actions',
    label: t('admin.examManagement.table.columns.tools'),
    align: 'center',
  },
]);

const handleEdit = (row: PaymentRow) => {
  selectedRow.value = row;
  editForm.value.ref1 = row.file_ref || '';
  editForm.value.ref2 = row.file_ref2 || '';
  isDialogOpened.value = true;
};

const handleSave = () => {
  if (selectedRow.value) {
    emit('save-row', {
      rowId: selectedRow.value.id,
      ref1: editForm.value.ref1,
      ref2: editForm.value.ref2,
    });
  }
  isDialogOpened.value = false;
};
</script>

<style scoped lang="scss">
/* column width is controlled by q-th, not q-td */
.th-narrow {
  width: 150px;
  max-width: 150px;
  white-space: normal;
  word-break: break-word;
}

.td-narrow {
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
}

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
