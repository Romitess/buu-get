<template>
  <q-page class="page-container">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('admin.candidateAccounts.title')"
      :subtitle="t('admin.candidateAccounts.subtitle')"
    />

    <q-input
      v-model="search"
      outlined
      dense
      clearable
      class="q-mb-md"
      :placeholder="t('admin.candidateAccounts.searchPlaceholder')"
      @update:model-value="onSearch"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-table
      flat
      bordered
      row-key="userId"
      :rows="rows"
      :columns="columns"
      :loading="isLoading"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 20, 50]"
      @request="onRequest"
    >
      <template #body-cell-registeredViaThaid="props">
        <q-td :props="props">
          {{
            props.row.registeredViaThaid
              ? t('admin.candidateAccounts.yes')
              : t('admin.candidateAccounts.no')
          }}
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="q-gutter-xs">
          <q-btn
            v-if="!props.row.registeredViaThaid"
            flat
            dense
            color="primary"
            icon="edit"
            :label="t('admin.candidateAccounts.edit')"
            @click="openEdit(props.row)"
          />
          <span v-else class="text-caption text-grey-7 q-mr-sm">
            {{ t('admin.candidateAccounts.thaidLocked') }}
          </span>
          <q-btn
            flat
            dense
            color="negative"
            icon="delete"
            :label="t('admin.candidateAccounts.delete')"
            @click="confirmPurge(props.row)"
          />
        </q-td>
      </template>
      <template #no-data>
        <div class="full-width text-center q-pa-lg text-grey-7">
          {{ t('admin.candidateAccounts.empty') }}
        </div>
      </template>
    </q-table>

    <q-dialog v-model="showEdit" persistent>
      <q-card style="width: 720px; max-width: 95vw">
        <q-card-section class="text-h6">
          {{ t('admin.candidateAccounts.editTitle') }}
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.email" outlined dense :label="t('admin.candidateAccounts.fields.email')" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.userNationalId"
                outlined
                dense
                :label="t('admin.candidateAccounts.fields.nationalId')"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.userTitleTh" outlined dense :label="t('admin.candidateAccounts.fields.titleTh')" />
            </div>
            <div class="col-12 col-sm-8">
              <q-input
                v-model="form.userFullnameTh"
                outlined
                dense
                :label="t('admin.candidateAccounts.fields.fullNameTh')"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="form.userTitleEn" outlined dense :label="t('admin.candidateAccounts.fields.titleEn')" />
            </div>
            <div class="col-12 col-sm-8">
              <q-input
                v-model="form.userFullnameEn"
                outlined
                dense
                :label="t('admin.candidateAccounts.fields.fullNameEn')"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.userDateOfBirth"
                outlined
                dense
                mask="####-##-##"
                :label="t('admin.candidateAccounts.fields.birthdate')"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.userPhone" outlined dense :label="t('admin.candidateAccounts.fields.phone')" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.userEducation"
                outlined
                dense
                :label="t('admin.candidateAccounts.fields.education')"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.userFaculty" outlined dense :label="t('admin.candidateAccounts.fields.faculty')" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.userInstitution"
                outlined
                dense
                :label="t('admin.candidateAccounts.fields.institution')"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.userCountry" outlined dense :label="t('admin.candidateAccounts.fields.country')" />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.userAddress"
                outlined
                dense
                type="textarea"
                autogrow
                :label="t('admin.candidateAccounts.fields.address')"
              />
            </div>
            <div class="col-12">
              <q-input v-model="form.userRemark" outlined dense :label="t('admin.candidateAccounts.fields.remark')" />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('admin.candidateAccounts.cancel')" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            :label="t('admin.candidateAccounts.save')"
            :loading="isSaving"
            @click="saveEdit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import {
  fetchCandidateAccounts,
  purgeCandidateAccount,
  updateCandidateAccount,
  type CandidateAccount,
  type UpdateCandidateAccountPayload,
} from 'src/services/candidate-account.service';

const { t } = useI18n();
const $q = useQuasar();

const rows = ref<CandidateAccount[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const search = ref<string | null>('');
const showEdit = ref(false);
const editingId = ref<number | null>(null);
const form = ref<UpdateCandidateAccountPayload>({});
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = computed<QTableProps['columns']>(() => [
  { name: 'userCode', label: t('admin.candidateAccounts.columns.code'), field: 'userCode', align: 'left' },
  { name: 'fullNameTh', label: t('admin.candidateAccounts.columns.name'), field: 'fullNameTh', align: 'left' },
  { name: 'email', label: t('admin.candidateAccounts.columns.email'), field: 'email', align: 'left' },
  {
    name: 'nationalId',
    label: t('admin.candidateAccounts.columns.nationalId'),
    field: 'nationalId',
    align: 'left',
  },
  {
    name: 'registeredViaThaid',
    label: t('admin.candidateAccounts.columns.thaid'),
    field: 'registeredViaThaid',
    align: 'left',
  },
  { name: 'actions', label: t('admin.candidateAccounts.columns.actions'), field: 'userId', align: 'right' },
]);

function readError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join(', ');
  }
  return t('admin.candidateAccounts.saveError');
}

async function load(): Promise<void> {
  isLoading.value = true;
  try {
    const result = await fetchCandidateAccounts({
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      ...(search.value?.trim() ? { search: search.value.trim() } : {}),
    });
    rows.value = result.data;
    pagination.value.rowsNumber = result.meta.total;
  } catch (err) {
    $q.notify({ type: 'negative', message: readError(err) });
  } finally {
    isLoading.value = false;
  }
}

function onRequest(request: { pagination: { page: number; rowsPerPage: number } }): void {
  pagination.value.page = request.pagination.page;
  pagination.value.rowsPerPage = request.pagination.rowsPerPage;
  void load();
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
function onSearch(): void {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.value.page = 1;
    void load();
  }, 300);
}

function openEdit(row: CandidateAccount): void {
  editingId.value = row.userId;
  form.value = {
    email: row.email,
    userNationalId: row.nationalId ?? '',
    userTitleTh: row.titleTh ?? '',
    userFullnameTh: row.fullNameTh ?? '',
    userTitleEn: row.titleEn ?? '',
    userFullnameEn: row.fullNameEn ?? '',
    userDateOfBirth: row.dateOfBirth ?? '',
    userPhone: row.phone ?? '',
    userEducation: row.education ?? '',
    userFaculty: row.faculty ?? '',
    userInstitution: row.institution ?? '',
    userCountry: row.country ?? '',
    userAddress: row.address ?? '',
    userRemark: row.remark ?? '',
  };
  showEdit.value = true;
}

async function saveEdit(): Promise<void> {
  if (editingId.value == null) return;
  isSaving.value = true;
  try {
    await updateCandidateAccount(editingId.value, form.value);
    showEdit.value = false;
    $q.notify({ type: 'positive', message: t('admin.candidateAccounts.saved') });
    await load();
  } catch (err) {
    $q.notify({ type: 'negative', message: readError(err) });
  } finally {
    isSaving.value = false;
  }
}

function confirmPurge(row: CandidateAccount): void {
  $q.dialog({
    title: t('admin.candidateAccounts.deleteTitle'),
    message: t('admin.candidateAccounts.deleteBody', {
      name: row.fullNameTh || row.email,
    }),
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void runPurge(row.userId);
  });
}

async function runPurge(userId: number): Promise<void> {
  isLoading.value = true;
  try {
    await purgeCandidateAccount(userId);
    $q.notify({ type: 'positive', message: t('admin.candidateAccounts.deleted') });
    await load();
  } catch (err) {
    $q.notify({ type: 'negative', message: readError(err) });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>
