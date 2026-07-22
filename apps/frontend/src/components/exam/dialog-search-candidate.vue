<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="search-candidate-dialog column no-wrap">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h6 text-weight-bold">ค้นหาผู้สมัครสอบ</div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="search-candidate-content col">
        <div class="q-mb-md">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            bg-color="white"
            placeholder="ค้นหาชื่อ, เลขบัตรประชาชน, passport หรืออีเมล"
            hide-bottom-space
          >
            <template v-slot:append>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>

        <div
          class="search-candidate-table"
          :class="{ 'search-candidate-table--empty': isTableEmpty }"
        >
          <BaseTable
            :columns="columns"
            :rows="rows"
            :loading="isLoading"
            :pagination="pagination"
            is-server-side
            empty-label=" "
            @request="onRequest"
          >
          <template v-slot:body-cell-index="{ row }">
            <div class="text-center">{{ getRowIndex(row) }}</div>
          </template>

          <template v-slot:body-cell-identifier="{ row }">
            <div class="text-center">{{ row.nationalId || row.passportNo || '-' }}</div>
          </template>

          <template v-slot:body-cell-fullName="{ row }">
            <div class="text-left">{{ row.fullNameTH || row.fullNameEN || '-' }}</div>
          </template>

          <template v-slot:body-cell-actions="{ row }">
            <div class="text-center">
              <q-btn
                label="เพิ่ม"
                color="primary"
                unelevated
                dense
                size="sm"
                class="q-px-sm"
                :disable="!canAdd(row)"
                @click="handleAdd(row)"
              />
            </div>
          </template>
        </BaseTable>
        <div v-if="isTableEmpty" class="search-candidate-empty-message" role="status">
          ไม่พบผู้สมัคร
        </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { debounce } from 'quasar';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import { searchUsers } from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';
import type { User } from 'src/types/user';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

const isOpen = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  (e: 'add-candidate', user: User): void;
}>();

const props = withDefaults(
  defineProps<{
    existingKeys?: string[];
  }>(),
  {
    existingKeys: () => [],
  },
);

const searchQuery = ref('');
const isLoading = ref(false);
const rows = ref<User[]>([]);
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const isTableEmpty = computed(() => !isLoading.value && rows.value.length === 0);

const columns: QTableColumn[] = [
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
    style: 'width: 22%; white-space: normal !important;',
    headerStyle: 'width: 22%; white-space: normal !important; line-height: 1.25;',
  },
  {
    name: 'fullName',
    label: 'ชื่อ-นามสกุล',
    field: 'fullNameTH',
    align: 'left',
    sortable: false,
    style: 'width: 28%',
    headerStyle: 'width: 28%',
  },
  {
    name: 'email',
    label: 'อีเมล',
    field: 'email',
    align: 'left',
    sortable: false,
    style: 'width: 27%',
    headerStyle: 'width: 27%',
  },
  {
    name: 'actions',
    label: 'การดำเนินการ',
    field: 'actions',
    align: 'center',
    sortable: false,
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
];

const getCandidateKey = (user: User): string =>
  user.nationalId?.trim() || user.passportNo?.trim() || '';

const canAdd = (user: User): boolean => {
  const key = getCandidateKey(user);
  if (!key) return false;
  return !(props.existingKeys).includes(key);
};

const getRowIndex = (row: User): number => {
  const page = pagination.value.page ?? 1;
  const rowsPerPage = pagination.value.rowsPerPage ?? 10;
  const localIndex = rows.value.indexOf(row);
  return (page - 1) * rowsPerPage + localIndex + 1;
};

const fetchResults = async (): Promise<void> => {
  const query = searchQuery.value.trim();
  if (!query) {
    rows.value = [];
    pagination.value.rowsNumber = 0;
    return;
  }

  isLoading.value = true;
  try {
    const result = await searchUsers({
      search: query,
      role: ROLES.CANDIDATE,
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
    });
    rows.value = result.users;
    pagination.value.rowsNumber = result.total;
    pagination.value.page = result.page;
  } finally {
    isLoading.value = false;
  }
};

const debouncedFetchResults = debounce(() => {
  void fetchResults();
}, 400);

watch(searchQuery, () => {
  pagination.value.page = 1;
  debouncedFetchResults();
});

const onRequest = (reqProps: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = reqProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
  void fetchResults();
};

const handleAdd = (user: User): void => {
  emit('add-candidate', user);
};

watch(isOpen, (open) => {
  if (!open) {
    searchQuery.value = '';
    rows.value = [];
    pagination.value.page = 1;
    pagination.value.rowsNumber = 0;
  }
});
</script>

<style scoped>
.search-candidate-dialog {
  width: 900px;
  max-width: 95vw;
  min-height: 75vh;
  max-height: 85vh;
}

.search-candidate-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding-top: 8px;
}

.search-candidate-table {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
}

.search-candidate-table :deep(.base-table-wrapper) {
  width: 100%;
  height: 100%;
}

.search-candidate-table :deep(.q-table) {
  width: 100%;
  table-layout: fixed;
}

.search-candidate-table :deep(.q-table thead tr th) {
  white-space: normal !important;
  word-break: keep-all;
  line-height: 1.25;
  vertical-align: middle;
}

.search-candidate-table :deep(.q-table tbody tr td) {
  white-space: normal !important;
  word-break: break-word;
  vertical-align: middle;
}

.search-candidate-table--empty {
  --empty-area-height: calc(75vh - 240px);
}

.search-candidate-table--empty :deep(.q-table__middle) {
  min-height: var(--empty-area-height);
}

.search-candidate-table--empty :deep(.base-table-empty-cell) {
  height: calc(var(--empty-area-height) - 48px);
  padding: 0;
  border-bottom: none;
  color: transparent;
  user-select: none;
}

.search-candidate-empty-message {
  position: absolute;
  left: 0;
  right: 0;
  top: 41px;
  height: calc(var(--empty-area-height) - 48px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, rgba(0, 0, 0, 0.54));
  font-size: var(--font-size-md);
  pointer-events: none;
}
</style>
