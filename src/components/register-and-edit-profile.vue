<template>
  <div class="register-profile-form">
    <!-- Match mockup styling: no heavy shadow, soft border, rounded corners -->
    <q-card class="shadow-0 profile-card">
      <q-form ref="formRef" @submit.prevent="onSubmit">
        <!-- ─── Title ─── -->
        <div class="profile-form-title">
          <q-icon name="people" size="20px" color="dark" />
          <div class="text-h6 text-weight-medium">{{ t('profile.personalInfo') }}</div>
        </div>

        <!-- ─── 2-Column Layout ─── -->
        <div class="profile-form-grid">
          <!-- คอลัมน์ซ้าย: ข้อมูลตัวตน -->
          <div class="profile-form-column">
            <IdentityColumn
              :is-thai="isThailand"
              :is-edit-mode="isEditMode"
              v-model:profile-image="formData.profileImage"
              v-model:national-id="formData.nationalId"
              v-model:country="formData.country"
              v-model:title-t-h="formData.titleTH"
              v-model:full-name="formData.fullName"
              v-model:english-name="formData.englishName"
              @title-th-change="handleTitleTHChange"
            />
          </div>

          <!-- คอลัมน์ขวา: ข้อมูลสถาบัน/ที่อยู่ -->
          <div class="profile-form-column">
            <ContactColumn
              :email="formData.email"
              v-model:birthdate="formData.birthdate"
              v-model:education-level="formData.educationLevel"
              v-model:faculty="formData.faculty"
              v-model:institution="formData.institution"
              v-model:address="formData.address"
              v-model:phone="formData.phone"
            />
          </div>
        </div>

        <!-- ─── Buttons ─── -->
        <!-- Center-aligned buttons to match mockup -->
        <div class="profile-actions">
          <q-btn
            unelevated
            class="bg-grey-4 text-black text-weight-bold profile-action-btn"
            :label="t('profile.back')"
            @click="emit('close')"
          />
          <q-btn
            type="submit"
            color="primary"
            class="text-weight-bold profile-action-btn"
            :label="submitButtonText"
            :loading="isSendingOtp"
            unelevated
          />
        </div>
      </q-form>
    </q-card>

    <OtpVerificationDialog
      v-model="showOtpDialog"
      :is-sending="isSendingOtp"
      :is-verifying="isVerifyingOtp"
      @verify="handleVerifyOtp"
      @resend="handleResendOtp"
    />

    <!-- ─── Dialog ─── -->
    <q-dialog v-model="dialog.show" persistent>
      <q-card class="profile-dialog-card">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="dialog.type === 'success' ? 'check_circle' : 'error'"
            :color="dialog.type === 'success' ? 'positive' : 'negative'"
            text-color="white"
          />
          <span class="q-ml-sm text-h6">{{
            dialog.type === 'success' ? t('profile.dialogSuccess') : t('profile.dialogError')
          }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ dialog.message }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="t('profile.dialogClose')" color="primary" @click="onDialogClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { User } from 'src/types/user';
import type { RegisterFormData } from 'src/types/register';
import type { RegisterCredentials } from 'src/types/register';
import { useRegisterForm } from 'src/composables/use-register-form';
import { useFocusFirstInvalidField } from 'src/composables/use-focus-first-invalid-field';
import { useAuthStore } from 'src/stores/auth.store';
import { useQuasar } from 'quasar';

import IdentityColumn from 'src/components/register/identity-column.vue';
import ContactColumn from 'src/components/register/contact-column.vue';
import OtpVerificationDialog from 'src/components/register/otp-verification-dialog.vue';

interface Props {
  initialEditMode: boolean;
  isThai?: boolean;
  credentials?: RegisterCredentials;
  userData?: User | null;
}

const props = withDefaults(defineProps<Props>(), {
  isThai: true,
});

const emit = defineEmits<{
  close: [];
  save: [payload: RegisterFormData];
}>();

const i18n = useI18n();
const { t } = i18n;
const $q = useQuasar();
const authStore = useAuthStore();
const tr = (key: string, fallback: string): string => (i18n.te(key) ? t(key) : fallback);

