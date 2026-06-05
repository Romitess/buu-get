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
                  <span class="info-label">{{ $t('profile.nationalId') }}:</span>
                  <span class="info-value q-ml-xs">{{ displayData.nationalId }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">{{ $t('profile.birthdate') }}:</span>
                  <span class="info-value q-ml-xs">{{ displayData.birthDate }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">{{ $t('profile.phone') }}:</span>
                  <span class="info-value q-ml-xs">{{ displayData.phone }}</span>
                </div>
              </div>

              <div class="col-12 col-sm-4 info-col">
                <div class="info-row empty-row">&nbsp;</div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">{{ $t('profile.address') }}:</span>
                </div>
                <div class="info-row">
                  <span class="info-value address-value">{{ displayData.address }}</span>
                </div>
              </div>

              <div class="col-12 col-sm-4 info-col">
                <div class="info-row">
                  <span class="info-label">{{ $t('profile.institution') }}:</span>
                  <span class="info-value q-ml-xs">{{ displayData.institution }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">{{ $t('profile.education') }}:</span>
                  <span class="info-value q-ml-xs">{{ displayData.education }}</span>
                </div>
                <div class="info-row q-mt-xs">
                  <span class="info-label">{{ $t('profile.faculty') }}:</span>
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
      <q-card style="width: 1000px; max-width: 95vw; border-radius: 16px">
        <q-card-section
          class="row items-center justify-between q-px-md q-px-sm-xl q-pt-lg q-pb-none"
        >
          <div class="text-h6 text-weight-bold text-black">
            {{ $t('profileEditHistory.dialog.diffTitle') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-px-md q-px-sm-xl q-pt-md q-pb-xl scroll" style="max-height: 75vh">
          <q-card flat bordered class="registrant-card q-mb-md">
            <header class="row items-center q-px-md q-px-sm-lg q-py-md">
              <q-icon name="person" size="24px" color="black" class="q-mr-sm" />
              <h2 class="text-subtitle1 text-weight-bold text-black q-ma-none">
                {{ $t('profileEditHistory.dialog.newData') }}
              </h2>
            </header>
            <q-separator />
            <section
              class="registrant-content row q-px-md q-px-sm-lg q-col-gutter-x-lg q-col-gutter-y-md"
            >
              <div class="col-12 col-sm-4 col-md-3">
                <figure
                  class="flex column items-center q-ma-none photo-figure-wrapper"
                  :class="{ 'highlight-new': isFieldChanged('userImagePath') }"
                >
                  <div class="photo-container">
                    <img
                      :src="avatarSrcNew"
                      class="profile-img"
                      style="object-fit: cover; width: 100%; height: 100%"
                      alt="New Photo"
                    />
                  </div>
                  <figcaption class="text-center q-mt-md">
                    <div class="text-subtitle2 text-weight-bold text-black">
                      {{
                        displayProfileNew.imagePath
                          ? 'user_photo.jpg'
                          : $t('profileEditHistory.dialog.noPhoto')
                      }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{
                        displayProfileNew.imagePath
                          ? $t('profileEditHistory.dialog.uploadedAt', {
                              size: '1.2 MB',
                              date: uploadDateFormatted,
                            })
                          : $t('profileEditHistory.dialog.notUploaded')
                      }}
                    </div>
                  </figcaption>
                </figure>
              </div>

              <div class="col-12 col-sm-8 col-md-9">
                <div class="row q-col-gutter-x-lg q-col-gutter-y-md">
                  <div class="col-12 col-sm-6">
                    <div class="column q-gutter-y-sm">
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userNationalId') }"
                      >
                        <span class="info-label">{{ $t('profile.nationalId') }}</span>
                        <span class="info-value">{{ displayProfileNew.nationalId }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userTitleTh') }"
                      >
                        <span class="info-label">{{ $t('profile.prefix') }}</span>
                        <span class="info-value">{{ displayProfileNew.titleTh }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userFullnameTh') }"
                      >
                        <span class="info-label">{{ $t('profile.fullName') }}</span>
                        <span class="info-value">{{ displayProfileNew.fullnameTh }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userFullnameEn') }"
                      >
                        <span class="info-label">{{ $t('profile.fullNameEn') }}</span>
                        <span class="info-value">{{ displayProfileNew.fullnameEn }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userDateOfBirth') }"
                      >
                        <span class="info-label">{{ $t('profile.birthdate') }}</span>
                        <span class="info-value">{{ displayProfileNew.birthDate }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="column q-gutter-y-sm">
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userEducation') }"
                      >
                        <span class="info-label">{{ $t('profile.education') }}</span>
                        <span class="info-value">{{ displayProfileNew.education }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userFaculty') }"
                      >
                        <span class="info-label">{{ $t('profile.faculty') }}</span>
                        <span class="info-value">{{ displayProfileNew.faculty }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userInstitution') }"
                      >
                        <span class="info-label">{{ $t('profile.institution') }}</span>
                        <span class="info-value">{{ displayProfileNew.institution }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{
                          'highlight-new':
                            isFieldChanged('userAddress') ||
                            isFieldChanged('userProvince') ||
                            isFieldChanged('userZipCode'),
                        }"
                      >
                        <span class="info-label">{{ $t('profile.address') }}</span>
                        <span class="info-value">{{ displayProfileNew.address }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-new': isFieldChanged('userPhone') }"
                      >
                        <span class="info-label">{{ $t('profile.phone') }}</span>
                        <span class="info-value">{{ displayProfileNew.phone }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </q-card>

          <q-card flat bordered class="registrant-card">
            <header class="row items-center q-px-md q-px-sm-lg q-py-md">
              <q-icon name="person" size="24px" color="black" class="q-mr-sm" />
              <h2 class="text-subtitle1 text-weight-bold text-black q-ma-none">
                {{ $t('profileEditHistory.dialog.oldData') }}
              </h2>
            </header>
            <q-separator />
            <section
              class="registrant-content row q-px-md q-px-sm-lg q-col-gutter-x-lg q-col-gutter-y-md"
            >
              <div class="col-12 col-sm-4 col-md-3">
                <figure
                  class="flex column items-center q-ma-none photo-figure-wrapper"
                  :class="{ 'highlight-old': isFieldChanged('userImagePath') }"
                >
                  <div class="photo-container">
                    <img
                      :src="avatarSrcOld"
                      class="profile-img"
                      style="object-fit: cover; width: 100%; height: 100%"
                      alt="Old Photo"
                    />
                  </div>
                  <figcaption class="text-center q-mt-md">
                    <div class="text-subtitle2 text-weight-bold text-black">
                      {{
                        displayProfileOld.imagePath
                          ? 'user_photo.jpg'
                          : $t('profileEditHistory.dialog.noPhoto')
                      }}
                    </div>
                    <div class="text-caption text-grey-6">
                      {{
                        displayProfileOld.imagePath
                          ? $t('profileEditHistory.dialog.uploadedAt', {
                              size: '1.2 MB',
                              date: uploadDateFormatted,
                            })
                          : $t('profileEditHistory.dialog.notUploaded')
                      }}
                    </div>
                  </figcaption>
                </figure>
              </div>

              <div class="col-12 col-sm-8 col-md-9">
                <div class="row q-col-gutter-x-lg q-col-gutter-y-md">
                  <div class="col-12 col-sm-6">
                    <div class="column q-gutter-y-sm">
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userNationalId') }"
                      >
                        <span class="info-label">{{ $t('profile.nationalId') }}</span>
                        <span class="info-value">{{ displayProfileOld.nationalId }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userTitleTh') }"
                      >
                        <span class="info-label">{{ $t('profile.prefix') }}</span>
                        <span class="info-value">{{ displayProfileOld.titleTh }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userFullnameTh') }"
                      >
                        <span class="info-label">{{ $t('profile.fullName') }}</span>
                        <span class="info-value">{{ displayProfileOld.fullnameTh }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userFullnameEn') }"
                      >
                        <span class="info-label">{{ $t('profile.fullNameEn') }}</span>
                        <span class="info-value">{{ displayProfileOld.fullnameEn }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userDateOfBirth') }"
                      >
                        <span class="info-label">{{ $t('profile.birthdate') }}</span>
                        <span class="info-value">{{ displayProfileOld.birthDate }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div class="column q-gutter-y-sm">
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userEducation') }"
                      >
                        <span class="info-label">{{ $t('profile.education') }}</span>
                        <span class="info-value">{{ displayProfileOld.education }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userFaculty') }"
                      >
                        <span class="info-label">{{ $t('profile.faculty') }}</span>
                        <span class="info-value">{{ displayProfileOld.faculty }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userInstitution') }"
                      >
                        <span class="info-label">{{ $t('profile.institution') }}</span>
                        <span class="info-value">{{ displayProfileOld.institution }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{
                          'highlight-old':
                            isFieldChanged('userAddress') ||
                            isFieldChanged('userProvince') ||
                            isFieldChanged('userZipCode'),
                        }"
                      >
                        <span class="info-label">{{ $t('profile.address') }}</span>
                        <span class="info-value">{{ displayProfileOld.address }}</span>
                      </div>
                      <div
                        class="info-field"
                        :class="{ 'highlight-old': isFieldChanged('userPhone') }"
                      >
                        <span class="info-label">{{ $t('profile.phone') }}</span>
                        <span class="info-value">{{ displayProfileOld.phone }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </q-card>
        </q-card-section>
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
  const user = enrollment.value?.USER;
  const path = user?.USER_IMAGE || user?.PROFILE?.userImagePath || user?.IMAGE?.USER_IMAGE_URL;
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
    ? `${profile.userAddress || ''} ${profile.userProvince ? `${t('profile.provincePrefix')}${profile.userProvince}` : ''} ${profile.userZipCode || ''}`.trim()
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

const parseJson = (val: unknown): Record<string, unknown> => {
  if (!val) return {};
  if (typeof val === 'object') return val as Record<string, unknown>;
  try {
    return JSON.parse(val as string) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const getProfileValue = (key: string, isNew: boolean): string | null => {
  if (!selectedLog.value) return '';
  const oldObj = parseJson(selectedLog.value.oldValues);
  const newObj = parseJson(selectedLog.value.newValues);

  const obj = isNew ? newObj : oldObj;
  if (obj[key] !== undefined) {
    return (obj[key] as string) || '';
  }

  const profile = enrollment.value?.USER?.PROFILE;
  const user = enrollment.value?.USER;

  if (key === 'userNationalId') return user?.USER_NATIONAL_ID || '';
  if (key === 'userImagePath') {
    return user?.USER_IMAGE || user?.PROFILE?.userImagePath || user?.IMAGE?.USER_IMAGE_URL || null;
  }
  return (profile?.[key as keyof typeof profile] as string) || '';
};

const isFieldChanged = (key: string): boolean => {
  if (!selectedLog.value) return false;
  const newObj = parseJson(selectedLog.value.newValues);
  return newObj[key] !== undefined;
};

const formatBirthDate = (dateVal: unknown): string => {
  if (!dateVal) return '-';
  const d = new Date(dateVal as string | number | Date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const beYear = d.getFullYear() + 543;
  return `${day}/${month}/${beYear}`;
};

const formatNationalId = (nid: string): string => {
  if (!nid) return '-';
  if (nid.length === 13) {
    return `${nid[0]}-${nid.substring(1, 5)}-${nid.substring(5, 10)}-${nid.substring(10, 12)}-${nid[12]}`;
  }
  return nid;
};

const getDisplayProfile = (isNew: boolean) => {
  const nationalIdRaw = getProfileValue('userNationalId', isNew);
  const birthDateRaw = getProfileValue('userDateOfBirth', isNew);
  const titleTh = getProfileValue('userTitleTh', isNew);
  const fullnameTh = getProfileValue('userFullnameTh', isNew);
  const fullnameEn = getProfileValue('userFullnameEn', isNew);
  const education = getProfileValue('userEducation', isNew);
  const faculty = getProfileValue('userFaculty', isNew);
  const institution = getProfileValue('userInstitution', isNew);
  const address = getProfileValue('userAddress', isNew);
  const province = getProfileValue('userProvince', isNew);
  const zipCode = getProfileValue('userZipCode', isNew);
  const phone = getProfileValue('userPhone', isNew);
  const imagePath = getProfileValue('userImagePath', isNew);

  const fullAddress =
    `${address || ''} ${province ? `${t('profile.provincePrefix')}${province}` : ''} ${zipCode || ''}`.trim() ||
    '-';

  return {
    nationalId: formatNationalId(nationalIdRaw || ''),
    titleTh: titleTh || '-',
    fullnameTh: fullnameTh || '-',
    fullnameEn: fullnameEn || '-',
    birthDate: formatBirthDate(birthDateRaw),
    education: education || '-',
    faculty: faculty || '-',
    institution: institution || '-',
    address: fullAddress,
    phone: phone || '-',
    imagePath,
  };
};

const displayProfileNew = computed(() => getDisplayProfile(true));
const displayProfileOld = computed(() => getDisplayProfile(false));

const uploadDateFormatted = computed(() => {
  const createdAt = enrollment.value?.CREATED_AT;
  if (!createdAt) return '';
  const dateObj = new Date(createdAt);
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

const avatarSrcNew = computed(() => {
  const path = displayProfileNew.value.imagePath;
  return path ? getImageUrl(path) : defaultUserImage;
});

const avatarSrcOld = computed(() => {
  const path = displayProfileOld.value.imagePath;
  return path ? getImageUrl(path) : defaultUserImage;
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
  border: 1px solid var(--border-color);
  background-color: var(--surface-card);
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
  color: var(--text-primary);
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
  color: var(--text-muted);
  font-weight: 400;
  flex-shrink: 0;
}

.info-value {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 400;
  margin-left: 8px;
}

.address-value {
  font-size: 15px;
  color: var(--text-primary);
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

.registrant-card {
  border-radius: 12px;
  border: 1px solid var(--neutral-200, #e0e0e0);
  background-color: var(--surface-card);
  overflow: hidden;
}

.registrant-content {
  padding-top: 12px;
  padding-bottom: 12px;
}

.photo-container {
  width: 100%;
  max-width: 160px;
  aspect-ratio: 180 / 220;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--neutral-100);
  background-color: var(--badge-primary-bg);
  transition: all 0.3s ease;

  @media (max-width: 599px) {
    max-width: 130px;
  }
}

.profile-img {
  width: 100%;
  height: 100%;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  background-color: transparent;

  .info-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 400;
    line-height: 1.25rem;
  }

  .info-value {
    font-size: 0.875rem;
    color: var(--text-primary);
    font-weight: 500;
    line-height: 1.5rem;
    word-break: break-word;
    margin-left: 0;
  }
}

.info-field.highlight-new {
  background-color: var(--highlight-success-bg) !important;
}

.info-field.highlight-old {
  background-color: var(--highlight-error-bg) !important;
}

.photo-figure-wrapper {
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  background-color: transparent;
  width: fit-content;
  margin: 0 auto;

  @media (min-width: 600px) {
    margin: 0;
  }

  &.highlight-new {
    background-color: var(--highlight-success-bg) !important;
  }

  &.highlight-old {
    background-color: var(--highlight-error-bg) !important;
  }
}
</style>
