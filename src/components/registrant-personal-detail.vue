<template>
  <q-card flat bordered class="registrant-card">
    <header class="row items-center q-px-lg q-py-md">
      <q-icon name="person_outline" size="24px" color="dark" class="q-mr-sm" />
      <h2 class="text-h6 text-weight-bold q-ma-none">
        {{ $t('admin.registrantManagement.detail.personalInfo') }}
      </h2>
    </header>

    <q-separator />

    <section class="registrant-content row q-px-lg q-col-gutter-x-xl">
      <div class="col-12 col-md-3">
        <figure class="flex column items-center q-ma-none">
          <div class="photo-container">
            <q-img
              src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
              class="profile-img"
              fit="cover"
              :alt="$t('admin.registrantManagement.detail.photoAlt')"
            />
          </div>
          <figcaption class="text-center q-mt-md">
            <div class="text-subtitle2 text-weight-bold">user_photo.jpg</div>
            <div class="text-caption text-grey-6">1.2 MB · อัปโหลด 15 ม.ค. 2569</div>
          </figcaption>
        </figure>
      </div>

      <div class="col-12 col-md-9">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="column q-gutter-y-sm">
              <AppLabeledInput
                :label="$t('profile.nationalId')"
                :model-value="displayData.nationalId"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.prefix')"
                :model-value="displayData.titleTh"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.fullName')"
                :model-value="displayData.fullnameTh"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.fullNameEn')"
                :model-value="displayData.fullnameEn"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.birthdate')"
                :model-value="displayData.birthDate"
                readonly
              />
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="column q-gutter-y-sm">
              <AppLabeledInput
                :label="$t('profile.education')"
                :model-value="displayData.education"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.faculty')"
                :model-value="displayData.faculty"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.institution')"
                :model-value="displayData.institution"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.address')"
                :model-value="displayData.address"
                readonly
              />
              <AppLabeledInput
                :label="$t('profile.phone')"
                :model-value="displayData.phone"
                readonly
              />
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
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';

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
    institution: '-',
    address: profile?.userAddress || '-',
    phone: profile?.userPhone || '-',
  };
});
</script>

<style scoped lang="scss">
.registrant-card {
  border-radius: 16px;
  border: 1px solid var(--dashboard-border-color);
  background-color: #ffffff;
  box-shadow: var(--dashboard-card-shadow) !important;
  overflow: hidden;
  min-height: 600px;
}

.registrant-content {
  padding-top: 70px;
  padding-bottom: 70px;
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
</style>
