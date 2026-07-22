<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="delete-candidates-dialog column no-wrap">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h6 text-weight-bold">ลบรายชื่อผู้มีสิทธิ์สอบ</div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="delete-candidates-content col">
        <div class="row items-center q-mb-md">
          <q-checkbox
            :model-value="isAllSelected"
            :indeterminate="isIndeterminate"
            label="เลือกทั้งหมด"
            dense
            color="primary"
            :disable="candidates.length === 0"
            @update:model-value="toggleSelectAll"
          />
          <q-space />
          <span class="text-caption text-grey-7">
            เลือกแล้ว {{ selectedCount }} / {{ candidates.length }} รายการ
          </span>
        </div>

        <div
          class="delete-candidates-table"
          :class="{ 'delete-candidates-table--empty': candidates.length === 0 }"
        >
          <BaseTable
            :columns="columns"
            :rows="candidates"
            :pagination="pagination"
            empty-label=" "
          >
            <template v-slot:body-cell-index="{ row }">
              <div class="text-center">{{ getRowIndex(row) }}</div>
            </template>

            <template v-slot:body-cell-identifier="{ row }">
              <div class="text-center">{{ row.nationalId || row.passportNo || '-' }}</div>
            </template>

            <template v-slot:body-cell-fullName="{ row }">
              <div class="text-left">{{ row.fullName || row.fullNameEn || '-' }}</div>
            </template>

            <template v-slot:body-cell-passcode="{ row }">
              <div class="text-center">{{ row.passcode || '-' }}</div>
            </template>

            <template v-slot:body-cell-select="{ row }">
              <div class="text-center">
                <q-checkbox
                  :model-value="isSelected(row)"
                  :disable="!getCandidateKey(row)"
                  dense
                  color="primary"
                  @update:model-value="(val: boolean) => toggleSelection(row, val)"
                />
              </div>
            </template>
          </BaseTable>
          <div
            v-if="candidates.length === 0"
            class="delete-candidates-empty-message"
            role="status"
          >
            ไม่มีรายชื่อที่จะลบ
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="ยกเลิก" v-close-popup />
        <q-btn
          color="negative"
          unelevated
          :label="confirmLabel"
          :disable="selectedCount === 0"
          class="q-px-lg"
          @click="handleConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import {
  getEligibleCandidateKey,
  type EligibleCandidate,
} from 'src/composables/use-create-exam';
import type { PaginationModel } from 'src/types/exam.types';

const isOpen = defineModel<boolean>({ required: true });

const props = withDefaults(
  defineProps<{
    candidates?: EligibleCandidate[];
  }>(),
  {
    candidates: () => [],
  },
);

const emit = defineEmits<{
  (e: 'confirm-remove', keys: string[]): void;
}>();

const selectedKeys = ref<Set<string>>(new Set());
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const selectedCount = computed<number>(() => selectedKeys.value.size);
const isAllSelected = computed<boolean>(
  () => props.candidates.length > 0 && selectedCount.value === props.candidates.length,
);
const isIndeterminate = computed<boolean>(
  () => selectedCount.value > 0 && selectedCount.value < props.candidates.length,
);
const confirmLabel = computed<string>(() =>
  selectedCount.value > 0 ? `ลบที่เลือก (${selectedCount.value})` : 'ลบที่เลือก',
);

