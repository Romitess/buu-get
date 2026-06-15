<template>
  <q-page class="page-container fund-source-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.fundSourceManagement.pageTitle')"
      :subtitle="$t('admin.fundSourceManagement.pageDescription')"
    />

    <div class="row q-col-gutter-md items-center q-mb-lg">
      <div class="col-12 col-sm">
        <SearchBar v-model="searchQuery" />
      </div>
      <div class="col-12 col-sm-auto text-right">
        <AppButton
          icon="add"
          :label="$t('admin.fundSourceManagement.createFundSource')"
          color="primary"
          class="create-fund-source-btn text-weight-bold"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <BaseTable
      :columns="columns"
      :rows="filteredFundSources"
      :loading="isLoading"
      :pagination="pagination"
      @request="onRequest"
    >
      <template v-slot:body-cell-tools="{ row }">
        <div class="row justify-center q-gutter-x-sm no-wrap">
          <q-btn
            unelevated
            dense
            color="blue-2"
            text-color="grey-10"
            icon="edit"
            class="action-btn"
            @click="navigateToEdit(row.FS_ID)"
          >
            <q-tooltip class="bg-secondary text-white text-caption">
              {{ $t('admin.fundSourceManagement.table.tooltips.edit') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            unelevated
            dense
            color="negative"
            text-color="white"
            icon="delete"
            class="action-btn"
            @click="confirmDelete(row)"
          >
            <q-tooltip class="bg-negative text-white text-caption">
              {{ $t('admin.fundSourceManagement.table.tooltips.delete') }}
            </q-tooltip>
          </q-btn>
        </div>
      </template>

      <template #body-cell-faculty="{ value }">
        <div class="cell-inner-padding">{{ value }}</div>
      </template>
      <template #body-cell-name="{ value }">
        <div class="cell-inner-padding">{{ value }}</div>
      </template>
    </BaseTable>

    <q-dialog v-model="showCreateDialog" persistent>
      <q-card class="form-dialog-card">
        <q-card-section class="dialog-header row items-center no-wrap">
          <span class="dialog-title">{{ dialogTitle }}</span>
          <q-space />
          <q-btn
            icon="close"
            flat
            round
            dense
            color="grey-7"
            size="sm"
            @click="closeCreateDialog"
          />
        </q-card-section>

        <q-card-section class="dialog-body">
          <q-form @submit.prevent="handleCreateFundSource">
            <div class="dialog-fields">
              <div class="dialog-field-row">
                <label class="dialog-label">
                  {{ t('admin.fundSourceManagement.createDialog.labels.faculty') }}
                  <span class="required-star">*</span>
                </label>
                <q-input
                  outlined
                  v-model="createForm.FS_FACULTY"
                  :error="!!formErrors.FS_FACULTY"
                  :error-message="formErrors.FS_FACULTY"
                  class="dialog-input"
                  dense
                />
              </div>

              <div class="dialog-field-row">
                <label class="dialog-label">
                  {{ t('admin.fundSourceManagement.createDialog.labels.name') }}
                  <span class="required-star">*</span>
                </label>
                <q-input
                  outlined
                  v-model="createForm.FS_NAME"
                  :error="!!formErrors.FS_NAME"
                  :error-message="formErrors.FS_NAME"
                  class="dialog-input"
                  dense
                />
              </div>

              <div class="dialog-field-row">
                <label class="dialog-label">
                  {{ t('admin.fundSourceManagement.createDialog.labels.accountCode') }}
                  <span class="required-star">*</span>
                </label>
                <q-input
                  outlined
                  v-model="createForm.FS_ACCOUNT_CODE"
                  :error="!!formErrors.FS_ACCOUNT_CODE"
                  :error-message="formErrors.FS_ACCOUNT_CODE"
                  class="dialog-input"
                  dense
                />
              </div>

              <div class="dialog-field-row">
                <label class="dialog-label">
                  {{ t('admin.fundSourceManagement.createDialog.labels.status') }}
                </label>
                <q-option-group
                  v-model="createForm.FS_OPEN_STATUS"
                  type="radio"
                  inline
                  color="black"
                  class="status-radio-group"
                  :options="[
                    {
                      label: t('admin.fundSourceManagement.createDialog.status.open'),
                      value: true,
                    },
                    {
                      label: t('admin.fundSourceManagement.createDialog.status.closed'),
                      value: false,
                    },
                  ]"
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="center" class="dialog-actions">
          <q-btn
            unelevated
            class="dialog-btn-cancel text-weight-medium col"
            :label="t('admin.fundSourceManagement.createDialog.actions.cancel')"
            @click="closeCreateDialog"
          />
          <q-btn
            unelevated
            color="primary"
            class="dialog-btn-save text-weight-medium col"
            :label="saveButtonLabel"
            @click="handleCreateFundSource"
            :loading="isSaving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import AppButton from 'src/components/base/app-button.vue';
import type { FundSource } from 'src/types/finance.type';
import type { CreateFundSourcePayload } from 'src/services/finance.service';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import * as financeService from 'src/services/finance.service';

const $q = useQuasar();
const { t } = useI18n();

const isLoading = ref(false);
const searchQuery = ref('');
const fundSources = ref<FundSource[]>([]);

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const showCreateDialog = ref(false);
const isEditMode = ref(false);
const editingFundSourceId = ref<number | null>(null);
const isSaving = ref(false);
const createForm = ref<CreateFundSourcePayload>({
  FS_FACULTY: '',
  FS_ACCOUNT_CODE: '',
  FS_NAME: '',
  FS_OPEN_STATUS: true,
});
const formErrors = ref<Partial<Record<keyof CreateFundSourcePayload, string>>>({});

const dialogTitle = computed(() =>
  isEditMode.value
    ? t('admin.fundSourceManagement.editDialog.title')
    : t('admin.fundSourceManagement.createDialog.title'),
);
const saveButtonLabel = computed(() =>
  isEditMode.value
    ? t('admin.fundSourceManagement.editDialog.actions.save')
    : t('admin.fundSourceManagement.createDialog.actions.save'),
);

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.fundSourceManagement.table.columns.index'),
    field: 'index',
    align: 'center',
  },
  {
    name: 'faculty',
    label: t('admin.fundSourceManagement.table.columns.faculty'),
    field: 'FS_FACULTY',
    align: 'left',
    format: (val: string | null | undefined) => val || '-',
  },
  {
    name: 'accountCode',
    label: t('admin.fundSourceManagement.table.columns.accountCode'),
    field: 'FS_ACCOUNT_CODE',
    align: 'center',
    format: (val: string | null | undefined) => val || '-',
  },
  {
    name: 'name',
    label: t('admin.fundSourceManagement.table.columns.name'),
    field: 'FS_NAME',
    align: 'left',
    format: (val: string | null | undefined) => val || '-',
  },
  {
    name: 'status',
    label: t('admin.fundSourceManagement.table.columns.status'),
    field: 'FS_OPEN_STATUS',
    align: 'center',
    format: (val: boolean | null | undefined) =>
      val
        ? t('admin.fundSourceManagement.status.active')
        : t('admin.fundSourceManagement.status.inactive'),
  },
  {
    name: 'tools',
    label: t('admin.fundSourceManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 15%',
  },
]);

