<template>
  <q-card flat bordered class="buu-premium-card q-mb-md">
    <q-card-section>
      <!-- Header Section -->
      <div class="row items-center q-mb-md">
        <q-icon name="person_add" size="20px" class="q-mr-sm text-dark" />
        <div class="text-subtitle1 text-weight-bold text-dark">รายชื่อผู้มีสิทธิ์สอบ</div>
      </div>

      <!-- Search & Actions Row -->
      <div class="row items-center q-mb-md q-col-gutter-sm">
        <div class="col-12 col-md-5">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            placeholder="ค้นหา"
            bg-color="white"
            class="search-input"
            hide-bottom-space
          >
            <template v-slot:append>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>
        <q-space />
        <div class="col-auto">
          <q-btn
            v-if="!locked"
            label="สร้าง Passcode"
            unelevated
            dense
            icon="vpn_key"
            class="q-px-md action-btn passcode-btn"
            @click="showPasscodeTypeDialog = true"
          />
          <q-btn
            v-if="locked"
            label="ส่งออก (Export)"
            color="secondary"
            unelevated
            dense
            icon="download"
            class="q-px-md action-btn"
            @click="$emit('export-candidates')"
          />
        </div>
        <div class="col-12 col-md-auto row q-gutter-sm justify-end">
          <q-btn
            v-if="!locked"
            label="นำเข้าไฟล์รายชื่อ"
            color="primary"
            unelevated
            dense
            icon="upload"
            class="q-px-md action-btn"
            @click="showCsvImportDialog = true"
          />
        </div>
      </div>

      <!-- Candidates Table -->
      <BaseTable
        :columns="columns"
        :rows="filteredCandidates"
        :loading="loading"
        :pagination="pagination"
        empty-label="No data available in table"
        class="candidates-table"
        @request="onRequest"
      >
        <!-- Index Column -->
        <template v-slot:body-cell-index="{ row }">
          <div class="text-center">{{ getIndex(row) }}</div>
        </template>

        <!-- Full Name Column -->
        <template v-slot:body-cell-fullName="{ row }">
          <div class="text-left q-pl-custom">{{ row.fullName }}</div>
        </template>
      </BaseTable>
    </q-card-section>

    <!-- CSV Import Dialog -->
    <DialogCsvImport
      v-model="showCsvImportDialog"
      @file-selected="onCsvFileSelected"
      @url-submitted="onUrlSubmitted"
      @download-sample="onDownloadSample"
    />

    <!-- Passcode Type Selection Dialog -->
    <DialogPasscodeType v-model="showPasscodeTypeDialog" @select="onPasscodeTypeSelected" />
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { exportFile } from 'quasar';
import type { EligibleCandidate } from 'src/composables/use-create-exam';
import type { QTableColumn } from 'quasar';
import type { PasscodeType } from 'src/types/exam';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import BaseTable from 'src/components/shared/base-table.vue';
import DialogCsvImport from 'src/components/exam/dialog-csv-import.vue';
import DialogPasscodeType from 'src/components/exam/dialog-passcode-type.vue';

const props = defineProps<{
  /** Filtered candidates to display */
  filteredCandidates: EligibleCandidate[];
  locked?: boolean;
  loading?: boolean;
}>();

const searchQuery = defineModel<string>('searchQuery', { required: true });

const emit = defineEmits<{
  (e: 'import-candidates', file: File): void;
  (e: 'passcode-type-selected', type: PasscodeType): void;
  (e: 'url-submitted', url: string): void;
  (e: 'export-candidates'): void;
}>();

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: props.filteredCandidates.length,
});

watch(
  () => props.filteredCandidates,
  (newCandidates) => {
    pagination.value.rowsNumber = newCandidates.length;
    const maxPage = Math.ceil(newCandidates.length / pagination.value.rowsPerPage) || 1;
    if (pagination.value.page > maxPage) {
      pagination.value.page = 1;
    }
  },
  { deep: true },
);

const getIndex = (row: EligibleCandidate): number => {
  const page = pagination.value.page ?? 1;
  const rowsPerPage = pagination.value.rowsPerPage ?? 10;
  const localIndex = props.filteredCandidates.indexOf(row);
  return (page - 1) * rowsPerPage + localIndex + 1;
};

const onRequest = (reqProps: TableRequestProps) => {
  if (reqProps.pagination) {
    pagination.value.page = reqProps.pagination.page;
    pagination.value.rowsPerPage = reqProps.pagination.rowsPerPage;
  }
};

/** Dialog visibility state */
const showCsvImportDialog = ref(false);
const showPasscodeTypeDialog = ref(false);

/** CSV dialog: file selected */
const onCsvFileSelected = (file: File): void => {
  emit('import-candidates', file);
};

/** CSV dialog: URL submitted */
const onUrlSubmitted = (url: string): void => {
  emit('url-submitted', url);
};

/**
 * Download a sample CSV file with UTF-8 BOM encoding.
 * The file contains exactly 2 columns: รหัสประจำตัว, ชื่อ-นามสกุล
 * This ensures the imported file will be parsed correctly by the system.
 */
const onDownloadSample = (): void => {
  const BOM = '\ufeff';
  const header = '"รหัสประชาชน","ชื่อ-นามสกุล"';
  const sampleRows = [
    '"1100000000000","สมชาย ใจดี"',
    '"1100000000001","สมหญิง ใจงาม"',
    '"1100000000002","สมศักดิ์ ใจเย็น"',
  ];
  const content = BOM + [header, ...sampleRows].join('\r\n');

  const status = exportFile('ตัวอย่างไฟล์รายชื่อ.csv', content, 'text/csv;charset=utf-8');

  if (status !== true) {
    console.error('Browser blocked the file download');
  }
};

/** Passcode type dialog: type selected */
const onPasscodeTypeSelected = (type: PasscodeType): void => {
  emit('passcode-type-selected', type);
};

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: 'ลำดับ',
    field: 'index',
    align: 'center',
    style: 'width: 80px',
  },
  {
    name: 'nationalId',
    label: 'รหัสประชาชน',
    field: 'nationalId',
    align: 'center',
  },
  {
    name: 'fullName',
    label: 'ชื่อ-นามสกุล',
    field: 'fullName',
    align: 'left',
    style: 'width: 30%',
  },
  {
    name: 'passcode',
    label: 'Passcode',
    field: 'passcode',
    align: 'center',
  },
];
</script>

<style scoped>
.search-input :deep(.q-field__control) {
  border-radius: var(--radius-sm, 8px);
}
.action-btn {
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  min-height: 36px;
}
.passcode-btn {
  background-color: var(--primary) !important;
  color: white !important;
}

.q-pl-custom {
  padding-left: 128px;
}
</style>