const isEditMode = ref<boolean>(props.initialEditMode);
const formRef = ref<QForm | null>(null);
const showOtpDialog = ref(false);
const isSendingOtp = ref(false);
const isVerifyingOtp = ref(false);
const { validateAndFocusFirstInvalid } = useFocusFirstInvalidField(formRef);

/** isThai มาจาก prop ที่ parent ส่งมา (ตาม userType ใน step 1) */
const isThailand = computed<boolean>(() => props.isThai);

const submitButtonText = computed<string>(() =>
  isEditMode.value ? t('profile.saveEdit') : tr('profile.sendOtp', 'ส่งรหัส OTP'),
);

const { formData, dialog, initFormData, handleTitleTHChange, submitForm, onDialogClose } =
  useRegisterForm(isEditMode.value, (payload) => {
    emit('save', payload);
  });

const sendOtp = async (): Promise<boolean> => {
  isSendingOtp.value = true;

  try {
    const response = await authStore.sendOtp(formData.value.email);
    if (!response.success) {
      $q.notify({
        type: 'negative',
        message: response.message || tr('profile.otpSendError', 'ไม่สามารถส่งรหัส OTP ได้'),
        position: 'top',
      });
      return false;
    }

    $q.notify({
      type: 'positive',
      message: tr('profile.otpSendSuccess', 'ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว'),
      position: 'top',
    });
    return true;
  } finally {
    isSendingOtp.value = false;
  }
};

const onSubmit = async (): Promise<void> => {
  const isValid = await validateAndFocusFirstInvalid();
  if (!isValid) {
    return;
  }

  if (isEditMode.value) {
    submitForm();
    return;
  }

  const isSent = await sendOtp();
  if (isSent) {
    showOtpDialog.value = true;
  }
};

const handleResendOtp = async (): Promise<void> => {
  await sendOtp();
};

const handleVerifyOtp = async (otp: string): Promise<void> => {
  isVerifyingOtp.value = true;

  try {
    const response = await authStore.verifyOtp(formData.value.email, otp);
    if (!response.success) {
      $q.notify({
        type: 'negative',
        message: response.message || tr('profile.otpVerifyError', 'ไม่สามารถยืนยันรหัส OTP ได้'),
        position: 'top',
      });
      return;
    }

    showOtpDialog.value = false;
    submitForm();
  } finally {
    isVerifyingOtp.value = false;
  }
};

onMounted(() => {
  initFormData(props.userData);
  // นำ email + password จาก step 1 มาเก็บใน formData
  if (props.credentials) {
    formData.value.email = props.credentials.email;
    formData.value.password = props.credentials.password;
    formData.value.country = props.isThai ? 'TH' : '';
  }
});
</script>

<style scoped lang="scss">
.register-profile-form {
  width: 100%;
  display: flex;
  justify-content: center;
}

.profile-card {
  width: min(100%, 1720px);
  border: 1px solid var(--q-grey-3);
  border-radius: 12px;
  margin: 0 auto;
  padding: 44px 84px 36px;
  background: var(--surface-card);
}

.profile-form-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.profile-form-title .text-h6 {
  font-size: 28px;
  line-height: 1.3;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 48px;
}

.profile-form-column {
  min-width: 0;
}

.profile-card :deep(.custom-input .q-field__control) {
  min-height: 48px;
}

.profile-card :deep(.custom-input .q-field__native),
.profile-card :deep(.custom-input .q-field__input),
.profile-card :deep(.custom-input .q-field__append) {
  min-height: 48px;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 28px;
}

.profile-action-btn {
  width: 214px;
  min-height: 64px;
  border-radius: 8px;
  font-size: 18px;
}

.profile-dialog-card {
  min-width: 350px;
}

@media (max-width: 900px) {
  .profile-card {
    padding: 28px 24px;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .profile-card {
    padding: 22px 14px;
  }

  .profile-actions {
    flex-direction: column-reverse;
  }

  .profile-action-btn {
    width: 100%;
  }
}
</style>
