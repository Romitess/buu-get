<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="search-candidate-dialog">
      <q-card-section class="row items-center justify-between q-pb-none">
        <div class="text-h6 text-weight-bold">ค้นหาผู้สมัครสอบ</div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            bg-color="white"
            placeholder="ค้นหาชื่อ, เลขบัตรประชาชน, passport หรืออีเมล"
            hide-bottom-space
            :loading="isLoading"
          >
            <template v-slot:append>
              <q-icon name="search" color="grey-6" />
            </template>
          </q-input>
        </div>

        <BaseTable
          :columns="columns"
          :rows="rows"
          :loading="isLoading"
          :pagination="pagination"
          empty-label="ไม่พบผู้สมัคร"
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
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: 'ลำดับ',
    field: 'index',
    align: 'center',
    style: 'width: 70px',
  },
  {
    name: 'identifier',
    label: 'รหัสประชาชน / Passport',
    field: 'nationalId',
    align: 'center',
  },
  {
    name: 'fullName',
    label: 'ชื่อ-นามสกุล',
    field: 'fullNameTH',
    align: 'left',
  },
  {
    name: 'email',
    label: 'อีเมล',
    field: 'email',
    align: 'left',
  },
  {
    name: 'actions',
    label: 'การดำเนินการ',
    field: 'actions',
    align: 'center',
    style: 'width: 100px',
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
  if (reqProps.pagination) {
    pagination.value.page = reqProps.pagination.page;
    pagination.value.rowsPerPage = reqProps.pagination.rowsPerPage;
  }
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
}
</style>
