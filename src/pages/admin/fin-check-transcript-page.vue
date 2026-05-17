<template>
  <q-page class="q-pa-md">
    <!-- Breadcrumbs -->
    <app-breadcrumbs />

    <!-- Page Header -->
    <app-page-header title="ตรวจสอบข้อมูลการชำระเงิน" />

    <!-- Search and Filters Area -->
    <div class="row q-mb-md items-center justify-between">
      <div class="col-12 col-sm-5">
        <search-bar
          v-model="searchQuery"
          placeholder="ค้นหาชื่อผู้จ่ายเงิน, ชื่อผู้สมัคร หรือรหัสอ้างอิง..."
          class="full-width"
        />
      </div>
    </div>

    <!-- Table Card -->
    <q-card flat bordered class="q-mt-sm">
      <q-card-section class="q-pa-none">
        <base-table :rows="filteredRows" :columns="columns" :loading="false" row-key="id">
          <!-- Custom Header matching the design in the image -->
          <template #header="props">
            <q-tr :props="props">
              <q-th rowspan="2">ลำดับ</q-th>
              <q-th colspan="6">ไฟล์จ่ายเงิน</q-th>
              <q-th colspan="4">ฐานข้อมูล</q-th>
              <q-th rowspan="2">เครื่องมือ</q-th>
            </q-tr>
            <q-tr :props="props">
              <q-th>วันที่จ่ายเงิน</q-th>
              <q-th>เวลาจ่ายเงิน</q-th>
              <q-th>รหัสประจำตัวผู้สมัคร (Ref 1)</q-th>
              <q-th>เลขอ้างอิงการสมัคร (Ref 2)</q-th>
              <q-th>ผู้ชำระเงิน</q-th>
              <q-th>จำนวนเงิน</q-th>
              <q-th>รหัสประจำตัวผู้สมัคร (Ref 1)</q-th>
              <q-th>เลขอ้างอิงการสมัคร (Ref 2)</q-th>
              <q-th>ชื่อผู้สมัคร</q-th>
              <q-th>จำนวนเงิน</q-th>
            </q-tr>
          </template>

          <!-- Custom Body Rows to match custom colspan layout -->
          <template #body="props">
            <q-tr :props="props">
              <!-- Index -->
              <q-td class="text-center">{{ props.row.id }}</q-td>

              <!-- Payment File Columns -->
              <q-td class="text-center">{{ props.row.file_payment_date }}</q-td>
              <q-td class="text-center">{{ props.row.file_payment_time }}</q-td>
              <q-td class="text-center">{{ props.row.file_ref }}</q-td>
              <q-td class="text-center">{{ props.row.file_ref2 }}</q-td>
              <q-td>{{ props.row.file_payer }}</q-td>
              <q-td class="text-center">{{ props.row.file_amount }}</q-td>

              <!-- Database Columns -->
              <template v-if="props.row.db_ref">
                <q-td class="text-center">{{ props.row.db_ref }}</q-td>
                <q-td class="text-center">{{ props.row.db_ref2 }}</q-td>
                <q-td>{{ props.row.db_name }}</q-td>
                <q-td class="text-center">{{ props.row.db_amount }}</q-td>
              </template>
              <template v-else>
                <q-td class="text-center">-</q-td>
                <q-td class="text-center">-</q-td>
                <q-td class="text-center text-grey-5">ไม่พบข้อมูล</q-td>
                <q-td class="text-center text-grey-5">-</q-td>
              </template>

              <!-- Actions Column -->
              <q-td class="text-center">
                <div class="row justify-center">
                  <action-button
                    icon="edit"
                    @click="handleEdit(props.row)"
                    v-if="!props.row.db_ref"
                    tooltip="แก้ไข/จับคู่ข้อมูล"
                  />
                  <span v-else class="text-grey-6">-</span>
                </div>
              </q-td>
            </q-tr>
          </template>
        </base-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';

interface PaymentRow {
  id: number;
  file_payment_date: string;
  file_payment_time: string;
  file_ref: string;
  file_ref2: string;
  file_payer: string;
  file_amount: string;
  db_ref: string;
  db_ref2: string;
  db_name: string;
  db_amount: string;
}

const searchQuery = ref('');

