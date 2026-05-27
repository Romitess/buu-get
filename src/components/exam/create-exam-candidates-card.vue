<template>
  <q-card flat bordered class="buu-premium-card q-mb-md">
    <q-card-section>
      <!-- Header Section -->
      <div class="row items-center q-mb-md">
        <q-icon name="person_add" size="20px" class="q-mr-sm text-grey-8" />
        <div class="text-subtitle1 text-weight-bold text-grey-9">รายชื่อผู้มีสิทธิ์สอบ</div>
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
      <q-table
        :rows="filteredCandidates"
        :columns="columns"
        row-key="nationalId"
        flat
        bordered
        dense
        :pagination="{ rowsPerPage: 10 }"
        class="candidates-table"
        no-data-label="No data available in table"
      >
        <template v-slot:body-cell-index="props">
          <q-td :props="props">
            {{ props.rowIndex + 1 }}
          </q-td>
        </template>
        <template v-slot:no-data="{ message }">
          <div
            class="full-width row flex-center bg-grey-4 text-grey-8 q-pa-sm"
            style="min-height: 40px"
          >
            <span>{{ message }}</span>
          </div>
        </template>
      </q-table>
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
import { ref } from 'vue';
import { exportFile } from 'quasar';
import type { EligibleCandidate } from 'src/composables/use-create-exam';
import type { QTableColumn } from 'quasar';
import type { PasscodeType } from 'src/types/exam';
import DialogCsvImport from 'src/components/exam/dialog-csv-import.vue';
import DialogPasscodeType from 'src/components/exam/dialog-passcode-type.vue';

defineProps<{
  /** Filtered candidates to display */
  filteredCandidates: EligibleCandidate[];
  locked?: boolean;
}>();

const searchQuery = defineModel<string>('searchQuery', { required: true });

const emit = defineEmits<{
  (e: 'import-candidates', file: File): void;
  (e: 'passcode-type-selected', type: PasscodeType): void;
  (e: 'url-submitted', url: string): void;
  (e: 'export-candidates'): void;
}>();

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
    align: 'center',
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

.candidates-table :deep(thead tr th) {
  background-color: var(--primary, #1565c0);
  color: white;
  font-weight: 700;
  font-size: 13px;
}
.candidates-table :deep(tbody tr td) {
  font-size: 13px;
}
.candidates-table :deep(.q-table__bottom) {
  font-size: 12px;
}
</style>
