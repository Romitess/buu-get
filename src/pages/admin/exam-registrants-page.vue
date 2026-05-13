<template>
  <q-page class="q-px-xl q-pt-md q-pb-lg flex column items-center" style="min-height: 0 !important">
    <div class="full-width" style="max-width: 1200px">
      <div class="q-mb-md">
        <div class="text-h5 text-weight-bold text-dark">จัดการรายชื่อผู้เข้าสอบ</div>
        <div class="text-subtitle2 text-grey-7">
          จัดการรายชื่อผู้เข้าสอบ พร้อมตรวจสอบข้อมูล การสมัคร และสถานะการเข้าสอบ
        </div>
      </div>

      <div class="row items-center q-mb-md q-gutter-x-md">
        <SearchBar v-model="searchQuery" />
        <q-space />
        <ExportCsvButton
          :columns="columns"
          :rows="filteredEnrollments"
          file-name-prefix="exam-registrants"
        />
      </div>

      <BaseTable
        :columns="columns"
        :rows="filteredEnrollments"
        :loading="isLoading"
        :pagination="pagination"
        @request="onRequest"
      >
        <template v-slot:body-cell-index="{ row }">
          <div class="text-center">{{ row.index }}</div>
        </template>

        <template v-slot:body-cell-nationalId="{ row }">
          <div class="text-center">{{ row.nationalId }}</div>
        </template>

        <template v-slot:body-cell-titleTh="{ row }">
          <div class="text-center">{{ row.titleTh }}</div>
        </template>

        <template v-slot:body-cell-fullnameTh="{ row }">
          <div>{{ row.fullnameTh }}</div>
        </template>

        <template v-slot:body-cell-paymentStatus="{ row }">
          <div class="text-center">
            <EnrollmentStatusBadge :status="row.paymentStatus" type="payment" />
          </div>
        </template>

        <template v-slot:body-cell-verifyStatus="{ row }">
          <div class="text-center">
            <EnrollmentStatusBadge :status="row.verifyStatus" type="verify" />
          </div>
        </template>

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
import { useRoute, useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/BaseTable.vue';
import ActionButton from 'src/components/shared/ActionButton.vue';
import EnrollmentStatusBadge from 'src/components/shared/EnrollmentStatusBadge.vue';
import SearchBar from 'src/components/shared/SearchBar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import { useExamRegistrants } from 'src/composables/use-exam-registrants';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { PAYMENT_STATUS_LABELS, VERIFY_STATUS_LABELS } from 'src/types/enrollment.types';

const route = useRoute();
const router = useRouter();

const { isLoading, searchQuery, filteredEnrollments, fetchEnrollments } = useExamRegistrants();

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableColumn[] = [
  { name: 'index', label: 'ลำดับ', field: 'index', align: 'center', style: 'width: 60px' },
  { name: 'nationalId', label: 'เลขประจำตัว', field: 'nationalId', align: 'center' },
  { name: 'titleTh', label: 'คำนำหน้า', field: 'titleTh', align: 'center' },
  { name: 'fullnameTh', label: 'ชื่อ-นามสกุล', field: 'fullnameTh', align: 'left' },
  {
    name: 'paymentStatus',
    label: 'สถานะ',
    field: 'paymentStatus',
    align: 'center',
    format: (val: number) => PAYMENT_STATUS_LABELS[val] || '-',
  },
  {
    name: 'verifyStatus',
    label: 'สถานะความถูกต้อง',
    field: 'verifyStatus',
    align: 'center',
    format: (val: number) => VERIFY_STATUS_LABELS[val] || '-',
  },
  { name: 'tools', label: 'เครื่องมือ', field: 'tools', align: 'center', style: 'width: 80px' },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const handleView = (ermId: number): void => {
  void router.push({
    name: 'admin-exam-registrant-detail',
    params: { ermId },
  });
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchEnrollments(examId);
    pagination.value.rowsNumber = filteredEnrollments.value.length;
  }
};

watch(filteredEnrollments, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.text-dark {
  color: #212121 !important;
}
</style>
