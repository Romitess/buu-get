<template>
  <div>
    <!-- Button Trigger -->
    <q-btn
      :label="t('admin.searchUser.triggerLabel')"
      unelevated
      class="btn-search-trigger"
      @click="openDialog"
    />

    <!-- Dialog -->
    <q-dialog v-model="isDialogOpen" persistent max-width="90vw">
      <q-card class="search-user-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">
            {{ t('admin.searchUser.dialogTitle') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6" />
        </div>

        <!-- Filter Fields -->
        <div class="q-gutter-y-sm q-mb-md dialog-fields">
          <!-- Ref 1 -->
          <div class="row items-center field-row">
            <div class="col-4 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.applicantId') }}
            </div>
            <div class="col-8">
              <q-input
                v-model="searchForm.ref1"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.searchUser.placeholderRef1')"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <!-- Ref 2 -->
          <div class="row items-center field-row">
            <div class="col-4 text-right q-pr-lg field-label">
              {{ t('admin.paymentImport.table.referenceNo') }}
            </div>
            <div class="col-8">
              <q-input
                v-model="searchForm.ref2"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.searchUser.placeholderRef2')"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <!-- Applicant Name -->
          <div class="row items-center field-row">
            <div class="col-4 text-right q-pr-lg field-label">
              {{ t('admin.registrantManagement.table.columns.fullName') }}
            </div>
            <div class="col-8">
              <q-input
                v-model="searchForm.name"
                outlined
                dense
                bg-color="white"
                class="input-rounded"
                :placeholder="t('admin.searchUser.placeholderName')"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
        </div>

        <!-- Search Action Button -->
        <div class="row justify-end q-mb-lg">
          <q-btn
            :label="t('admin.searchUser.searchBtn')"
            unelevated
            class="btn-dialog-search text-weight-bold"
            @click="handleSearch"
            :loading="isLoading"
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
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import { fetchAllEnrollments } from 'src/services/enrollment.service';
import { PAYMENT_STATUS_LABELS } from 'src/types/enrollment.types';
import type { SearchRow } from 'src/types/exam.types';

const { t } = useI18n();

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

const handleSearch = async () => {
  isLoading.value = true;
  try {
    const ref1Query = searchForm.value.ref1.trim();
    const ref2Query = searchForm.value.ref2.trim();
    const nameQuery = searchForm.value.name.trim().toLowerCase();

    const enrollments = await fetchAllEnrollments();

    const filtered = enrollments.filter((e) => {
      const matchesRef1 = ref1Query
        ? e.USER?.USER_NATIONAL_ID?.includes(ref1Query) || String(e.ERM_ID).includes(ref1Query)
        : true;
      const matchesRef2 = ref2Query ? String(e.ERM_ID).includes(ref2Query) : true;
      const matchesName = nameQuery
        ? e.USER?.PROFILE?.userFullnameTh?.toLowerCase().includes(nameQuery) ||
          e.USER?.PROFILE?.userFullnameEn?.toLowerCase().includes(nameQuery)
        : true;

      return matchesRef1 && matchesRef2 && matchesName;
    });

    rows.value = filtered.map((e, index) => ({
      id: index + 1,
      ref1: e.USER?.USER_NATIONAL_ID || String(e.ERM_ID),
      ref2: String(e.ERM_ID),
      name: e.USER?.PROFILE?.userFullnameTh || e.USER?.PROFILE?.userFullnameEn || '-',
      amount: e.SESSION?.EXAM?.EXAM_FEE ? String(e.SESSION.EXAM.EXAM_FEE) : '500.00',
      exam_name: e.SESSION?.EXAM?.EXAM_NAME || '-',
      payment_status: PAYMENT_STATUS_LABELS[e.ERM_STATUS] || 'ไม่ระบุ',
    }));
  } catch (err) {
    console.error('Failed to search users:', err);
  } finally {
    isLoading.value = false;
  }
};

const columns = computed<QTableColumn[]>(() => [
  { name: 'id', field: 'id', label: t('admin.searchUser.table.index'), align: 'center' },
  { name: 'ref1', field: 'ref1', label: t('admin.searchUser.table.applicantId'), align: 'center' },
  { name: 'ref2', field: 'ref2', label: t('admin.searchUser.table.referenceNo'), align: 'center' },
  { name: 'name', field: 'name', label: t('admin.searchUser.table.fullName'), align: 'left' },
  { name: 'amount', field: 'amount', label: t('admin.searchUser.table.amount'), align: 'center' },
  {
    name: 'exam_name',
    field: 'exam_name',
    label: t('admin.searchUser.table.examName'),
    align: 'left',
  },
  {
    name: 'payment_status',
    field: 'payment_status',
    label: t('admin.searchUser.table.status'),
    align: 'center',
  },
]);
</script>

<style scoped lang="scss">
.btn-search-trigger {
  background-color: var(--primary) !important;
  color: white !important;
  border-radius: var(--radius-sm);
  height: 40px;
  padding: 0 20px;
  text-transform: none;
  font-size: 0.95rem;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}

.search-user-dialog-card {
  width: 900px;
  max-width: 95vw;
  border-radius: var(--radius-lg);
  padding: 32px 40px;
  box-shadow: var(--shadow-lg);
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
    border-radius: var(--radius-10) !important;
    background-color: #fff;
    border: 1px solid var(--neutral-200) !important;

    &:before {
      border: none !important;
    }

    &:after {
      border: none !important;
    }
  }
}

.btn-dialog-search {
  background-color: var(--primary) !important;
  color: white !important;
  width: 180px;
  height: 44px;
  border-radius: var(--radius-sm);
  text-transform: none;
  font-size: 1rem;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}

.table-container {
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--neutral-200);
}
</style>
