<template>
  <q-page class="page-container history-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('profileEditHistory.pageTitle')"
      :subtitle="$t('profileEditHistory.pageSubtitle')"
    />

    <div v-if="isLoading || isLoadingHistory" class="flex flex-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-else-if="enrollment" class="history-content">
      <q-card flat bordered class="profile-summary-card q-pa-lg q-mb-lg">
        <div class="row items-center q-col-gutter-lg">
          <div class="col-12 col-md-auto flex justify-center">
            <q-avatar size="100px" class="profile-avatar">
              <img :src="avatarSrc" alt="Avatar" />
            </q-avatar>
          </div>

          <div class="col-12 col-md">
            <h2 class="text-subtitle1 text-weight-bold q-ma-none q-mb-sm brand-text">
              {{ displayData.fullnameTh }} ({{ displayData.fullnameEn }})
            </h2>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4 info-col">
                <div class="info-row">
                  <span class="info-label">เลขบัตรประจำตัวประชาชน:</span>
                  <span class="info-value q-ml-xs">{{ displayData.nationalId }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">วันเกิด:</span>
                  <span class="info-value q-ml-xs">{{ displayData.birthDate }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">เบอร์โทรศัพท์:</span>
                  <span class="info-value q-ml-xs">{{ displayData.phone }}</span>
                </div>
              </div>

              <div class="col-12 col-sm-4 info-col">
                <div class="info-row empty-row">&nbsp;</div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">ที่อยู่สำหรับจัดส่งเอกสาร:</span>
                </div>
                <div class="info-row">
                  <span class="info-value address-value">{{ displayData.address }}</span>
                </div>
              </div>

              <div class="col-12 col-sm-4 info-col">
                <div class="info-row">
                  <span class="info-label">ชื่อสถานศึกษา:</span>
                  <span class="info-value q-ml-xs">{{ displayData.institution }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">ระดับการศึกษาสูงสุดของท่าน:</span>
                  <span class="info-value q-ml-xs">{{ displayData.education }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">คณะ/สาขาวิชา:</span>
                  <span class="info-value q-ml-xs">{{ displayData.faculty }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <main>
        <BaseTable
          :columns="columns"
          :rows="historyRows"
          :loading="isLoadingHistory"
          :pagination="pagination"
          class="history-table"
        >
          <template v-slot:body-cell-index="{ row }">
            <div class="text-center">{{ row.index }}</div>
          </template>

          <template v-slot:body-cell-modifierName="{ row }">
            <div class="text-center">{{ row.modifierName }}</div>
          </template>

          <template v-slot:body-cell-modifierRole="{ row }">
            <div class="text-center">{{ row.modifierRole }}</div>
          </template>

          <template v-slot:body-cell-modifiedFields="{ row }">
            <div class="text-center">{{ row.modifiedFields }}</div>
          </template>

          <template v-slot:body-cell-modifiedDate="{ row }">
            <div class="text-center">{{ row.modifiedDate }}</div>
          </template>

          <template v-slot:body-cell-modifiedTime="{ row }">
            <div class="text-center">{{ row.modifiedTime }}</div>
          </template>

          <template v-slot:body-cell-tools="{ row }">
            <div class="row justify-center no-wrap">
              <ActionButton
                icon="visibility"
                :tooltip="$t('profileEditHistory.dialog.title')"
                color="primary"
                @click="viewDetails(row)"
              />
            </div>
          </template>
        </BaseTable>
      </main>
    </div>

    <q-dialog v-model="showDetailsDialog" persistent>
      <q-card style="min-width: 600px; border-radius: 16px">
        <q-card-section class="row items-center q-pb-none justify-between">
          <div class="text-h6 text-weight-bold">
            {{ $t('profileEditHistory.dialog.title') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-md">
          <q-table
            flat
            bordered
            :rows="detailsRows"
            :columns="detailsColumns"
            row-key="field"
            :pagination="{ rowsPerPage: 0 }"
            hide-bottom
          >
            <template v-slot:body-cell-oldValue="props">
              <q-td :props="props" class="text-red-8 text-weight-medium">
                {{ props.row.oldValue || '-' }}
              </q-td>
            </template>
            <template v-slot:body-cell-newValue="props">
              <q-td :props="props" class="text-green-8 text-weight-medium">
                {{ props.row.newValue || '-' }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn
            unelevated
            label="ปิด"
            color="primary"
            style="border-radius: 8px; min-width: 100px"
            class="text-weight-bold"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, date } from 'quasar';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import { fetchEnrollmentById } from 'src/services/enrollment.service';
import { fetchProfileEditHistory } from 'src/services/profile-edit-history.service';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import type { ProfileEditHistory } from 'src/types/profile-edit-history.types';
import defaultUserImage from 'src/assets/img/user-image.jpg';
import { getImageUrl } from 'src/services/image.service';
import { useUserStore } from 'src/stores/user.store';

const route = useRoute();
const userStore = useUserStore();
const $q = useQuasar();
const { t } = useI18n();

const enrollment = ref<BackendEnrollmentDetail | null>(null);
const historyLogs = ref<ProfileEditHistory[]>([]);
const isLoading = ref(true);
const isLoadingHistory = ref(true);

const showDetailsDialog = ref(false);
const selectedLog = ref<ProfileEditHistory | null>(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const avatarSrc = computed(() => {
  const path = enrollment.value?.USER?.IMAGE?.USER_IMAGE_URL;
  return path ? getImageUrl(path) : defaultUserImage;
});

const displayData = computed(() => {
  const profile = enrollment.value?.USER?.PROFILE;
  const user = enrollment.value?.USER;

  let birthStr = '-';
  if (profile?.userDateOfBirth) {
    const dob = new Date(profile.userDateOfBirth);
    const day = String(dob.getDate()).padStart(2, '0');
    const month = String(dob.getMonth() + 1).padStart(2, '0');
    const beYear = dob.getFullYear() + 543;
    birthStr = `${day}/${month}/${beYear}`;
  }

  let formattedNationalId = '-';
  if (user?.USER_NATIONAL_ID) {
    const nid = user.USER_NATIONAL_ID;
    if (nid.length === 13) {
      formattedNationalId = `${nid[0]}-${nid.substring(1, 5)}-${nid.substring(5, 10)}-${nid.substring(10, 12)}-${nid[12]}`;
    } else {
      formattedNationalId = nid;
    }
  }

  const fullAddress = profile
    ? `${profile.userAddress || ''} ${profile.userProvince ? `จ.${profile.userProvince}` : ''} ${profile.userZipCode || ''}`.trim()
    : '-';

  return {
    nationalId: formattedNationalId,
    titleTh: profile?.userTitleTh || '-',
    fullnameTh: profile?.userFullnameTh || '-',
    fullnameEn: profile?.userFullnameEn || '-',
    birthDate: birthStr,
    education: profile?.userEducation || '-',
    faculty: profile?.userFaculty || '-',
    institution: profile?.userInstitution || '-',
    address: fullAddress || '-',
    phone: profile?.userPhone || '-',
  };
});

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'index',
    label: t('profileEditHistory.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 60px',
  },
  {
    name: 'modifierName',
    label: t('profileEditHistory.table.columns.modifierName'),
    field: 'modifierName',
    align: 'center',
  },
  {
    name: 'modifierRole',
    label: t('profileEditHistory.table.columns.modifierRole'),
    field: 'modifierRole',
    align: 'center',
  },
  {
    name: 'modifiedFields',
    label: t('profileEditHistory.table.columns.modifiedFields'),
    field: 'modifiedFields',
    align: 'center',
  },
  {
    name: 'modifiedDate',
    label: t('profileEditHistory.table.columns.modifiedDate'),
    field: 'modifiedDate',
    align: 'center',
  },
  {
    name: 'modifiedTime',
    label: t('profileEditHistory.table.columns.modifiedTime'),
    field: 'modifiedTime',
    align: 'center',
  },
  {
    name: 'tools',
    label: t('profileEditHistory.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 80px',
  },
]);

const historyRows = computed(() => {
  return historyLogs.value.map((log, index) => {
    const rawDate = new Date(log.createdAt);
    const day = String(rawDate.getDate()).padStart(2, '0');
    const month = String(rawDate.getMonth() + 1).padStart(2, '0');
    const beYear = rawDate.getFullYear() + 543;
    const formattedDate = `${day}/${month}/${beYear}`;

    const formattedTime = date.formatDate(rawDate, 'HH:mm:ss');

    return {
      ...log,
      index: index + 1,
      modifiedDate: formattedDate,
      modifiedTime: formattedTime,
    };
  });
});

const detailsColumns = computed<QTableColumn[]>(() => [
  {
    name: 'field',
    label: t('profileEditHistory.dialog.fieldName'),
    field: 'field',
    align: 'left',
  },
  {
    name: 'oldValue',
    label: t('profileEditHistory.dialog.oldValue'),
    field: 'oldValue',
    align: 'left',
  },
  {
    name: 'newValue',
    label: t('profileEditHistory.dialog.newValue'),
    field: 'newValue',
    align: 'left',
  },
]);

const detailsRows = computed(() => {
  if (!selectedLog.value) return [];
  const log = selectedLog.value;

  const parseJson = (val: unknown): Record<string, unknown> => {
    if (!val) return {};
    if (typeof val === 'object') return val as Record<string, unknown>;
    try {
      return JSON.parse(val as string) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const oldObj = parseJson(log.oldValues);
  const newObj = parseJson(log.newValues);

  const fieldTranslationMap: Record<string, string> = {
    userTitleTh: 'คำนำหน้าภาษาไทย',
    userFullnameTh: 'ชื่อ-นามสกุล ภาษาไทย',
    userTitleEn: 'คำนำหน้าภาษาอังกฤษ',
    userFullnameEn: 'ชื่อ-นามสกุล ภาษาอังกฤษ',
    userDateOfBirth: 'วันเกิด',
    userPhone: 'เบอร์โทรศัพท์',
    userEducation: 'ระดับการศึกษา',
    userFaculty: 'คณะ',
    userInstitution: 'ชื่อสถานศึกษา',
    userAddress: 'ที่อยู่สำหรับจัดส่งเอกสาร',
    userProvince: 'จังหวัด',
    userZipCode: 'รหัสไปรษณีย์',
    userRemark: 'หมายเหตุถึงผู้สมัคร',
    userPhysicalStatus: 'ข้อมูลทางกายภาพ/สถานะพิเศษ',
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    return JSON.stringify(val);
  };

  const rows: { field: string; oldValue: string; newValue: string }[] = [];

  for (const key of Object.keys(newObj)) {
    let oldVal = oldObj[key] !== undefined && oldObj[key] !== null ? oldObj[key] : '-';
    let newVal = newObj[key] !== undefined && newObj[key] !== null ? newObj[key] : '-';

    if (key === 'userDateOfBirth') {
      if (oldVal && oldVal !== '-') {
        const d = new Date(oldVal as string | number | Date);
        oldVal = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear() + 543}`;
      }
      if (newVal && newVal !== '-') {
        const d = new Date(newVal as string | number | Date);
        newVal = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear() + 543}`;
      }
    }

    rows.push({
      field: fieldTranslationMap[key] || key,
      oldValue: formatValue(oldVal),
      newValue: formatValue(newVal),
    });
  }

  return rows;
});

const loadData = async (): Promise<void> => {
  const ermId = Number(route.params.ermId);
  if (isNaN(ermId)) {
    isLoading.value = false;
    isLoadingHistory.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const detail = await fetchEnrollmentById(ermId);
    enrollment.value = detail;
    isLoading.value = false;

    if (detail.USER?.PROFILE?.userProfileId) {
      await fetchHistory(detail.USER.PROFILE.userProfileId);
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    $q.notify({
      type: 'negative',
      message: t('admin.registrantManagement.detail.errors.cannotFetch'),
    });
    isLoading.value = false;
    isLoadingHistory.value = false;
  }
};

const fetchHistory = async (profileId: number): Promise<void> => {
  isLoadingHistory.value = true;
  try {
    const token = userStore.accessToken || localStorage.getItem('access_token') || '';
    historyLogs.value = await fetchProfileEditHistory(profileId, token);
    pagination.value.rowsNumber = historyLogs.value.length;
  } catch (err) {
    console.error('Error fetching history logs:', err);
  } finally {
    isLoadingHistory.value = false;
  }
};

const viewDetails = (row: ProfileEditHistory): void => {
  selectedLog.value = row;
  showDetailsDialog.value = true;
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.history-page {
  min-height: 0 !important;
}

.profile-summary-card {
  border-radius: 12px;
  border: 1px solid #ebeef5;
  background-color: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04) !important;
  overflow: hidden;
}

.profile-avatar {
  border: none !important;
  box-shadow: none !important;
}

.brand-text {
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: baseline;
  line-height: 1.5;
  margin-bottom: 8px;
  font-size: 15px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.empty-row {
  visibility: hidden;
  pointer-events: none;
  user-select: none;
}

.info-label {
  font-size: 15px;
  color: #7f7f7f;
  font-weight: 400;
  flex-shrink: 0;
}

.info-value {
  font-size: 15px;
  color: #000000;
  font-weight: 400;
  margin-left: 4px;
}

.address-value {
  font-size: 15px;
  color: #000000;
  font-weight: 400;
  max-width: 100%;
  white-space: normal;
  word-break: break-word;
  margin-left: 0;
}

.history-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }
}
</style>
