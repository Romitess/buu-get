<template>
  <q-card flat bordered class="profile-summary-card q-pa-lg">
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
            <div class="info-row empty-row gt-xs">&nbsp;</div>
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import defaultUserImage from 'src/assets/img/user-image.jpg';
import { getImageUrl } from 'src/services/image.service';

interface Props {
  enrollment: BackendEnrollmentDetail;
}

const props = defineProps<Props>();

const avatarSrc = computed((): string => {
  const user = props.enrollment.USER;
  const path = user?.USER_IMAGE || user?.PROFILE?.userImagePath || user?.IMAGE?.USER_IMAGE_URL;
  return path ? getImageUrl(path) : defaultUserImage;
});

const formatNationalId = (nid: string): string => {
  if (!nid) return '-';
  if (nid.length === 13) {
    return `${nid[0]}-${nid.substring(1, 5)}-${nid.substring(5, 10)}-${nid.substring(10, 12)}-${nid[12]}`;
  }
  return nid;
};

const displayData = computed(() => {
  const profile = props.enrollment.USER?.PROFILE;
  const user = props.enrollment.USER;

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
    formattedNationalId = formatNationalId(user.USER_NATIONAL_ID);
  }

  const fullAddress = profile ? `${profile.userAddress || ''}`.trim() : '-';

  return {
    nationalId: formattedNationalId,
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
</script>

<style scoped lang="scss">
.profile-summary-card {
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background-color: var(--surface-card);
  box-shadow: 0px 4px 4px 0px #00000040 !important;
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
</style>