// Mock data based on the provided image
const mockRows = ref<PaymentRow[]>([
  {
    id: 1,
    file_payment_date: '01-05-2569',
    file_payment_time: '14:05:06',
    file_ref: '66100002',
    file_ref2: '6751300100001',
    file_payer: 'นาย สมดรีม ใจดี',
    file_amount: '500.00',
    db_ref: '',
    db_ref2: '',
    db_name: '',
    db_amount: '',
  },
  {
    id: 2,
    file_payment_date: '01-05-2569',
    file_payment_time: '14:25:16',
    file_ref: '66100002',
    file_ref2: '6751300100002',
    file_payer: 'นาย สมทบ ใจดี',
    file_amount: '500.00',
    db_ref: '66100002',
    db_ref2: '6751300100002',
    db_name: 'สมทบ ใจดี',
    db_amount: '500.00',
  },
  {
    id: 3,
    file_payment_date: '01-05-2569',
    file_payment_time: '14:25:48',
    file_ref: '66100003',
    file_ref2: '6751300100003',
    file_payer: 'นาย สมวิว ใจดี',
    file_amount: '500.00',
    db_ref: '66100003',
    db_ref2: '6751300100003',
    db_name: 'สมวิว ใจดี',
    db_amount: '500.00',
  },
  {
    id: 4,
    file_payment_date: '01-05-2569',
    file_payment_time: '14:36:57',
    file_ref: '66100004',
    file_ref2: '6751300100004',
    file_payer: 'น.ส. สมอั้น ใจดี',
    file_amount: '500.00',
    db_ref: '66100004',
    db_ref2: '6751300100004',
    db_name: 'สมอั้น ใจดี',
    db_amount: '500.00',
  },
  {
    id: 5,
    file_payment_date: '01-05-2569',
    file_payment_time: '14:47:05',
    file_ref: '66100005',
    file_ref2: '6751300100005',
    file_payer: 'น.ส. สมหยก ใจดี',
    file_amount: '500.00',
    db_ref: '66100005',
    db_ref2: '6751300100005',
    db_name: 'สมหยก ใจดี',
    db_amount: '500.00',
  },
  {
    id: 6,
    file_payment_date: '01-05-2569',
    file_payment_time: '15:00:01',
    file_ref: '66100006',
    file_ref2: '6751300100006',
    file_payer: 'น.ส. สมฟ้า ใจดี',
    file_amount: '500.00',
    db_ref: '66100006',
    db_ref2: '6751300100006',
    db_name: 'สมฟ้า ใจดี',
    db_amount: '500.00',
  },
  {
    id: 7,
    file_payment_date: '01-05-2569',
    file_payment_time: '15:06:17',
    file_ref: '66100007',
    file_ref2: '6751300100007',
    file_payer: 'น.ส. สมบุ๊ค ใจดี',
    file_amount: '500.00',
    db_ref: '66100007',
    db_ref2: '6751300100007',
    db_name: 'สมบุ๊ค ใจดี',
    db_amount: '500.00',
  },
]);

// Filtered rows based on the search query
const filteredRows = computed(() => {
  if (!searchQuery.value) return mockRows.value;
  const query = searchQuery.value.trim().toLowerCase();
  return mockRows.value.filter((row) => {
    return (
      row.file_payer.toLowerCase().includes(query) ||
      row.file_ref.includes(query) ||
      row.file_ref2.includes(query) ||
      row.db_name.toLowerCase().includes(query) ||
      row.db_ref.includes(query) ||
      row.db_ref2.includes(query)
    );
  });
});

const columns: QTableColumn[] = [
  { name: 'id', field: 'id', label: 'ลำดับ', align: 'center' },
  {
    name: 'file_payment_date',
    field: 'file_payment_date',
    label: 'วันที่จ่ายเงิน',
    align: 'center',
  },
  { name: 'file_payment_time', field: 'file_payment_time', label: 'เวลาจ่ายเงิน', align: 'center' },
  { name: 'file_ref', field: 'file_ref', label: 'รหัสประจำตัวผู้สมัคร (Ref 1)', align: 'center' },
  { name: 'file_ref2', field: 'file_ref2', label: 'เลขอ้างอิงการสมัคร (Ref 2)', align: 'center' },
  { name: 'file_payer', field: 'file_payer', label: 'ผู้ชำระเงิน', align: 'left' },
  { name: 'file_amount', field: 'file_amount', label: 'จำนวนเงิน', align: 'center' },
  { name: 'db_ref', field: 'db_ref', label: 'รหัสประจำตัวผู้สมัคร (Ref 1)', align: 'center' },
  { name: 'db_ref2', field: 'db_ref2', label: 'เลขอ้างอิงการสมัคร (Ref 2)', align: 'center' },
  { name: 'db_name', field: 'db_name', label: 'ชื่อผู้สมัคร', align: 'left' },
  { name: 'db_amount', field: 'db_amount', label: 'จำนวนเงิน', align: 'center' },
  { name: 'actions', field: 'actions', label: 'เครื่องมือ', align: 'center' },
];

const handleEdit = (row: PaymentRow) => {
  console.log('Edit action triggered for row:', row);
};
</script>

<style scoped lang="scss">
/* Table design matches the sleek visual style guidelines */
</style>