const columns: QTableColumn[] = [
  {
    name: 'select',
    label: 'เลือก',
    field: 'select',
    align: 'center',
    sortable: false,
    style: 'width: 10%',
    headerStyle: 'width: 10%',
  },
  {
    name: 'index',
    label: 'ลำดับ',
    field: 'index',
    align: 'center',
    sortable: false,
    style: 'width: 8%',
    headerStyle: 'width: 8%',
  },
  {
    name: 'identifier',
    label: 'รหัสประชาชน / Passport',
    field: 'nationalId',
    align: 'center',
    sortable: false,
    style: 'width: 22%',
    headerStyle: 'width: 22%',
  },
  {
    name: 'fullName',
    label: 'ชื่อ-นามสกุล',
    field: 'fullName',
    align: 'left',
    sortable: false,
    style: 'width: 30%',
    headerStyle: 'width: 30%',
  },
  {
    name: 'passcode',
    label: 'Passcode',
    field: 'passcode',
    align: 'center',
    sortable: false,
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
];

const getCandidateKey = (candidate: EligibleCandidate): string =>
  getEligibleCandidateKey(candidate);

const isSelected = (candidate: EligibleCandidate): boolean =>
  selectedKeys.value.has(getCandidateKey(candidate));

const toggleSelection = (candidate: EligibleCandidate, selected: boolean): void => {
  const key = getCandidateKey(candidate);
  if (!key) return;

  const next = new Set(selectedKeys.value);
  if (selected) {
    next.add(key);
  } else {
    next.delete(key);
  }
  selectedKeys.value = next;
};

const toggleSelectAll = (selected: boolean): void => {
  if (selected) {
    selectedKeys.value = new Set(
      props.candidates.map((c) => getCandidateKey(c)).filter((key) => key.length > 0),
    );
    return;
  }
  selectedKeys.value = new Set();
};

const getRowIndex = (row: EligibleCandidate): number => {
  const page = pagination.value.page ?? 1;
  const rowsPerPage = pagination.value.rowsPerPage ?? 10;
  const localIndex = props.candidates.indexOf(row);
  return (page - 1) * rowsPerPage + localIndex + 1;
};

const resetDialogState = (): void => {
  selectedKeys.value = new Set();
  pagination.value.page = 1;
};

const handleConfirm = (): void => {
  if (selectedCount.value === 0) return;
  emit('confirm-remove', Array.from(selectedKeys.value));
  isOpen.value = false;
};

watch(
  () => props.candidates,
  (list) => {
    pagination.value.rowsNumber = list.length;
    const maxPage = Math.ceil(list.length / (pagination.value.rowsPerPage ?? 10)) || 1;
    if ((pagination.value.page ?? 1) > maxPage) {
      pagination.value.page = 1;
    }

    const validKeys = new Set(list.map((c) => getCandidateKey(c)).filter((key) => key.length > 0));
    const next = new Set(Array.from(selectedKeys.value).filter((key) => validKeys.has(key)));
    selectedKeys.value = next;
  },
  { deep: true },
);

watch(isOpen, (open) => {
  if (open) {
    pagination.value.rowsNumber = props.candidates.length;
    return;
  }
  resetDialogState();
});
</script>

<style scoped>
.delete-candidates-dialog {
  width: 900px;
  max-width: 95vw;
  min-height: 75vh;
  max-height: 85vh;
}

.delete-candidates-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding-top: 8px;
}

.delete-candidates-table {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  --table-area-height: calc(75vh - 280px);
}

.delete-candidates-table :deep(.base-table-wrapper) {
  width: 100%;
  height: 100%;
}

.delete-candidates-table :deep(.q-table) {
  width: 100%;
  table-layout: fixed;
}

.delete-candidates-table :deep(.q-table__middle) {
  min-height: var(--table-area-height);
}

.delete-candidates-table :deep(.q-table thead tr th),
.delete-candidates-table :deep(.q-table tbody tr td) {
  white-space: normal !important;
  word-break: break-word;
  vertical-align: middle;
}

.delete-candidates-table--empty :deep(.base-table-empty-cell) {
  height: calc(var(--table-area-height) - 48px);
  padding: 0;
  border-bottom: none;
  color: transparent;
  user-select: none;
}

.delete-candidates-empty-message {
  position: absolute;
  left: 0;
  right: 0;
  top: 41px;
  height: calc(var(--table-area-height) - 48px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, rgba(0, 0, 0, 0.54));
  font-size: var(--font-size-md);
  pointer-events: none;
}
</style>
