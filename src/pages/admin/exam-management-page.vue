<template>
  <q-page class="q-px-xl q-pt-md q-pb-lg flex column items-center" style="min-height: 0 !important">
    <div class="full-width" style="max-width: 1200px">
      <!-- Standardized Reusable Page Header -->
      <app-page-header
        :breadcrumbs="[{ label: 'หน้าหลัก', icon: 'home', to: '/' }, { label: 'จัดการรอบสอบ' }]"
        title="จัดการรอบสอบ"
        subtitle="จัดการข้อมูลรอบสอบ ตรวจสอบกำหนดการ และติดตามสถานะการเปิดรับสมัคร"
      />

      <!-- Search Bar -->
      <div class="q-mb-lg">
        <SearchBar v-model="searchQuery" />
      </div>

      <!-- Filters Section -->
      <div class="row justify-between items-center q-mb-md">
        <q-btn
          color="primary"
          icon="add"
          :label="$t('admin.examManagement.createExam')"
          unelevated
          class="text-weight-bold"
          style="border-radius: 8px"
          @click="$router.push('/admin/create-exam')"
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
        @manageSeats="handleManageSeats"
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
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import ExamManagementTable from 'src/components/exam/exam-management-table.vue';
import SearchBar from 'src/components/shared/SearchBar.vue';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import type { Role, PaginationModel, TableRequestProps, ExamSchedule } from 'src/types/exam.types';

const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();
const examStore = useExamStore();
const userStore = useUserStore();

// State
const isLoading = ref(false);
const searchQuery = ref('');

// Derived Role for Table Tools
const currentRole = computed<Role>(() => {
  const role = userStore.userRole;
  if (role === ROLES.ADMIN) return ROLES.ADMIN;
  if (role === ROLES.REGISTRATION_OFFICER) return ROLES.REGISTRATION_OFFICER;
  return ROLES.STAFF;
});

const exams = computed(() => {
  const allExams = examStore.managementSchedules;
  if (!searchQuery.value) return allExams;

  const query = searchQuery.value.toLowerCase();
  return allExams.filter(
    (e: ExamSchedule) =>
      e.examName.toLowerCase().includes(query) || e.examLocation.toLowerCase().includes(query),
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
    $q.notify({
      type: 'negative',
      message: t('admin.examManagement.notifications.loadError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

// Actions Handlers
const handleEdit = (id: string) => {
  $q.notify({
    type: 'info',
    message: `${t('admin.examManagement.notifications.editNav')} ID: ${id}`,
    position: 'top',
  });
};

const handleDelete = async (id: string) => {
  try {
    isLoading.value = true;
    $q.notify({ type: 'positive', message: `ลบการสอบ ID: ${id} สำเร็จ`, position: 'top' });
    await fetchData();
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.examManagement.notifications.deleteError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const handleManageRegistrants = (id: string) => {
  void router.push({ name: 'admin-exam-registrants', params: { examId: id } });
};

const handleManageSeats = (id: string) => {
  void router.push({ name: 'admin-exam-seat-management', params: { examId: id } });
};

const handlePrintAdmitCard = (id: string) => {
  $q.notify({
    type: 'info',
    message: `${t('admin.examManagement.notifications.printAdmitCard')} ID: ${id}`,
    position: 'top',
  });
};

const handleViewCandidates = (id: string) => {
  $q.notify({
    type: 'info',
    message: `${t('admin.examManagement.notifications.viewCandidates')} ID: ${id}`,
    position: 'top',
  });
};

const handleExportReport = (id: string) => {
  $q.notify({
    type: 'info',
    message: `${t('admin.examManagement.notifications.exportReport')} ID: ${id}`,
    position: 'top',
  });
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
