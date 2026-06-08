<template>
  <q-page class="page-container exam-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.passcodeHistory.pageTitle')"
      :subtitle="$t('admin.passcodeHistory.pageSubtitle')"
    />

    <!-- Search and Action Bar -->
    <div class="row items-center justify-between q-mb-lg">
      <div style="width: 340px">
        <SearchBar v-model="searchQuery" />
      </div>
      <ExportCsvButton
        :columns="exportColumns"
        :rows="filteredPasscodes"
        file-name-prefix="passcode-history"
        color="primary"
        unelevated
        class="text-weight-bold"
      />
    </div>

    <!-- Main Content / Table -->
    <PasscodeHistoryTable
      :passcodes="filteredPasscodes"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import PasscodeHistoryTable from 'src/components/passcode-history-table.vue';
import type { PasscodeLog } from 'src/types/common';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { fetchPasscodeHistory } from 'src/services/exam.service';

const $q = useQuasar();
const route = useRoute();

const isLoading = ref(false);
const searchQuery = ref('');
const passcodes = ref<PasscodeLog[]>([]);

// examId จาก query param ที่ส่งมาจาก exam-management-page
const examId = computed(() => route.query.examId as string | undefined);

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const filteredPasscodes = computed(() => {
  if (!searchQuery.value) return passcodes.value;
  const query = searchQuery.value.toLowerCase();
  return passcodes.value.filter(
    (p) => p.fullName.toLowerCase().includes(query) || p.passcode.toLowerCase().includes(query),
  );
});

const exportColumns: QTableColumn[] = [
  { name: 'index', label: 'ลำดับ', field: 'index', align: 'center' },
  { name: 'fullName', label: 'ชื่อ-นามสกุล', field: 'fullName', align: 'center' },
  { name: 'passcode', label: 'Passcode', field: 'passcode', align: 'center' },
  { name: 'usedDate', label: 'วันที่ใช้', field: 'usedDate', align: 'center' },
  { name: 'usedTime', label: 'เวลาที่ใช้', field: 'usedTime', align: 'center' },
];

const fetchData = async () => {
  if (!examId.value) {
    $q.notify({ type: 'warning', message: 'ไม่พบรหัสการสอบ', position: 'top' });
    return;
  }

  isLoading.value = true;
  try {
    const data = await fetchPasscodeHistory(examId.value);
    passcodes.value = data;
    pagination.value.rowsNumber = data.length;
  } catch {
    $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล', position: 'top' });
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps) => {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
};

onMounted(() => void fetchData());
</script>
