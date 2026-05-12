<template>
  <q-page class="q-px-xl q-pt-md q-pb-lg flex column items-center" style="min-height: 0 !important">
    <div class="full-width" style="max-width: 1200px">
      <!-- Header Section -->
      <div class="q-mb-md">
        <div class="text-h5 text-weight-bold" style="color: var(--primary-dark)">จัดการรอบสอบ</div>
        <div class="text-subtitle2 text-grey-7">
          จัดการข้อมูลรอบสอบ ตรวจสอบกำหนดการ และติดตามสถานะการเปิดรับสมัคร
        </div>
      </div>

      <!-- Search Bar -->
      <div class="q-mb-lg">
        <SearchBar v-model="searchQuery" />
      </div>

      <!-- Filters & Role Switcher (For Demo purposes) -->
      <div class="row justify-between items-center q-mb-md">
        <q-btn
          color="primary"
          icon="add"
          label="สร้างรอบสอบ"
          unelevated
          class="text-weight-bold"
          style="border-radius: 8px"
          @click="$router.push('/admin/create-exam')"
        />
        <q-btn-toggle
          v-model="currentRole"
          flat
          dense
          rounded
          toggle-color="primary"
          :options="[
            { label: 'สิทธิ์: เจ้าหน้าที่', value: 'staff' },
            { label: 'สิทธิ์: กรรมการคุมสอบ', value: 'exam_operations_officer' },
          ]"
        />
      </div>

      <!-- Main Content / Table -->
      <ExamManagementTable
        :exams="exams"
        :role="currentRole"
        :loading="isLoading"
        :pagination="pagination"
        @request="onRequest"
        @edit="handleEdit"
        @delete="handleDelete"
        @manageRegistrants="handleManageRegistrants"
        @printAdmitCard="handlePrintAdmitCard"
        @viewCandidates="handleViewCandidates"
        @exportReport="handleExportReport"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import ExamManagementTable from 'src/components/exam/exam-management-table.vue';
import SearchBar from 'src/components/shared/SearchBar.vue';
import { useExamStore } from 'src/stores/exam.store';
import type { Role, PaginationModel, TableRequestProps } from 'src/types/exam.types';

const $q = useQuasar();
const examStore = useExamStore();

// State
const isLoading = ref(false);
const currentRole = ref<Role>('staff');
const searchQuery = ref('');

const exams = computed(() => {
  const allExams = examStore.managementSchedules;
  if (!searchQuery.value) return allExams;

  const query = searchQuery.value.toLowerCase();
  return allExams.filter(
    (e) => e.examName.toLowerCase().includes(query) || e.examLocation.toLowerCase().includes(query),
  );
});

// Pagination State (Client-side initially since API returns all)
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

// Methods
const fetchData = async () => {
  isLoading.value = true;
  try {
    await examStore.loadManagementSchedules();
    pagination.value.rowsNumber = exams.value.length;
  } catch {
    $q.notify({ type: 'negative', message: 'เกิดข้อผิดพลาดในการโหลดข้อมูล', position: 'top' });
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  // If API supported server-side pagination, we would pass these params
  // and fetch again. Since we fetch all, Quasar handles client-side slicing
  // if we sync the pagination object back.
};

// Actions Handlers
const handleEdit = (id: string) => {
  $q.notify({ type: 'info', message: `กำลังไปหน้าแก้ไขการสอบ ID: ${id}`, position: 'top' });
};

const handleDelete = async (id: string) => {
  // Since the dialog is now handled inside ExamManagementTable, we just execute deletion here
  try {
    isLoading.value = true;
    // Mock deletion for now as we don't have delete API in service yet
    // await examStore.deleteExamRound(id);
    $q.notify({ type: 'positive', message: `ลบการสอบ ID: ${id} สำเร็จ`, position: 'top' });
    await fetchData(); // Refresh data
  } catch {
    $q.notify({ type: 'negative', message: `ลบการสอบไม่สำเร็จ`, position: 'top' });
  } finally {
    isLoading.value = false;
  }
};

const handleManageRegistrants = (id: string) => {
  $q.notify({ type: 'info', message: `จัดการผู้สมัครสอบ ID: ${id}`, position: 'top' });
};

const handlePrintAdmitCard = (id: string) => {
  $q.notify({ type: 'info', message: `พิมพ์บัตรประจำตัวสอบ ID: ${id}`, position: 'top' });
};

const handleViewCandidates = (id: string) => {
  $q.notify({ type: 'info', message: `ดูรายชื่อผู้เข้าสอบ ID: ${id}`, position: 'top' });
};

const handleExportReport = (id: string) => {
  $q.notify({ type: 'info', message: `ส่งออกรายงานการสอบ ID: ${id}`, position: 'top' });
};

// Initial load
onMounted(() => {
  void fetchData();
});
</script>

<style scoped lang="scss">
.text-primary {
  color: var(--primary) !important;
}
</style>