const fundSourcesWithComputedData = computed(() => {
  return fundSources.value.map((fundSource, idx) => ({
    ...fundSource,
    index: idx + 1,
    FS_OPEN_STATUS: fundSource.FS_OPEN_STATUS ?? false,
  }));
});

const filteredFundSources = computed(() => {
  const all = fundSourcesWithComputedData.value;
  if (!searchQuery.value) return all;
  const query = searchQuery.value.toLowerCase();
  return all.filter(
    (fundSource) =>
      fundSource.FS_FACULTY.toLowerCase().includes(query) ||
      fundSource.FS_ACCOUNT_CODE.toLowerCase().includes(query) ||
      fundSource.FS_NAME.toLowerCase().includes(query),
  );
});

const fetchData = async () => {
  isLoading.value = true;
  try {
    const data = await financeService.fetchFundSources();
    fundSources.value = data;
    pagination.value.rowsNumber = data.length;
  } catch {
    $q.notify({
      type: 'negative',
      message: t('admin.fundSourceManagement.notifications.loadError'),
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
};

const resetCreateForm = () => {
  isEditMode.value = false;
  editingFundSourceId.value = null;
  createForm.value = {
    FS_FACULTY: '',
    FS_ACCOUNT_CODE: '',
    FS_NAME: '',
    FS_OPEN_STATUS: true,
  };
  formErrors.value = {};
};

const openCreateDialog = () => {
  resetCreateForm();
  showCreateDialog.value = true;
};

const openEditDialog = (fundSource: FundSource) => {
  isEditMode.value = true;
  editingFundSourceId.value = fundSource.FS_ID;
  createForm.value = {
    FS_FACULTY: fundSource.FS_FACULTY,
    FS_ACCOUNT_CODE: fundSource.FS_ACCOUNT_CODE,
    FS_NAME: fundSource.FS_NAME,
    FS_OPEN_STATUS: fundSource.FS_OPEN_STATUS ?? true,
  };
  formErrors.value = {};
  showCreateDialog.value = true;
};

const closeCreateDialog = () => {
  showCreateDialog.value = false;
  resetCreateForm();
};

const validateCreateForm = (): boolean => {
  const errors: Partial<Record<keyof CreateFundSourcePayload, string>> = {};

  if (!createForm.value.FS_FACULTY?.trim()) {
    errors.FS_FACULTY = t('admin.fundSourceManagement.createDialog.validation.faculty');
  }
  if (!createForm.value.FS_NAME?.trim()) {
    errors.FS_NAME = t('admin.fundSourceManagement.createDialog.validation.name');
  }
  if (!createForm.value.FS_ACCOUNT_CODE?.trim()) {
    errors.FS_ACCOUNT_CODE = t('admin.fundSourceManagement.createDialog.validation.accountCode');
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleCreateFundSource = async () => {
  if (!validateCreateForm()) {
    return;
  }

  isSaving.value = true;
  try {
    if (isEditMode.value && editingFundSourceId.value !== null) {
      await financeService.updateFundSource(editingFundSourceId.value, createForm.value);
      $q.notify({
        type: 'positive',
        message: t('admin.fundSourceManagement.editDialog.notifications.updated'),
        position: 'top',
      });
    } else {
      await financeService.createFundSource(createForm.value);
      $q.notify({
        type: 'positive',
        message: t('admin.fundSourceManagement.createDialog.notifications.created'),
        position: 'top',
      });
    }

    await fetchData();
    closeCreateDialog();
  } catch {
    $q.notify({
      type: 'negative',
      message: isEditMode.value
        ? t('admin.fundSourceManagement.editDialog.notifications.updateError')
        : t('admin.fundSourceManagement.createDialog.notifications.createError'),
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};

const onRequest = (props: TableRequestProps) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const navigateToEdit = (id: number) => {
  const fundSource = fundSources.value.find((item) => item.FS_ID === id);
  if (fundSource) {
    openEditDialog(fundSource);
  }
};

const confirmDelete = (row: FundSource) => {
  $q.dialog({
    title: t('admin.fundSourceManagement.dialogs.deleteTitle'),
    message: t('admin.fundSourceManagement.dialogs.deleteMessage'),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      isLoading.value = true;
      try {
        await financeService.deleteFundSource(row.FS_ID);
        $q.notify({
          type: 'positive',
          message: t('admin.fundSourceManagement.notifications.deleteSuccess'),
          position: 'top',
        });
        await fetchData();
      } catch {
        $q.notify({
          type: 'negative',
          message: t('admin.fundSourceManagement.notifications.deleteError'),
          position: 'top',
        });
      } finally {
        isLoading.value = false;
      }
    })();
  });
};

onMounted(() => {
  void fetchData();
});
</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .page-container {
    width: 100% !important;
    min-width: 0 !important;
  }
}

.create-fund-source-btn,
.create-location-btn {
  border-radius: var(--radius-10) !important;
  height: 40px;
  padding: 0 24px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}
/* --- นำไปทับของเดิมในส่วนของ Dialog Styles --- */

.form-dialog-card {
  border-radius: 12px !important;
  width: min(560px, 95vw);
  max-width: 100%;
}

.dialog-header {
  padding: 24px 24px 16px 24px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
.dialog-body {
  padding: 0 24px 16px 24px;
}

.dialog-fields {
  display: flex;
  flex-direction: column;
  gap: 16px; /* เพิ่มระยะห่างระหว่างช่องนิดหน่อยให้ดูสบายตา */
}

.dialog-field-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-label {
  font-size: 15px; /* ปรับขนาดฟอนต์ label ให้ชัดขึ้น */
  font-weight: 500;
  color: var(--text-primary);
}

.required-star {
  color: var(--negative);
}

.dialog-input {
  :deep(.q-field__control) {
    border-radius: 8px; /* ปรับความโค้งให้ตรงกับภาพ */
  }
}

/* ปรับระยะห่างและสีของ Radio ให้ออกมาเหมือนต้นฉบับ */
.status-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
:deep(.q-radio__label) {
  font-size: 15px;
  color: var(--text-primary);
}

.cell-inner-padding {
  padding-left: var(--space-md);
}

.dialog-btn-cancel,
.dialog-btn-save {
  min-width: 0;
  flex: 1;
}

.dialog-btn-cancel {
  height: 44px;
  border-radius: 8px !important;
  background-color: var(--neutral-gray-light) !important;
  color: var(--text-primary) !important;
  font-size: 15px;
}

.dialog-btn-save {
  height: 44px;
  border-radius: 8px !important;
  font-size: 15px;
  background-color: var(--primary) !important;
}
</style>
