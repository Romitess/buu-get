<template>
  <q-page class="page-container score-rubric-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.scoreRubricManagement.pageTitle')"
      :subtitle="$t('admin.scoreRubricManagement.pageDescription')"
    />

    <div class="row q-col-gutter-md items-center q-mb-md">
      <div class="col-12 col-sm">
        <SearchBar
          v-model="searchQuery"
          :placeholder="$t('admin.scoreRubricManagement.searchPlaceholder')"
        />
      </div>
      <div class="col-12 col-sm-auto text-right">
        <AppButton
          icon="add"
          :label="$t('admin.scoreRubricManagement.createButton')"
          color="primary"
          class="create-rubric-btn text-weight-bold"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <BaseTable
      :columns="tableColumns"
      :rows="filteredRubrics"
      :loading="isLoading"
      :pagination="pagination"
      :empty-label="$t('admin.scoreRubricManagement.noData')"
      @request="onRequest"
    >
      <template v-slot:body-cell-tools="{ row }">
        <div class="row justify-center q-gutter-x-sm no-wrap">
          <ActionButton
            icon="edit"
            color="secondary"
            :tooltip="$t('admin.scoreRubricManagement.tooltips.edit')"
            @click="openEditDialog(row)"
          />
          <ActionButton
            icon="delete"
            color="negative"
            :tooltip="$t('admin.scoreRubricManagement.tooltips.delete')"
            :disable="row.isDefault"
            @click="openDeleteDialog(row)"
          />
        </div>
      </template>
    </BaseTable>

    <q-dialog v-model="showFormDialog" persistent>
      <q-card class="rubric-dialog-card">
        <q-card-section class="row items-center dialog-header">
          <div>
            <div class="text-h6 text-weight-bold">
              {{
                editingRubric
                  ? $t('admin.scoreRubricManagement.editTitle')
                  : $t('admin.scoreRubricManagement.createTitle')
              }}
            </div>
            <div class="text-body2 text-grey-7 q-mt-xs">
              {{ $t('admin.scoreRubricManagement.pageDescription') }}
            </div>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" color="grey-6" @click="closeFormDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="dialog-body">
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.nameTh"
                outlined
                dense
                :label="$t('admin.scoreRubricManagement.nameTh')"
                class="buu-input-muted"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.nameEn"
                outlined
                dense
                :label="$t('admin.scoreRubricManagement.nameEn')"
                class="buu-input-muted"
              />
            </div>
          </div>

          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-bold">
              {{ $t('admin.scoreRubricManagement.itemsTitle') }}
            </div>
            <q-badge color="grey-2" text-color="grey-8" class="item-total-badge">
              {{ form.items.length }} หมวด
            </q-badge>
          </div>

          <div class="item-list">
            <q-card
              v-for="(item, index) in form.items"
              :key="index"
              flat
              bordered
              class="item-card q-mb-md"
            >
              <q-card-section class="q-pa-md">
                <div class="row items-center justify-between q-mb-md">
                  <div class="text-subtitle2 text-weight-bold">หมวดที่ {{ index + 1 }}</div>
                  <ActionButton
                    icon="delete"
                    color="negative"
                    tooltip="ลบหมวด"
                    :disable="form.items.length <= 1"
                    @click="removeItem(index)"
                  />
                </div>

                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="item.nameTh"
                      outlined
                      dense
                      :label="$t('admin.scoreRubricManagement.itemNameTh')"
                      class="buu-input-muted"
                    />
                  </div>
                  <div class="col-12 col-md-4">
                    <q-input
                      v-model="item.nameEn"
                      outlined
                      dense
                      :label="$t('admin.scoreRubricManagement.itemNameEn')"
                      class="buu-input-muted"
                    />
                  </div>
                  <div class="col-6 col-md-2">
                    <q-input
                      v-model.number="item.maxScore"
                      type="number"
                      outlined
                      dense
                      :label="$t('admin.scoreRubricManagement.maxScore')"
                      class="buu-input-muted"
                    />
                  </div>
                  <div class="col-6 col-md-2">
                    <q-input
                      v-model.number="item.sortOrder"
                      type="number"
                      outlined
                      dense
                      :label="$t('admin.scoreRubricManagement.sortOrder')"
                      class="buu-input-muted"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <q-btn
            flat
            no-caps
            icon="add"
            color="primary"
            class="add-item-btn full-width"
            :label="$t('admin.scoreRubricManagement.addItem')"
            @click="addItem"
          />
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-lg q-gutter-sm">
          <AppButton
            :label="$t('common.cancel')"
            class="dialog-footer-btn cancel-btn"
            :disable="isSaving"
            @click="closeFormDialog"
          />
          <AppButton
            :label="$t('common.save')"
            color="primary"
            class="dialog-footer-btn"
            :loading="isSaving"
            @click="saveRubric"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <DialogDeleteConfirm
      v-model="showDeleteDialog"
      :title="$t('admin.scoreRubricManagement.deleteTitle')"
      :message="
        rubricToDelete
          ? $t('admin.scoreRubricManagement.deleteConfirm', { name: rubricToDelete.nameTh })
          : ''
      "
      :confirm-label="$t('profile.confirm')"
      :cancel-label="$t('profile.cancel')"
      :loading="isDeleting"
      @confirm="handleDeleteConfirm"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import DialogDeleteConfirm from 'src/components/exam/dialog-delete-confirm.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import {
  createScoreRubric,
  deleteScoreRubric,
  fetchScoreRubrics,
  updateScoreRubric,
} from 'src/services/score-rubric.service';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import type { ScoreRubricDto, ScoreRubricItemInput } from 'src/types/score-rubric';

