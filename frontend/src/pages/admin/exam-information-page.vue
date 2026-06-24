<template>
  <q-page class="page-container exam-information-page">
    <AppBreadcrumbs />
    <AppPageHeader
      title="ข้อมูลผู้เข้าสอบ"
      subtitle="แสดงข้อมูลและผลการสอบของผู้เข้าสอบรายบุคคลในการสอบ"
    />

    <SearchBar
      v-model="searchQuery"
      class="q-mb-md"
      placeholder="ค้นหา"
      @update:model-value="onSearch"
    />

    <BaseTable
      :columns="columns"
      :rows="rows"
      :loading="isLoading"
      :pagination="pagination"
      :is-server-side="true"
      empty-label="ไม่พบข้อมูลผู้เข้าสอบ"
      @request="onRequest"
    >
      <template #body-cell-index="{ row }">
        <div class="text-center">{{ row.index }}</div>
      </template>
      <template #body-cell-testTakerId="{ row }">
        <div class="text-center">{{ row.testTakerId || '-' }}</div>
      </template>
      <template #body-cell-title="{ row }">
        <div>{{ row.title || '-' }}</div>
      </template>
      <template #body-cell-fullName="{ row }">
        <div>{{ row.fullName || '-' }}</div>
      </template>
      <template #body-cell-examRoundCount="{ row }">
        <div class="text-center">{{ row.examRoundCount }}</div>
      </template>
      <template #body-cell-tools="{ row }">
        <div class="text-center">
          <ActionButton
            icon="visibility"
            color="black"
            tooltip="ดูข้อมูลผู้เข้าสอบ"
            @click="handleView(row)"
          />
        </div>
      </template>
    </BaseTable>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import { useExecutiveTestTakers } from 'src/composables/use-executive-test-takers';
import type { TableRequestProps, PaginationModel } from 'src/types/exam.types';
import type { ExecutiveTestTakerRow } from 'src/types/executive-test-taker.types';

interface ExecutiveTestTakerTableRow extends ExecutiveTestTakerRow {
  index: number;
}

const { rows: sourceRows, total, isLoading, fetchRows } = useExecutiveTestTakers();
const router = useRouter();
const searchQuery = ref('');
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
});

const rows = computed<ExecutiveTestTakerTableRow[]>(() =>
  sourceRows.value.map((row, index) => ({
    ...row,
    index: (pagination.value.page - 1) * pagination.value.rowsPerPage + index + 1,
  })),
);

const columns: QTableColumn<ExecutiveTestTakerTableRow>[] = [
  { name: 'index', label: 'ลำดับ', field: 'index', align: 'center', style: 'width: 80px' },
  {
    name: 'testTakerId',
    label: 'เลขประจำตัวสอบ',
    field: 'testTakerId',
    align: 'center',
  },
  { name: 'title', label: 'คำนำหน้า', field: 'title', align: 'left' },
  { name: 'fullName', label: 'ชื่อ-นามสกุล', field: 'fullName', align: 'left' },
  {
    name: 'examRoundCount',
    label: 'จำนวนรอบที่เข้าสอบ',
    field: 'examRoundCount',
    align: 'center',
  },
  { name: 'tools', label: 'เครื่องมือ', field: 'enrollmentId', align: 'center' },
];

let searchTimeout: ReturnType<typeof setTimeout> | undefined;

const loadRows = async (): Promise<void> => {
  await fetchRows(
    pagination.value.page,
    pagination.value.rowsPerPage,
    searchQuery.value || undefined,
  );
};

const onSearch = (): void => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    void loadRows();
  }, 300);
};

const onRequest = ({ pagination: nextPagination }: TableRequestProps): void => {
  pagination.value.page = nextPagination.page;
  pagination.value.rowsPerPage = nextPagination.rowsPerPage;
  void loadRows();
};

const handleView = (row: ExecutiveTestTakerTableRow): void => {
  void router.push({
    name: 'admin-exam-registrant-detail',
    params: { examId: row.examId, ermId: row.enrollmentId },
  });
};

watch(total, (value) => {
  pagination.value.rowsNumber = value;
});

onMounted(() => {
  void loadRows();
});
</script>
