<template>
  <q-page class="page-container score-rubric-management-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.scoreRubricManagement.pageTitle')"
      :subtitle="$t('admin.scoreRubricManagement.pageDescription')"
    />

    <div class="row justify-end q-mb-md">
      <q-btn
        color="primary"
        unelevated
        icon="add"
        :label="$t('admin.scoreRubricManagement.createButton')"
        @click="openCreateDialog"
      />
    </div>

    <q-card class="section-card">
      <q-table
        flat
        :rows="rubrics"
        :columns="tableColumns"
        row-key="id"
        :loading="isLoading"
        :pagination="{ rowsPerPage: 10 }"
      >
        <template #body-cell-itemsCount="{ row }">
          <div class="text-center">{{ row.items.length }}</div>
        </template>
        <template #body-cell-isDefault="{ row }">
          <div class="text-center">
            <q-badge
              v-if="row.isDefault"
              color="primary"
              :label="$t('admin.scoreRubricManagement.defaultBadge')"
            />
            <span v-else>-</span>
          </div>
        </template>
        <template #body-cell-actions="{ row }">
          <div class="row justify-center q-gutter-xs no-wrap">
            <q-btn flat round dense icon="edit" color="primary" @click="openEditDialog(row)" />
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              :disable="row.isDefault"
              @click="confirmDelete(row)"
            />
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="showFormDialog" persistent>
      <q-card class="rubric-dialog-card">
        <q-card-section>
          <div class="text-h6 text-weight-bold">
            {{
              editingRubric
                ? $t('admin.scoreRubricManagement.editTitle')
                : $t('admin.scoreRubricManagement.createTitle')
            }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md q-mb-md">
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

          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            {{ $t('admin.scoreRubricManagement.itemsTitle') }}
          </div>

          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="row q-col-gutter-sm items-center q-mb-sm"
          >
            <div class="col-12 col-md-3">
              <q-input
                v-model="item.nameTh"
                outlined
                dense
                :label="$t('admin.scoreRubricManagement.itemNameTh')"
                class="buu-input-muted"
              />
            </div>
            <div class="col-12 col-md-3">
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
            <div class="col-auto">
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                :disable="form.items.length <= 1"
                @click="removeItem(index)"
              />
            </div>
          </div>

          <q-btn
            flat
            color="primary"
            icon="add"
            :label="$t('admin.scoreRubricManagement.addItem')"
            @click="addItem"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat :label="$t('common.cancel')" @click="closeFormDialog" />
          <q-btn
            color="primary"
            unelevated
            :label="$t('common.save')"
            :loading="isSaving"
            @click="saveRubric"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import {
  createScoreRubric,
  deleteScoreRubric,
  fetchScoreRubrics,
  updateScoreRubric,
} from 'src/services/score-rubric.service';
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
const rubrics = ref<ScoreRubricDto[]>([]);
const showFormDialog = ref(false);
const editingRubric = ref<ScoreRubricDto | null>(null);
const form = ref<RubricForm>(emptyForm());

const tableColumns: QTableColumn[] = [
  { name: 'nameTh', label: 'ชื่อ (ไทย)', field: 'nameTh', align: 'left' },
  { name: 'nameEn', label: 'ชื่อ (EN)', field: 'nameEn', align: 'left' },
  { name: 'itemsCount', label: 'จำนวนหมวด', field: 'itemsCount', align: 'center' },
  { name: 'isDefault', label: 'ค่าเริ่มต้น', field: 'isDefault', align: 'center' },
  { name: 'actions', label: 'จัดการ', field: 'actions', align: 'center' },
];

function emptyForm(): RubricForm {
  return {
    nameTh: '',
    nameEn: '',
    items: [{ nameTh: '', nameEn: '', maxScore: 50, sortOrder: 1 }],
  };
}

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
    closeFormDialog();
    await loadRubrics();
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: t('admin.scoreRubricManagement.saveError') });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (rubric: ScoreRubricDto): void => {
  $q.dialog({
    title: t('admin.scoreRubricManagement.deleteTitle'),
    message: t('admin.scoreRubricManagement.deleteConfirm', { name: rubric.nameTh }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await deleteScoreRubric(rubric.id);
        $q.notify({ type: 'positive', message: t('admin.scoreRubricManagement.deleteSuccess') });
        await loadRubrics();
      } catch (err) {
        console.error(err);
        $q.notify({ type: 'negative', message: t('admin.scoreRubricManagement.deleteError') });
      }
    })();
  });
};

onMounted(() => {
  void loadRubrics();
});
</script>

<style scoped>
.rubric-dialog-card {
  width: min(960px, 95vw);
  max-width: 960px;
}
</style>