interface RubricFormItem extends ScoreRubricItemInput {
  nameTh: string;
  nameEn: string;
  maxScore: number;
  sortOrder: number;
}

interface RubricForm {
  nameTh: string;
  nameEn: string;
  items: RubricFormItem[];
}

const $q = useQuasar();
const { t } = useI18n();

const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const searchQuery = ref('');
const rubrics = ref<ScoreRubricDto[]>([]);
const showFormDialog = ref(false);
const showDeleteDialog = ref(false);
const editingRubric = ref<ScoreRubricDto | null>(null);
const rubricToDelete = ref<ScoreRubricDto | null>(null);
const form = ref<RubricForm>(emptyForm());
const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const tableColumns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('admin.scoreRubricManagement.columns.index'),
    field: (_row: ScoreRubricDto, index?: number) =>
      ((pagination.value.page - 1) * pagination.value.rowsPerPage || 0) + (index ?? 0) + 1,
    align: 'center',
  },
  {
    name: 'nameTh',
    label: t('admin.scoreRubricManagement.columns.nameTh'),
    field: 'nameTh',
    align: 'left',
  },
  {
    name: 'nameEn',
    label: t('admin.scoreRubricManagement.columns.nameEn'),
    field: 'nameEn',
    align: 'left',
  },
  {
    name: 'itemsCount',
    label: t('admin.scoreRubricManagement.columns.itemsCount'),
    field: (row: ScoreRubricDto) => row.items.length,
    align: 'center',
  },
  {
    name: 'isDefault',
    label: t('admin.scoreRubricManagement.columns.isDefault'),
    field: 'isDefault',
    align: 'center',
    format: (val: boolean | null | undefined) =>
      val ? t('admin.scoreRubricManagement.defaultBadge') : '-',
  },
  {
    name: 'tools',
    label: t('admin.scoreRubricManagement.columns.tools'),
    field: 'tools',
    align: 'center',
  },
]);

function emptyForm(): RubricForm {
  return {
    nameTh: '',
    nameEn: '',
    items: [{ nameTh: '', nameEn: '', maxScore: 50, sortOrder: 1 }],
  };
}

const filteredRubrics = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return rubrics.value;

  return rubrics.value.filter((rubric) =>
    [rubric.nameTh, rubric.nameEn, ...rubric.items.flatMap((item) => [item.nameTh, item.nameEn])]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
});

watch(
  filteredRubrics,
  (rows) => {
    pagination.value.rowsNumber = rows.length;
  },
  { immediate: true },
);

const loadRubrics = async (): Promise<void> => {
  try {
    isLoading.value = true;
    rubrics.value = await fetchScoreRubrics();
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('admin.scoreRubricManagement.loadError') });
  } finally {
    isLoading.value = false;
  }
};

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage, sortBy, descending } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  pagination.value.sortBy = sortBy ?? null;
  pagination.value.descending = descending ?? false;
};

