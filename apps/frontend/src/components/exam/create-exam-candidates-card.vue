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
            v-if="!locked && hasCandidates"
            label="ลบรายชื่อ"
            color="negative"
            outline
            unelevated
            dense
            icon="delete_sweep"
            class="q-px-md action-btn"
            @click="showDeleteDialog = true"
          />
          <q-btn
            v-if="!locked"
            label="ค้นหาผู้สมัคร"
            color="secondary"
            unelevated
            dense
            icon="person_search"
            class="q-px-md action-btn"
            @click="showSearchDialog = true"
          />
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
        <template v-slot:body-cell-index="{ value }">
          <div class="text-center">{{ value }}</div>
        </template>

        <!-- Full Name Column -->
        <template v-slot:body-cell-fullName="{ row }">
          <div class="text-left q-pl-custom">{{ row.fullName }}</div>
        </template>

        <!-- In System Status Column -->
        <template v-slot:body-cell-inSystem="{ row }">
          <div class="text-center">
            <q-badge
              v-if="row.inSystem === true"
              color="positive"
              label="มีในระบบ"
            />
            <q-badge
              v-else-if="row.inSystem === false"
              color="grey-6"
              text-color="white"
              label="ไม่มีในระบบ"
            />
            <q-spinner-dots
              v-else-if="loading"
              color="primary"
              size="20px"
            />
            <span v-else class="text-grey-6">—</span>
          </div>
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

    <!-- Define Shared Passcode Dialog -->
    <DialogDefineSharedPasscode
      v-model="showDefineSharedPasscodeDialog"
      @confirm="onSharedPasscodeDefined"
    />

    <!-- Search Candidate Dialog -->
    <DialogSearchCandidate
      v-model="showSearchDialog"
      :existing-keys="props.existingCandidateKeys"
      @confirm-candidates="onConfirmCandidates"
    />

    <!-- Delete Candidates Dialog -->
    <DialogDeleteCandidates
      v-model="showDeleteDialog"
      :candidates="props.candidates"
      @confirm-remove="onConfirmRemove"
    />
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
import DialogDefineSharedPasscode from 'src/components/exam/dialog-define-shared-passcode.vue';
import DialogSearchCandidate from 'src/components/exam/dialog-search-candidate.vue';
import DialogDeleteCandidates from 'src/components/exam/dialog-delete-candidates.vue';
import type { User } from 'src/types/user';

const props = withDefaults(
  defineProps<{
    /** Filtered candidates to display */
    filteredCandidates: EligibleCandidate[];
    /** Full eligible candidates list */
    candidates: EligibleCandidate[];
    /** Keys already in eligible list (nationalId or passport) */
    existingCandidateKeys?: string[];
    hasCandidates?: boolean;
    locked?: boolean;
    loading?: boolean;
  }>(),
  {
    existingCandidateKeys: () => [],
    hasCandidates: false,
  },
);

const searchQuery = defineModel<string>('searchQuery', { required: true });

const emit = defineEmits<{
  (e: 'import-candidates', file: File): void;
  (e: 'passcode-type-selected', type: PasscodeType): void;
  (e: 'shared-passcode-defined', passcode: string): void;
  (e: 'url-submitted', url: string): void;
  (e: 'export-candidates'): void;
  (e: 'add-candidates-from-users', users: User[]): void;
  (e: 'remove-candidates', keys: string[]): void;
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

const onRequest = (reqProps: TableRequestProps) => {
  if (reqProps.pagination) {
    pagination.value.page = reqProps.pagination.page;
    pagination.value.rowsPerPage = reqProps.pagination.rowsPerPage;
  }
};

/** Dialog visibility state */
const showCsvImportDialog = ref(false);
const showPasscodeTypeDialog = ref(false);
const showDefineSharedPasscodeDialog = ref(false);
const showSearchDialog = ref(false);
const showDeleteDialog = ref(false);

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
  if (type === 'single') {
    showDefineSharedPasscodeDialog.value = true;
    return;
  }
  emit('passcode-type-selected', type);
};

/** Shared passcode defined by admin */
const onSharedPasscodeDefined = (passcode: string): void => {
  emit('shared-passcode-defined', passcode);
};

/** Search dialog: candidates confirmed */
const onConfirmCandidates = (users: User[]): void => {
  emit('add-candidates-from-users', users);
};

/** Delete dialog: candidates confirmed for removal */
const onConfirmRemove = (keys: string[]): void => {
  emit('remove-candidates', keys);
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
    name: 'inSystem',
    label: 'สถานะข้อมูลในระบบ',
    field: 'inSystem',
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
