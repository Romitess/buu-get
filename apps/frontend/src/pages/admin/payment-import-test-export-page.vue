<template>
  <q-page class="page-container payment-import-test-export-page">
    <AppBreadcrumbs />

    <AppPageHeader
      :title="$t('admin.paymentImportTestExport.pageTitle')"
      :subtitle="$t('admin.paymentImportTestExport.pageSubtitle')"
    />

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <q-select
          v-model="selectedExamId"
          :options="examOptions"
          :loading="isLoadingExams"
          emit-value
          map-options
          option-value="EXAM_ID"
          :option-label="formatExamOptionLabel"
          :label="$t('admin.paymentImportTestExport.examSelectLabel')"
          outlined
          dense
          clearable
          @update:model-value="onExamSelected"
        />
      </q-card-section>
    </q-card>

    <q-banner v-if="selectedExamId" rounded class="bg-blue-1 q-mb-md">
      <div>{{ $t('admin.paymentImportTestExport.hintDuplicateImport') }}</div>
      <template #action>
        <AppButton
          flat
          color="primary"
          :label="$t('admin.paymentImportTestExport.goToPaymentImport')"
          to="/admin/payment-import"
        />
      </template>
    </q-banner>

    <div class="row items-center justify-between q-mb-md">
      <div class="text-body2 text-grey-8">
        {{
          $t('admin.paymentImportTestExport.previewCount', {
            count: exportRows.length,
          })
        }}
      </div>
      <ExportCsvButton
        :columns="exportColumns"
        :rows="exportRows"
        :load-rows="loadExportRows"
        :disable="!selectedExamId"
        file-name-prefix="payment-import-test"
        :label="$t('admin.paymentImportTestExport.exportButton')"
        color="primary"
      />
    </div>

    <BaseTable
      :columns="previewColumns"
      :rows="exportRows"
      :loading="isLoadingRows"
      :empty-label="$t('admin.paymentImportTestExport.emptyTable')"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import {
  fetchTestExportExams,
  fetchTestExportRows,
  type TestExportExamOption,
  type TestExportRow,
} from 'src/services/bank-reconcile.service';
import { formatExamInstanceLabel } from 'src/utils/exam-instance-label';

const { t } = useI18n();
const $q = useQuasar();

const examOptions = ref<TestExportExamOption[]>([]);
const selectedExamId = ref<number | null>(null);
const exportRows = ref<TestExportRow[]>([]);
const isLoadingExams = ref(false);
const isLoadingRows = ref(false);

const formatExamOptionLabel = (exam: TestExportExamOption): string => {
  const instance = formatExamInstanceLabel(exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR);
  const round = instance ? ` (${instance})` : '';
  const fee = Number(exam.EXAM_FEE).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${exam.EXAM_NAME}${round} — ${fee} (${exam.exportableCount})`;
};

const previewColumns = computed<QTableColumn[]>(() => [
  {
    name: 'applicantId',
    label: t('admin.paymentImport.table.applicantId'),
    field: 'applicantId',
    align: 'left',
  },
  {
    name: 'referenceNo',
    label: t('admin.paymentImport.table.referenceNo'),
    field: 'referenceNo',
    align: 'left',
  },
  {
    name: 'payerName',
    label: t('admin.paymentImport.table.payerName'),
    field: 'payerName',
    align: 'left',
  },
  {
    name: 'amount',
    label: t('admin.paymentImport.table.amount'),
    field: 'amount',
    align: 'right',
  },
  {
    name: 'paymentDate',
    label: t('admin.paymentImport.table.paymentDate'),
    field: 'paymentDate',
    align: 'left',
  },
  {
    name: 'paymentTime',
    label: t('admin.paymentImport.table.paymentTime'),
    field: 'paymentTime',
    align: 'left',
  },
]);

const exportColumns = computed<QTableColumn[]>(() =>
  previewColumns.value.map((column) => ({
    ...column,
    label: column.name,
  })),
);

const loadExamOptions = async (): Promise<void> => {
  isLoadingExams.value = true;
  try {
    examOptions.value = await fetchTestExportExams();
  } catch (error) {
    console.error('Failed to load test export exams:', error);
    $q.notify({
      message: t('admin.paymentImportTestExport.loadExamsError'),
      color: 'negative',
    });
  } finally {
    isLoadingExams.value = false;
  }
};

const loadRows = async (): Promise<void> => {
  if (!selectedExamId.value) {
    exportRows.value = [];
    return;
  }

  isLoadingRows.value = true;
  try {
    exportRows.value = await fetchTestExportRows(selectedExamId.value);
  } catch (error) {
    console.error('Failed to load test export rows:', error);
    exportRows.value = [];
    $q.notify({
      message: t('admin.paymentImportTestExport.loadRowsError'),
      color: 'negative',
    });
  } finally {
    isLoadingRows.value = false;
  }
};

const onExamSelected = async (): Promise<void> => {
  await loadRows();
};

const loadExportRows = async (): Promise<TestExportRow[]> => {
  if (!selectedExamId.value) {
    return [];
  }

  if (exportRows.value.length === 0) {
    await loadRows();
  }

  return exportRows.value;
};

onMounted(() => {
  void loadExamOptions();
});
</script>