const openCreateDialog = (): void => {
  editingRubric.value = null;
  form.value = emptyForm();
  showFormDialog.value = true;
};

const openEditDialog = (rubric: ScoreRubricDto): void => {
  editingRubric.value = rubric;
  form.value = {
    nameTh: rubric.nameTh,
    nameEn: rubric.nameEn,
    items: rubric.items.map((item) => ({
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      maxScore: item.maxScore,
      sortOrder: item.sortOrder,
      ...(item.code ? { code: item.code } : {}),
    })),
  };
  showFormDialog.value = true;
};

const closeFormDialog = (): void => {
  if (isSaving.value) return;
  showFormDialog.value = false;
};

const addItem = (): void => {
  form.value.items.push({
    nameTh: '',
    nameEn: '',
    maxScore: 50,
    sortOrder: form.value.items.length + 1,
  });
};

const removeItem = (index: number): void => {
  form.value.items.splice(index, 1);
};

const validateForm = (): boolean => {
  if (!form.value.nameTh.trim() || !form.value.nameEn.trim()) {
    $q.notify({ type: 'warning', message: t('admin.scoreRubricManagement.nameRequired') });
    return false;
  }
  if (form.value.items.some((item) => !item.nameTh.trim() || !item.nameEn.trim())) {
    $q.notify({ type: 'warning', message: t('admin.scoreRubricManagement.itemNameRequired') });
    return false;
  }
  if (form.value.items.some((item) => Number(item.maxScore) <= 0)) {
    $q.notify({ type: 'warning', message: 'คะแนนเต็มต้องมากกว่า 0' });
    return false;
  }
  return true;
};

const saveRubric = async (): Promise<void> => {
  if (!validateForm()) return;

  try {
    isSaving.value = true;
    const payload = {
      nameTh: form.value.nameTh.trim(),
      nameEn: form.value.nameEn.trim(),
      items: form.value.items.map((item, index) => ({
        nameTh: item.nameTh.trim(),
        nameEn: item.nameEn.trim(),
        maxScore: item.maxScore ?? 50,
        sortOrder: item.sortOrder ?? index + 1,
        ...(item.code ? { code: item.code } : {}),
      })),
    };

    if (editingRubric.value) {
      await updateScoreRubric(editingRubric.value.id, payload);
    } else {
      await createScoreRubric(payload);
    }

    $q.notify({ type: 'positive', message: t('admin.scoreRubricManagement.saveSuccess') });
    showFormDialog.value = false;
    await loadRubrics();
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('admin.scoreRubricManagement.saveError') });
  } finally {
    isSaving.value = false;
  }
};

const openDeleteDialog = (rubric: ScoreRubricDto): void => {
  rubricToDelete.value = rubric;
  showDeleteDialog.value = true;
};

const handleDeleteConfirm = async (): Promise<void> => {
  if (!rubricToDelete.value) return;

  try {
    isDeleting.value = true;
    await deleteScoreRubric(rubricToDelete.value.id);
    $q.notify({ type: 'positive', message: t('admin.scoreRubricManagement.deleteSuccess') });
    showDeleteDialog.value = false;
    rubricToDelete.value = null;
    await loadRubrics();
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('admin.scoreRubricManagement.deleteError') });
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  void loadRubrics();
});
</script>

<style scoped lang="scss">
.create-rubric-btn {
  border-radius: var(--radius-10) !important;
  height: 40px;
  padding: 0 24px;
}

.item-total-badge {
  border-radius: 999px;
  font-weight: 600;
  padding: 6px 12px;
}

.rubric-dialog-card {
  width: min(1040px, 96vw);
  max-width: 1040px;
  border-radius: 20px !important;
  overflow: hidden;
}

.dialog-header {
  padding: 20px 24px;
}

.dialog-body {
  max-height: min(70vh, 760px);
  overflow-y: auto;
  padding: 24px;
}

.item-list {
  min-height: 72px;
}

.item-card {
  border-radius: 16px;
  border-color: var(--neutral-gray-light);
  background: var(--surface-page);
}

.add-item-btn {
  border: 1px dashed var(--primary);
  border-radius: 14px;
  padding: 10px 16px;
}

.dialog-footer-btn {
  min-width: 120px;
}
</style>
