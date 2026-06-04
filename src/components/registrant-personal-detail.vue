<template>
  <q-card flat bordered class="registrant-card">
    <header class="row items-center q-px-lg q-py-md">
      <q-icon name="person_outline" size="24px" color="black" class="q-mr-sm" />
      <h2 class="text-subtitle1 text-weight-bold text-black q-ma-none">
        {{ $t('admin.registrantManagement.detail.personalInfo') }}
      </h2>
    </header>

    <q-separator />

    <section class="registrant-content row q-px-lg q-col-gutter-x-xl q-col-gutter-y-lg">
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
              {{ displayData.profileImagePath ? 'user_photo.jpg' : 'No Photo' }}
            </div>
            <div class="text-caption text-grey-6">
              {{
                displayData.profileImagePath
                  ? `1.2 MB · อัปโหลด ${uploadDateFormatted}`
                  : 'Not Uploaded'
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
import { date } from 'quasar';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import ImageDisplay from 'src/components/base/image-display.vue';

interface Props {
  enrollment: BackendEnrollmentDetail | null;
}

const props = defineProps<Props>();

const displayData = computed(() => {
  const profile = props.enrollment?.USER?.PROFILE;
  const user = props.enrollment?.USER;

  return {
    nationalId: user?.USER_NATIONAL_ID || '-',
    titleTh: profile?.userTitleTh || '-',
    fullnameTh: profile?.userFullnameTh || '-',
    fullnameEn: profile?.userFullnameEn || '-',
    birthDate: profile?.userDateOfBirth
      ? date.formatDate(profile.userDateOfBirth, 'DD/MM/YYYY')
      : '-',
    education: profile?.userEducation || '-',
    faculty: profile?.userFaculty || '-',
    institution: profile?.userInstitution || '-',
    address: profile?.userAddress || '-',
    phone: profile?.userPhone || '-',
    profileImagePath: user?.IMAGE?.USER_IMAGE_URL || null,
    physicalStatus: profile?.userPhysicalStatus || '-',
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
  background-color: #ffffff;
  overflow: hidden;
}

.registrant-content {
  padding-top: 24px;
  padding-bottom: 24px;

  @media (max-width: 599px) {
    padding-top: 16px;
    padding-bottom: 16px;
  }
}

.photo-container {
  width: 180px;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  background-color: #e3f2fd;
}

.profile-img {
  width: 100%;
  height: 100%;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  line-height: 1.25rem;
}

.info-value {
  font-size: 1rem;
  color: #000000;
  font-weight: 500;
  line-height: 1.5rem;
  word-break: break-word;
}
</style>
