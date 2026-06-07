<template>
  <q-page class="page-container exam-management-page">
    <!-- Standardized Reusable Page Header -->
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('navigation.manageExam')"
      :subtitle="t('admin.examManagement.description')"
    />

    <!-- Search and Action Bar -->
    <div class="row items-center q-mb-lg q-gutter-x-md">
      <div class="col">
        <SearchBar v-model="searchQuery" />
      </div>
      <q-btn
        v-if="currentRole !== ROLES.REGISTRATION_OFFICER"
        color="primary"
        icon="add"
        label="สร้างรอบสอบ"
        unelevated
        class="create-exam-btn text-weight-bold"
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
      @manageScores="handleManageScores"
      @passcodeHistory="handlePasscodeHistory"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamManagementTable from 'src/components/exam/exam-management-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
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
const examsWithVerifyStatus = ref<ExamSchedule[]>([]);

// Derived Role for Table Tools
const currentRole = computed<Role>(() => {
  const role = userStore.userRole;
  if (role === ROLES.ADMIN) return ROLES.ADMIN;
  if (role === ROLES.REGISTRATION_OFFICER) return ROLES.REGISTRATION_OFFICER;
  if (role === ROLES.EXAM_OPERATIONS_OFFICER) return ROLES.EXAM_OPERATIONS_OFFICER;
  return ROLES.STAFF;
});

const exams = computed(() => {
  const allExams = examsWithVerifyStatus.value;
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
    examsWithVerifyStatus.value = examStore.managementSchedules;
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

const handleEdit = (id: string) => {
  void router.push({ name: 'admin-edit-exam', params: { examId: id } });
};

const handlePasscodeHistory = (id: string) => {
  void router.push({ name: 'admin-passcode-history', query: { examId: id } });
};

const handleDelete = async (id: string) => {
  try {
    isLoading.value = true;
    await examStore.deleteExamRound(id);
    await fetchData();
    $q.notify({
      type: 'positive',
      message: t('admin.examManagement.notifications.deleteSuccess') || 'ลบการสอบสำเร็จ',
      position: 'top',
    });
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
  void router.push({ name: 'admin-exam-attendance', params: { examId: id } });
};

const handleManageScores = (id: string) => {
  void router.push({ name: 'admin-exam-scores', params: { examId: id } });
};

// Initial load
onMounted(() => {
  void fetchData();
});
</script>

<style scoped lang="scss">
.create-exam-btn {
  border-radius: var(--radius-10) !important;
  height: 40px;
  padding: 0 24px;
}

.text-primary {
  color: var(--primary) !important;
}
</style>
