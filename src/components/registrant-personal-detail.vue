<template>
  <q-card flat bordered class="registrant-card">
    <header class="row items-center q-px-xl q-py-lg">
      <q-icon name="person_outline" size="24px" color="black" class="q-mr-sm" />
      <h2 class="text-subtitle1 text-weight-bold text-black q-ma-none">
        {{ $t('admin.registrantManagement.detail.personalInfo') }}
      </h2>
    </header>

    <q-separator />

    <section class="registrant-content row q-px-xl q-col-gutter-x-xl q-col-gutter-y-lg">
      <div class="col-12 col-sm-4 col-md-3">
        <figure class="flex column items-center q-ma-none">
          <div class="photo-container">
            <ImageDisplay
              :image-path="displayData.profileImagePath"
              class="profile-img"
              object-fit="cover"
              height="100%"
              :alt="$t('admin.registrantManagement.detail.photoAlt')"
            />
          </div>
          <figcaption class="text-center q-mt-md">
            <div class="text-subtitle2 text-weight-bold text-black">
              {{
                displayData.profileImagePath
                  ? 'user_photo.jpg'
                  : $t('profileEditHistory.dialog.noPhoto')
              }}
            </div>
            <div class="text-caption text-grey-6">
              {{
                displayData.profileImagePath
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
            <div class="column q-gutter-y-md">
              <div class="info-field">
                <span class="info-label">{{ $t('profile.nationalId') }}</span>
                <span class="info-value">{{ displayData.nationalId }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.prefix') }}</span>
                <span class="info-value">{{ displayData.titleTh }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.fullName') }}</span>
                <span class="info-value">{{ displayData.fullnameTh }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.fullNameEn') }}</span>
                <span class="info-value">{{ displayData.fullnameEn }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.birthdate') }}</span>
                <span class="info-value">{{ displayData.birthDate }}</span>
              </div>
            </div>
          </div>

          <div class="col-12 col-sm-6">
            <div class="column q-gutter-y-md">
              <div class="info-field">
                <span class="info-label">{{ $t('profile.education') }}</span>
                <span class="info-value">{{ displayData.education }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.faculty') }}</span>
                <span class="info-value">{{ displayData.faculty }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.institution') }}</span>
                <span class="info-value">{{ displayData.institution }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.address') }}</span>
                <span class="info-value">{{ displayData.address }}</span>
              </div>
              <div class="info-field">
                <span class="info-label">{{ $t('profile.phone') }}</span>
                <span class="info-value">{{ displayData.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import ImageDisplay from 'src/components/base/image-display.vue';

interface Props {
  enrollment: BackendEnrollmentDetail | null;
}

const props = defineProps<Props>();

const formatNationalId = (nid: string): string => {
  if (!nid || nid === '-') return '-';
  const clean = nid.replace(/-/g, '');
  if (clean.length === 13) {
    return `${clean[0]}-${clean.substring(1, 5)}-${clean.substring(5, 10)}-${clean.substring(10, 12)}-${clean[12]}`;
  }
  return nid;
};

const formatPhone = (phoneNum: string): string => {
  if (!phoneNum || phoneNum === '-') return '-';
  const clean = phoneNum.replace(/-/g, '');
  if (clean.length === 10) {
    return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6, 10)}`;
  }
  return phoneNum;
};

const formatBirthDateBE = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const beYear = d.getFullYear() + 543;
  return `${day}/${month}/${beYear}`;
};

const displayData = computed(() => {
  const profile = props.enrollment?.USER?.PROFILE;
  const user = props.enrollment?.USER;

  return {
    nationalId: formatNationalId(user?.USER_NATIONAL_ID || ''),
    titleTh: profile?.userTitleTh || '-',
    fullnameTh: profile?.userFullnameTh || '-',
    fullnameEn: profile?.userFullnameEn || '-',
    birthDate: formatBirthDateBE(profile?.userDateOfBirth),
    education: profile?.userEducation || '-',
    faculty: profile?.userFaculty || '-',
    institution: profile?.userInstitution || '-',
    address: profile?.userAddress || '-',
    phone: formatPhone(profile?.userPhone || ''),
    profileImagePath: user?.IMAGE?.USER_IMAGE_URL || null,
    physicalStatus: props.enrollment?.ERM_PHYSICAL_STATUS || '-',
  };
});

const uploadDateFormatted = computed(() => {
  const createdAt = props.enrollment?.CREATED_AT;
  if (!createdAt) return '';
  const dateObj = new Date(createdAt);
  return dateObj.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});
</script>

<style scoped lang="scss">
.registrant-card {
  border-radius: 12px;
  border: 1px solid var(--neutral-200);
  background-color: var(--surface-card);
  box-shadow: var(--dashboard-card-shadow) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  margin-top: 16px;

  @media (min-width: 1024px) {
    min-height: 360px;
  }
}

.registrant-content {
  flex: 1;
  align-items: center;
  padding-top: 20px;
  padding-bottom: 20px;

  @media (max-width: 599px) {
    padding-top: 12px;
    padding-bottom: 12px;
  }
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
  gap: 3px;
}

.info-label {
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-weight: 400;
  line-height: 1.25rem;
}

.info-value {
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 1.5rem;
  word-break: break-word;
}
</style>
