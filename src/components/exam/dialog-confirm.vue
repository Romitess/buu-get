<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card
      class="dialog-confirm-card relative-position q-pa-lg"
      :style="{
        width: '100%',
        maxWidth: currentStep === 1 ? '720px' : '1080px',
        borderRadius: '16px',
      }"
    >
      <q-btn
        icon="close"
        flat
        round
        dense
        class="absolute-top-right q-ma-md text-grey-5 close-btn"
        @click="$emit('update:modelValue', false)"
      />

      <ConvenienceStep
        v-if="currentStep === 1"
        v-model="selectedStatus"
        @cancel="$emit('update:modelValue', false)"
        @next="goToStep2"
      />

      <ConfirmStep
        v-else
        :exam-date="examDate"
        :exam-time="examTime"
        :exam-fee="examFee || 500"
        :enrollment="dummyEnrollment"
        @back="currentStep = 1"
        @confirm="onConfirm"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserStore } from 'src/stores/user.store';
import ConvenienceStep from './convenience-step.vue';
import ConfirmStep from './confirm-step.vue';

const props = defineProps<{
  modelValue: boolean;
  examDate: string;
  examTime: string;
  examFee?: string | number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', physicalStatus: string): void;
}>();

const userStore = useUserStore();
const currentStep = ref<number>(1);
const selectedStatus = ref<string>('ไม่มีข้อมูลข้างต้น');

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      currentStep.value = 1;
      selectedStatus.value = 'ไม่มีข้อมูลข้างต้น';
    }
  },
);

const goToStep2 = (): void => {
  currentStep.value = 2;
};

const dummyEnrollment = computed(() => {
  const u = userStore.currentUser;
  if (!u) return null;
  return {
    ERM_ID: 0,
    USER_ID: u.id || 0,
    SESSION_ID: 0,
    LS_ID: null,
    ERM_STATUS: 0,
    ERM_VERIFY_STATUS: 0,
    ERM_AT: null,
    CREATED_AT: new Date().toISOString(),
    UPDATED_AT: new Date().toISOString(),
    DELETED_AT: null,
    ERM_PHYSICAL_STATUS:
      selectedStatus.value === 'ไม่มีข้อมูลข้างต้น' ? 'ทั่วไป' : selectedStatus.value,
    USER: {
      USER_ID: u.id || 0,
      USER_NATIONAL_ID: u.nationalId,
      USER_PASSPORT_NO: u.passportNo,
      USER_EMAIL: u.email,
      IMAGE: u.userImagePath ? { USER_IMAGE_URL: u.userImagePath } : null,
      PROFILE: {
        userProfileId: u.profileId || 0,
        userId: u.id || 0,
        userTitleTh: u.titleTH,
        userFullnameTh: u.fullNameTH,
        userTitleEn: u.titleEN,
        userFullnameEn: u.fullNameEN,
        userDateOfBirth: u.birthdate,
        userPhone: u.phone,
        userEducation: u.educationLevel,
        userFaculty: u.faculty || '-',
        userInstitution: u.institution || '-',
        userAddress: u.address,
        userProvince: u.province || '-',
        userZipCode: u.zipCode || '-',
        userRemark: u.remark || null,
      },
    },
    SESSION: {
      SS_ID: 0,
      EXAM_ID: 0,
      SS_START_TIME: '',
      SS_END_TIME: '',
      SS_CAPACITY: 0,
    },
  };
});

const onConfirm = (): void => {
  emit('confirm', selectedStatus.value);
};
</script>

<style scoped lang="scss">
.dialog-confirm-card {
  background: var(--surface-card);
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  max-height: 90vh;
  transition: max-width var(--transition-smooth);

  @media (max-width: 599px) {
    padding: 16px !important;
    max-height: 95vh;
  }
}

.close-btn {
  z-index: 10;
}
</style>
