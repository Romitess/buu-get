<template>
  <q-page class="page-container exam-management-page">
    <!-- Standardized Reusable Page Header -->
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('navigation.manageExams')"
      :subtitle="t('admin.examManagement.pageDescription')"
    />

    <!-- Search and Action Bar -->
    <div class="row items-center q-mb-lg q-gutter-x-md">
      <div class="col">
        <SearchBar v-model="searchQuery" />
      </div>
      <q-btn
        v-if="currentRole !== ROLES.EXAM_OPERATIONS_OFFICER"
        color="primary"
        icon="add"
        :label="t('admin.examManagement.createExam')"
        unelevated
        class="create-exam-btn text-weight-bold"
        @click="$router.push('/admin/create-exam')"
      />
    </div>

    <q-banner v-if="error" class="bg-red-1 text-red-9 q-mb-md rounded-borders shadow-1">
      <template v-slot:avatar>
        <q-icon name="warning" color="negative" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn flat color="negative" :label="t('examSchedule.retry')" @click="fetchData" />
      </template>
    </q-banner>

    <!-- Main Content / Table -->
    <ExamManagementTable
      :exams="exams"
      :role="currentRole"
      :loading="isLoading"
      :pagination="pagination"
      is-server-side
      @request="onRequest"
      @edit="handleEdit"
      @delete="handleDelete"
      @manageRegistrants="handleManageRegistrants"
      @manageSeats="handleManageSeats"
      @printAdmitCard="handlePrintAdmitCard"
      @viewCandidates="handleViewCandidates"
      @viewScore="handleManageScores"
      @passcodeHistory="handlePasscodeHistory"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useQuasar, debounce } from 'quasar';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamManagementTable from 'src/components/exam/exam-management-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import { useUserStore } from 'src/stores/user.store';
import { useExamSeatNavigation } from 'src/composables/use-exam-seat-navigation';
import { fetchAdminExams, deleteExam, isRequestCanceled } from 'src/services/exam.service';
import { ROLES } from 'src/constants/roles';
import type { Role, PaginationModel, TableRequestProps, ExamSchedule } from 'src/types/exam.types';

const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();
const userStore = useUserStore();
const { navigateFromSeatAction } = useExamSeatNavigation();

const isLoading = ref(false);
const searchQuery = ref('');
const exams = ref<ExamSchedule[]>([]);
const error = ref<string | null>(null);
let abortController: AbortController | null = null;

const currentRole = computed<Role>(() => {
  const role = userStore.userRole;
  if (role === ROLES.ADMIN) return ROLES.ADMIN;
  if (role === ROLES.REGISTRATION_OFFICER) return ROLES.REGISTRATION_OFFICER;
  if (role === ROLES.EXAM_OPERATIONS_OFFICER) return ROLES.EXAM_OPERATIONS_OFFICER;
  return ROLES.STAFF;
});

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: null,
  descending: false,
});

const fetchData = async (): Promise<void> => {
  abortController?.abort();
  abortController = new AbortController();
  const { signal } = abortController;
  isLoading.value = true;
  error.value = null;
  try {
    const result = await fetchAdminExams({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: searchQuery.value,
      signal,
    });
    exams.value = result.data;
    pagination.value.rowsNumber = result.total;
  } catch (err) {
    if (isRequestCanceled(err) || signal.aborted) return;
    error.value = t('admin.examManagement.notifications.loadError');
  } finally {
    if (!signal.aborted) {
      isLoading.value = false;
    }
  }
};

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  void fetchData();
};

const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  void fetchData();
}, 400);

watch(searchQuery, () => {
  void debouncedSearch();
});

const handleEdit = (id: string) => {
  void router.push({ name: 'admin-edit-exam', params: { examId: id } });
};

const handlePasscodeHistory = (id: string) => {
  void router.push({ name: 'admin-passcode-history', query: { examId: id } });
};

const handleDelete = async (id: string) => {
  try {
    isLoading.value = true;
    await deleteExam(id);
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

const handleManageSeats = (id: string): void => {
  void navigateFromSeatAction(id);
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
