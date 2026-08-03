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

        <q-tabs
          v-model="activeTab"
          dense
          class="text-grey search-candidate-tabs"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
          no-caps
        >
          <q-tab name="search" label="ผลการค้นหา" />
          <q-tab name="selected" :label="selectedTabLabel" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="activeTab" animated class="search-candidate-panels col">
          <q-tab-panel name="search" class="q-pa-none q-pt-md column">
            <div
              class="search-candidate-table col"
              :class="{ 'search-candidate-table--empty': isSearchTableEmpty }"
            >
              <BaseTable
                :columns="searchColumns"
                :rows="rows"
                :loading="isLoading"
                :pagination="pagination"
                :rows-per-page-options="CANDIDATE_ROWS_PER_PAGE_OPTIONS"
                is-server-side
                empty-label=" "
                @request="onRequest"
              >
                <template v-slot:body-cell-index="{ value }">
                  <div class="text-center">{{ value }}</div>
                </template>

                <template v-slot:body-cell-identifier="{ row }">
                  <div class="text-center">{{ row.nationalId || row.passportNo || '-' }}</div>
                </template>

                <template v-slot:body-cell-fullName="{ row }">
                  <div class="text-left">{{ row.fullNameTH || row.fullNameEN || '-' }}</div>
                </template>

                <template v-slot:body-cell-select="{ row }">
                  <div class="text-center">
                    <q-checkbox
                      :model-value="isSelected(row)"
                      :disable="!canSelect(row)"
                      dense
                      color="primary"
                      @update:model-value="(val: boolean) => toggleSelection(row, val)"
                    />
                  </div>
                </template>
              </BaseTable>
              <div v-if="isSearchTableEmpty" class="search-candidate-empty-message" role="status">
                ไม่พบผู้สมัคร
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="selected" class="q-pa-none q-pt-md column">
            <div
              class="search-candidate-table col"
              :class="{ 'search-candidate-table--empty': isSelectedTableEmpty }"
            >
              <BaseTable
                :columns="selectedColumns"
                :rows="selectedList"
                :pagination="selectedPagination"
                :rows-per-page-options="CANDIDATE_ROWS_PER_PAGE_OPTIONS"
                empty-label=" "
              >
                <template v-slot:body-cell-index="{ value }">
                  <div class="text-center">{{ value }}</div>
                </template>

                <template v-slot:body-cell-identifier="{ row }">
                  <div class="text-center">{{ row.nationalId || row.passportNo || '-' }}</div>
                </template>

                <template v-slot:body-cell-fullName="{ row }">
                  <div class="text-left">{{ row.fullNameTH || row.fullNameEN || '-' }}</div>
                </template>

                <template v-slot:body-cell-select="{ row }">
                  <div class="text-center">
                    <q-checkbox
                      :model-value="true"
                      dense
                      color="primary"
                      @update:model-value="(val: boolean) => toggleSelection(row, val)"
                    />
                  </div>
                </template>
              </BaseTable>
              <div
                v-if="isSelectedTableEmpty"
                class="search-candidate-empty-message"
                role="status"
              >
                ยังไม่ได้เลือกผู้สมัคร
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="ยกเลิก" v-close-popup />
        <q-btn
          color="primary"
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
import { debounce } from 'quasar';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import { searchUsers } from 'src/services/user.service';
import { ROLES } from 'src/constants/roles';
import type { User } from 'src/types/user';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

const isOpen = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  (e: 'confirm-candidates', users: User[]): void;
}>();

const props = withDefaults(
  defineProps<{
    existingKeys?: string[];
  }>(),
  {
    existingKeys: () => [],
  },
);

const CANDIDATE_PAGE_SIZE = 5;
const CANDIDATE_ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const searchQuery = ref('');
const activeTab = ref<'search' | 'selected'>('search');
const isLoading = ref(false);
const rows = ref<User[]>([]);
const selectedUsers = ref<Map<string, User>>(new Map());
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: CANDIDATE_PAGE_SIZE,
  rowsNumber: 0,
});
const selectedPagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: CANDIDATE_PAGE_SIZE,
  rowsNumber: 0,
});

const selectedList = computed<User[]>(() => Array.from(selectedUsers.value.values()));
const selectedCount = computed<number>(() => selectedList.value.length);
const selectedTabLabel = computed<string>(() => `ที่เลือกแล้ว (${selectedCount.value})`);
const confirmLabel = computed<string>(() =>
  selectedCount.value > 0 ? `ยืนยันเพิ่ม (${selectedCount.value})` : 'ยืนยันเพิ่ม',
);

const isSearchTableEmpty = computed(() => !isLoading.value && rows.value.length === 0);
const isSelectedTableEmpty = computed(() => selectedList.value.length === 0);

const baseColumns: QTableColumn[] = [
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
];

const searchColumns: QTableColumn[] = [
  ...baseColumns,
  {
    name: 'select',
    label: 'เลือก',
    field: 'select',
    align: 'center',
    sortable: false,
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
];

const selectedColumns: QTableColumn[] = [
  ...baseColumns,
  {
    name: 'select',
    label: 'เลือก',
    field: 'select',
    align: 'center',
    sortable: false,
    style: 'width: 15%',
    headerStyle: 'width: 15%',
  },
];

const getCandidateKey = (user: User): string =>
  user.nationalId?.trim() || user.passportNo?.trim() || '';

const canSelect = (user: User): boolean => {
  const key = getCandidateKey(user);
  if (!key) return false;
  return !props.existingKeys.includes(key);
};

const isSelected = (user: User): boolean => selectedUsers.value.has(getCandidateKey(user));

const toggleSelection = (user: User, selected: boolean): void => {
  const key = getCandidateKey(user);
  if (!key) return;

  const next = new Map(selectedUsers.value);
  if (selected && canSelect(user)) {
    next.set(key, user);
  } else {
    next.delete(key);
  }
  selectedUsers.value = next;
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

watch(selectedList, (list) => {
  selectedPagination.value.rowsNumber = list.length;
  const maxPage =
    Math.ceil(list.length / (selectedPagination.value.rowsPerPage ?? CANDIDATE_PAGE_SIZE)) || 1;
  if ((selectedPagination.value.page ?? 1) > maxPage) {
    selectedPagination.value.page = 1;
  }
});

const onRequest = (reqProps: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = reqProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
  void fetchResults();
};

const resetDialogState = (): void => {
  searchQuery.value = '';
  activeTab.value = 'search';
  rows.value = [];
  selectedUsers.value = new Map();
  pagination.value.page = 1;
  pagination.value.rowsNumber = 0;
  selectedPagination.value.page = 1;
  selectedPagination.value.rowsNumber = 0;
};

const handleConfirm = (): void => {
  if (selectedCount.value === 0) return;
  emit('confirm-candidates', selectedList.value);
  isOpen.value = false;
};

watch(isOpen, (open) => {
  if (!open) {
    resetDialogState();
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

.search-candidate-tabs {
  margin-bottom: 0;
}

.search-candidate-panels {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.search-candidate-panels :deep(.q-panel) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
  --empty-area-height: calc(75vh - 320px);
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
