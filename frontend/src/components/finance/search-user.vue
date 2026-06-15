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
    <q-dialog v-model="isDialogOpen" persistent>
      <q-card class="search-user-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-lg header-row">
          <div class="dialog-title">
            {{ t('admin.searchUser.dialogTitle') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup class="close-btn" />
        </div>

        <!-- Filter Fields -->
        <div class="dialog-fields">
          <!-- Ref 1 -->
          <div class="row items-center field-row">
            <div class="col-4 text-left field-label">
              {{ t('admin.searchUser.table.applicantId') }}
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
                :error="errors.ref1"
                :error-message="t('profile.required')"
                no-error-icon
                hide-bottom-space
                @update:model-value="errors.ref1 = false"
              />
            </div>
          </div>

          <!-- Ref 2 -->
          <div class="row items-center field-row">
            <div class="col-4 text-left field-label">
              {{ t('admin.searchUser.table.referenceNo') }}
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
                :error="errors.ref2"
                :error-message="t('profile.required')"
                no-error-icon
                hide-bottom-space
                @update:model-value="errors.ref2 = false"
              />
            </div>
          </div>

          <!-- Applicant Name -->
          <div class="row items-center field-row">
            <div class="col-4 text-left field-label">
              {{ t('admin.searchUser.table.fullName') }}
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
                :error="errors.name"
                :error-message="t('profile.required')"
                no-error-icon
                hide-bottom-space
                @update:model-value="errors.name = false"
              />
            </div>
          </div>
        </div>

        <!-- Search Action Button -->
        <div class="row justify-end button-row">
          <div class="col-8 row justify-end">
            <q-btn
              :label="t('admin.searchUser.searchBtn')"
              unelevated
              class="btn-dialog-search text-weight-bold"
              @click="handleSearch"
              :loading="isLoading"
            />
          </div>
        </div>

        <!-- Table Area -->
        <SearchUserTable :rows="rows" :loading="isLoading" />
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import SearchUserTable from './search-user-table.vue';
import { fetchAllEnrollments } from 'src/services/enrollment.service';
import { PAYMENT_STATUS_LABELS } from 'src/types/enrollment.types';
import type { SearchRow } from 'src/types/exam.types';

const { t } = useI18n();
const $q = useQuasar();

const isDialogOpen = ref(false);
const isLoading = ref(false);
const rows = ref<SearchRow[]>([]);

const searchForm = ref({
  ref1: '',
  ref2: '',
  name: '',
});

const errors = ref({
  ref1: false,
  ref2: false,
  name: false,
});

const openDialog = () => {
  isDialogOpen.value = true;
  // Reset form, rows, and errors on open
  searchForm.value = { ref1: '', ref2: '', name: '' };
  rows.value = [];
  errors.value = { ref1: false, ref2: false, name: false };
};

const handleSearch = async () => {
  const ref1Query = searchForm.value.ref1.trim();
  const ref2Query = searchForm.value.ref2.trim();
  const nameQuery = searchForm.value.name.trim();

  // Reset errors
  errors.value = { ref1: false, ref2: false, name: false };

  if (!ref1Query && !ref2Query && !nameQuery) {
    errors.value = {
      ref1: true,
      ref2: true,
      name: true,
    };
    return;
  }

  isLoading.value = true;
  try {
    const nameQueryLower = nameQuery.toLowerCase();
    const enrollments = await fetchAllEnrollments();

    const filtered = enrollments.filter((e) => {
      const matchesRef1 = ref1Query
        ? e.USER?.USER_NATIONAL_ID?.includes(ref1Query) || String(e.ERM_ID).includes(ref1Query)
        : true;
      const matchesRef2 = ref2Query ? String(e.ERM_ID).includes(ref2Query) : true;
      const matchesName = nameQueryLower
        ? e.USER?.PROFILE?.userFullnameTh?.toLowerCase().includes(nameQueryLower) ||
          e.USER?.PROFILE?.userFullnameEn?.toLowerCase().includes(nameQueryLower)
        : true;

      return matchesRef1 && matchesRef2 && matchesName;
    });

    if (filtered.length === 0) {
      $q.dialog({
        title: t('admin.searchUser.dialogTitle'),
        message: t('admin.searchUser.validation.notFound'),
        persistent: true,
        ok: {
          label: t('profile.dialogClose') || 'ตกลง',
          color: 'primary',
          unelevated: true,
        },
      });
      rows.value = [];
      return;
    }

    rows.value = filtered.map((e, index) => ({
      id: index + 1,
      ref1: e.USER?.USER_NATIONAL_ID || String(e.ERM_ID),
      ref2: String(e.ERM_ID),
      name: e.USER?.PROFILE?.userFullnameTh || e.USER?.PROFILE?.userFullnameEn || '-',
      amount: e.SESSION?.EXAM?.EXAM_FEE ? String(e.SESSION.EXAM.EXAM_FEE) : '500.00',
      exam_name: e.SESSION?.EXAM?.EXAM_ROUND
        ? `${e.SESSION.EXAM.EXAM_NAME} ${e.SESSION.EXAM.EXAM_ROUND}`
        : e.SESSION?.EXAM?.EXAM_NAME || '-',
      payment_status: PAYMENT_STATUS_LABELS[e.ERM_STATUS] || 'ไม่ระบุ',
    }));
  } catch (err) {
    console.error('Failed to search users:', err);
  } finally {
    isLoading.value = false;
  }
};
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
  width: 960px;
  max-width: 95vw;
  border-radius: 20px;
  padding: 40px 48px;
  box-shadow: var(--shadow-lg);
  overflow-x: hidden;
  background-color: var(--surface-card);
}

.header-row {
  margin-bottom: 24px;
}

.dialog-title {
  color: var(--label-color);
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  color: var(--neutral-400);
  font-size: 1.25rem;
}

.dialog-fields {
  font-size: 0.95rem;
}

.field-row {
  margin-bottom: 20px;
}

.field-label {
  color: var(--label-color);
  font-size: 16px;
  font-weight: 500;
}

.input-rounded {
  :deep(.q-field__control) {
    border-radius: 16px !important;
    background-color: var(--surface-card);
    border: 1px solid var(--neutral-200) !important;
    height: 48px;
    min-height: 48px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:before {
      border: none !important;
    }

    &:after {
      border: none !important;
    }

    &:hover {
      border-color: var(--primary) !important;
    }
  }

  &.q-field--error {
    :deep(.q-field__control) {
      border-color: var(--negative) !important;

      &:hover {
        border-color: var(--negative) !important;
      }
    }
  }

  :deep(.q-field__control-container) {
    padding-top: 0 !important;
  }

  :deep(.q-field__native) {
    padding: 0 16px;
    font-size: 15px;
    align-items: center;
  }
}

.button-row {
  margin-top: 0;
  margin-bottom: 20px;
}

.btn-dialog-search {
  background-color: var(--primary) !important;
  color: white !important;
  width: 200px;
  height: 52px;
  border-radius: 8px !important;
  text-transform: none;
  font-size: 18px;
  font-weight: 600;

  &:hover {
    background-color: var(--primary-dark) !important;
  }
}
</style>
