<template>
  <div>
    <!-- Button Trigger -->
    <q-btn
      label="ค้นหาข้อมูลผู้สมัคร"
      unelevated
      class="btn-search-trigger text-weight-bold"
      @click="openDialog"
    />

    <!-- Dialog -->
    <q-dialog v-model="isDialogOpen" persistent max-width="90vw">
      <q-card class="search-user-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">ค้นหาผู้สมัคร</div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6" />
        </div>

        <!-- Filter Fields -->
        <div class="q-gutter-y-sm q-mb-md dialog-fields">
          <!-- Ref 1 -->
          <div class="row items-center field-row">
            <div class="col-4 text-right q-pr-lg field-label">รหัสประจำตัวผู้สมัคร (Ref1)</div>
            <div class="col-8">
              <q-input
                v-model="searchForm.ref1"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                placeholder="กรอกรหัสประจำตัวผู้สมัคร (Ref1)"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <!-- Ref 2 -->
          <div class="row items-center field-row">
            <div class="col-4 text-right q-pr-lg field-label">เลขอ้างอิงการสมัคร (Ref2)</div>
            <div class="col-8">
              <q-input
                v-model="searchForm.ref2"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                placeholder="กรอกเลขอ้างอิงการสมัคร (Ref2)"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <!-- Applicant Name -->
          <div class="row items-center field-row">
            <div class="col-4 text-right q-pr-lg field-label">ชื่อผู้สมัคร</div>
            <div class="col-8">
              <q-input
                v-model="searchForm.name"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                placeholder="กรอกชื่อผู้สมัคร"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
        </div>

        <!-- Search Action Button -->
        <div class="row justify-end q-mb-lg">
          <q-btn
            label="ค้นหา"
            unelevated
            class="btn-dialog-search text-weight-bold"
            @click="handleSearch"
          />
        </div>

        <!-- Table Area -->
        <div class="table-container">
          <base-table
            :rows="rows"
            :columns="columns"
            :loading="isLoading"
            empty-label="No data available in table"
            row-key="id"
          />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';

interface SearchRow {
  id: number;
  ref1: string;
  ref2: string;
  name: string;
  amount: string;
  exam_name: string;
  payment_status: string;
}

const isDialogOpen = ref(false);
const isLoading = ref(false);
const rows = ref<SearchRow[]>([]);

const searchForm = ref({
  ref1: '',
  ref2: '',
  name: '',
});

const openDialog = () => {
  isDialogOpen.value = true;
  // Reset form and rows on open
  searchForm.value = { ref1: '', ref2: '', name: '' };
  rows.value = [];
};

// Dummy dataset to simulate search query
const dummyDataSet: SearchRow[] = [
  {
    id: 1,
    ref1: '66100002',
    ref2: '6751300100002',
    name: 'นาย สมทบ ใจดี',
    amount: '500.00',
    exam_name: 'BUU GET ครั้งที่ 1/2569',
    payment_status: 'ชำระเงินเสร็จสิ้น',
  },
  {
    id: 2,
    ref1: '66100003',
    ref2: '6751300100003',
    name: 'นาย สมวิว ใจดี',
    amount: '500.00',
    exam_name: 'BUU GET ครั้งที่ 1/2569',
    payment_status: 'ชำระเงินเสร็จสิ้น',
  },
  {
    id: 3,
    ref1: '66100004',
    ref2: '6751300100004',
    name: 'น.ส. สมอั้น ใจดี',
    amount: '500.00',
    exam_name: 'BUU GET ครั้งที่ 1/2569',
    payment_status: 'ชำระเงินเสร็จสิ้น',
  },
  {
    id: 4,
    ref1: '66100005',
    ref2: '6751300100005',
    name: 'น.ส. สมหยก ใจดี',
    amount: '500.00',
    exam_name: 'BUU GET ครั้งที่ 1/2569',
    payment_status: 'ชำระเงินเสร็จสิ้น',
  },
];

const handleSearch = () => {
  isLoading.value = true;

  // Simulate API delay
  setTimeout(() => {
    const ref1Query = searchForm.value.ref1.trim();
    const ref2Query = searchForm.value.ref2.trim();
    const nameQuery = searchForm.value.name.trim().toLowerCase();

    // If all fields are empty, show all results for demo convenience
    if (!ref1Query && !ref2Query && !nameQuery) {
      rows.value = dummyDataSet;
    } else {
      rows.value = dummyDataSet.filter((item) => {
        const matchesRef1 = ref1Query ? item.ref1.includes(ref1Query) : true;
        const matchesRef2 = ref2Query ? item.ref2.includes(ref2Query) : true;
        const matchesName = nameQuery ? item.name.toLowerCase().includes(nameQuery) : true;
        return matchesRef1 && matchesRef2 && matchesName;
      });
    }

    isLoading.value = false;
  }, 400);
};

const columns: QTableColumn[] = [
  { name: 'id', field: 'id', label: 'ลำดับ', align: 'center' },
  { name: 'ref1', field: 'ref1', label: 'รหัสประจำตัวผู้สมัคร (Ref1)', align: 'center' },
  { name: 'ref2', field: 'ref2', label: 'เลขอ้างอิงการสมัคร (Ref2)', align: 'center' },
  { name: 'name', field: 'name', label: 'ชื่อผู้สมัคร', align: 'left' },
  { name: 'amount', field: 'amount', label: 'จำนวนเงิน', align: 'center' },
  { name: 'exam_name', field: 'exam_name', label: 'ชื่อการสอบ', align: 'left' },
  { name: 'payment_status', field: 'payment_status', label: 'สถานะการชำระเงิน', align: 'center' },
];
</script>

<style scoped lang="scss">
.btn-search-trigger {
  background-color: #0e49b5 !important;
  color: white !important;
  border-radius: 8px;
  height: 40px;
  padding: 0 20px;
  text-transform: none;
  font-size: 0.95rem;

  &:hover {
    background-color: #0b3c95 !important;
  }
}

.search-user-dialog-card {
  width: 900px;
  max-width: 95vw;
  border-radius: 16px;
  padding: 32px 40px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  overflow-x: hidden;
}

.dialog-title {
  color: var(--text-primary);
  font-size: 1.25rem;
}

.dialog-fields {
  font-size: 0.95rem;
}

.field-row {
  margin-bottom: 12px;
}

.field-label {
  color: var(--text-primary);
  font-weight: 500;
}

.input-rounded {
  :deep(.q-field__control) {
    border-radius: 10px !important;
    background-color: #fff;
    border: 1px solid #e2e8f0;

    &:before {
      border: none !important;
    }

    &:after {
      border: none !important;
    }
  }
}

.btn-dialog-search {
  background-color: #0e49b5 !important;
  color: white !important;
  width: 180px;
  height: 44px;
  border-radius: 8px;
  text-transform: none;
  font-size: 1rem;

  &:hover {
    background-color: #0b3c95 !important;
  }
}

.table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
</style>
