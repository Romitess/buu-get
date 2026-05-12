<template>
  <q-page class="q-px-xl q-pt-md q-pb-lg flex column items-center" style="min-height: 0 !important">
    <div class="full-width" style="max-width: 1200px">
      <!-- Header Section -->
      <div class="q-mb-md">
        <div class="text-h5 text-weight-bold" style="color: var(--primary-dark)">
          จัดการรายชื่อผู้เข้าสอบ
        </div>
        <div class="text-subtitle2 text-grey-7">
          จัดการรายชื่อผู้เข้าสอบ พร้อมตรวจสอบข้อมูล การสมัคร และสถานะการเข้าสอบ
        </div>
      </div>

      <!-- TODO: Time-slot tabs (รอ component จากเพื่อน) -->
      <!-- TODO: Exam info card + สถิติ (รอ component จากเพื่อน) -->

      <!-- Search Bar + Export -->
      <div class="row items-center q-mb-md q-gutter-x-md">
        <SearchBar v-model="searchQuery" />
        <q-space />
        <AppButton icon="download" label="EXPORT TO CSV" />
      </div>

      <!-- Registrants Table -->
      <BaseTable
        :columns="columns"
        :rows="filteredEnrollments"
        :loading="isLoading"
        :pagination="pagination"
        @request="onRequest"
      >
        <!-- ลำดับ Column -->
        <template v-slot:body-cell-index="{ row }">
          <div class="text-center">{{ row.index }}</div>
        </template>

        <!-- เลขประจำตัว Column -->
        <template v-slot:body-cell-nationalId="{ row }">
          <div class="text-center">{{ row.nationalId }}</div>
        </template>

        <!-- คำนำหน้า Column -->
        <template v-slot:body-cell-titleTh="{ row }">
          <div class="text-center">{{ row.titleTh }}</div>
        </template>

        <!-- ชื่อ-นามสกุล Column -->
        <template v-slot:body-cell-fullnameTh="{ row }">
          <div>{{ row.fullnameTh }}</div>
        </template>

        <!-- สถานะ (Payment Status) Column -->
        <template v-slot:body-cell-paymentStatus="{ row }">
          <div class="text-center">
            <EnrollmentStatusBadge :status="row.paymentStatus" type="payment" />
          </div>
        </template>

        <!-- สถานะความถูกต้อง (Verify Status) Column -->
        <template v-slot:body-cell-verifyStatus="{ row }">
          <div class="text-center">
            <EnrollmentStatusBadge :status="row.verifyStatus" type="verify" />
          </div>
        </template>

        <!-- เครื่องมือ Column -->
        <template v-slot:body-cell-tools="{ row }">
          <div class="row justify-center q-gutter-x-sm no-wrap">
            <ActionButton
              icon="visibility"
              tooltip="ดูรายละเอียด"
              :disable="false"
              color="black"
              @click="handleView(row.ermId)"
            />
          </div>
        </template>
      </BaseTable>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/BaseTable.vue';
import ActionButton from 'src/components/shared/ActionButton.vue';
import AppButton from 'src/components/base/app-button.vue';
import EnrollmentStatusBadge from 'src/components/shared/EnrollmentStatusBadge.vue';
import SearchBar from 'src/components/shared/SearchBar.vue';
import { useExamRegistrants } from 'src/composables/use-exam-registrants';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

const route = useRoute();

const { isLoading, searchQuery, filteredEnrollments, fetchEnrollments } = useExamRegistrants();

// Pagination
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

// Table columns
const columns: QTableColumn[] = [
  { name: 'index', label: 'ลำดับ', field: 'index', align: 'center', style: 'width: 60px' },
  { name: 'nationalId', label: 'เลขประจำตัว', field: 'nationalId', align: 'center' },
  { name: 'titleTh', label: 'คำนำหน้า', field: 'titleTh', align: 'center' },
  { name: 'fullnameTh', label: 'ชื่อ-นามสกุล', field: 'fullnameTh', align: 'left' },
  { name: 'paymentStatus', label: 'สถานะ', field: 'paymentStatus', align: 'center' },
  { name: 'verifyStatus', label: 'สถานะความถูกต้อง', field: 'verifyStatus', align: 'center' },
  { name: 'tools', label: 'เครื่องมือ', field: 'tools', align: 'center', style: 'width: 80px' },
];

// Handlers
const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const handleView = (ermId: number): void => {
  // TODO: Navigate to enrollment detail page (future feature)
  console.log('View enrollment:', ermId);
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchEnrollments(examId);
    pagination.value.rowsNumber = filteredEnrollments.value.length;
  }
};

// Watch filteredEnrollments to update pagination rowsNumber
watch(filteredEnrollments, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

onMounted(() => {
  void loadData();
});
</script>
