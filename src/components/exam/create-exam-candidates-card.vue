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
            label="สร้าง Passcode"
            unelevated
            dense
            icon="vpn_key"
            class="q-px-md action-btn passcode-btn"
            @click="$emit('generate-passcodes')"
          />
        </div>
        <div class="col-12 col-md-auto row q-gutter-sm justify-end">
          <input
            type="file"
            ref="fileInput"
            class="hidden"
            accept=".csv"
            style="display: none"
            @change="onFileSelected"
          />
          <q-btn
            label="นำเข้าไฟล์รายชื่อ"
            color="primary"
            unelevated
            dense
            icon="upload"
            class="q-px-md action-btn"
            @click="triggerFileInput"
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
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { EligibleCandidate } from 'src/composables/use-create-exam';
import type { QTableColumn } from 'quasar';

defineProps<{
  /** Filtered candidates to display */
  filteredCandidates: EligibleCandidate[];
}>();

const searchQuery = defineModel<string>('searchQuery', { required: true });

const emit = defineEmits<{
  (e: 'import-candidates', file: File): void;
  (e: 'generate-passcodes'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    emit('import-candidates', target.files[0]);
    target.value = ''; // Reset for consecutive uploads
  }
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
    label: 'รหัสประจำตัว',
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
  background-color: #bdbdbd !important;
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
