<template>
  <q-card flat bordered class="registrant-card">
    <div class="row items-center q-px-lg q-py-md">
      <q-icon name="person_outline" size="24px" color="dark" class="q-mr-sm" />
      <span class="text-h6 text-weight-bold">ข้อมูลส่วนตัว</span>
    </div>

    <q-separator />

    <div class="row q-px-lg q-py-xl q-col-gutter-x-xl">
      <div class="col-12 col-md-3 flex column items-center">
        <div class="photo-container">
          <q-img
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
            class="profile-img"
            fit="cover"
          />
        </div>
        <div class="text-center q-mt-md">
          <div class="text-subtitle2 text-weight-bold">user_photo.jpg</div>
          <div class="text-caption text-grey-6">1.2 MB · อัปโหลด 15 ม.ค. 2569</div>
        </div>
      </div>

      <div class="col-12 col-md-9">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="column q-gutter-y-md">
              <AppLabeledInput
                label="เลขบัตรประจำตัวประชาชน"
                :model-value="displayData.nationalId"
                readonly
              />
              <AppLabeledInput label="คำนำหน้า" :model-value="displayData.titleTh" readonly />
              <AppLabeledInput
                label="ชื่อ-นามสกุล"
                :model-value="displayData.fullnameTh"
                readonly
              />
              <AppLabeledInput label="Full Name" :model-value="displayData.fullnameEn" readonly />
              <AppLabeledInput label="วันเกิด" :model-value="displayData.birthDate" readonly />
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="column q-gutter-y-md">
              <AppLabeledInput
                label="ระดับการศึกษาสูงสุดของท่าน"
                :model-value="displayData.education"
                readonly
              />
              <AppLabeledInput label="คณะ/สาขาวิชา" :model-value="displayData.faculty" readonly />
              <AppLabeledInput
                label="ชื่อสถานศึกษา"
                :model-value="displayData.institution"
                readonly
              />
              <AppLabeledInput
                label="ที่อยู่สำหรับจัดส่งเอกสาร"
                :model-value="displayData.address"
                readonly
              />
              <AppLabeledInput label="เบอร์โทรศัพท์" :model-value="displayData.phone" readonly />
            </div>
          </div>
        </div>
      </div>
    </div>
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
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.02),
    0 15px 30px rgba(0, 0, 0, 0.08) !important;
  overflow: hidden;
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
