<template>
  <div class="register-profile-form">
    <!-- Match mockup styling: no heavy shadow, soft border, rounded corners -->
    <q-card class="shadow-0 profile-card">
      <q-form
        ref="formRef"
        class="profile-form"
        greedy
        @submit.prevent="onSubmit"
        @validation-error="onValidationError"
      >
        <!-- ─── Title ─── -->
        <div class="profile-form-title">
          <q-icon name="people" size="20px" color="dark" />
          <div class="text-h6 text-weight-medium">{{ t('profile.personalInfo') }}</div>
        </div>

        <!-- ─── 2×2 Grid Layout ─── -->
        <div class="profile-form-grid">
          <!-- (1,1) รูปภาพ + ข้อกำหนดรูปภาพ -->
          <div class="profile-grid-cell profile-grid-cell--fill">
            <PhotoSection v-model:profile-image="formData.profileImage" />
          </div>

          <!-- (1,2) วันเกิด / ระดับการศึกษา / คณะ-สาขา -->
          <div class="profile-grid-cell">
            <EducationSection
              v-model:birthdate="formData.birthdate"
              v-model:education-level="formData.educationLevel"
              v-model:faculty="formData.faculty"
            />
          </div>

          <!-- (2,1) ข้อมูลตัวตน 4 ฟิลด์ -->
          <div class="profile-grid-cell">
            <IdentityFields
              :is-thai="isThailand"
              :is-edit-mode="isEditMode"
              :lock-national-id="isThaiDPath && !!props.thaidPrefill?.prefill.nationalId"
              v-model:national-id="formData.nationalId"
              v-model:country="formData.country"
              v-model:title-t-h="formData.titleTH"
              v-model:full-name="formData.fullName"
              v-model:english-name="formData.englishName"
              @title-th-change="handleTitleTHChange"
            />
          </div>

          <div v-if="isThaiDPath" class="profile-grid-cell">
            <AppFormField
              :model-value="formData.password ?? ''"
              type="password"
              :label="t('auth.password')"
              :required="true"
              :rules="[passwordRule]"
              reserve-bottom-space
              @update:model-value="onThaidPassword"
            />
            <AppFormField
              :model-value="formData.confirmPassword ?? ''"
              type="password"
              :label="t('profile.confirmPassword')"
              :required="true"
              :rules="[requiredRule, confirmPasswordRule]"
              reserve-bottom-space
              @update:model-value="onThaidConfirmPassword"
            />
          </div>

          <!-- (2,2) สถานศึกษา / ที่อยู่ / เบอร์โทร (+ ThaiD: checkbox + อีเมล) -->
          <div class="profile-grid-cell">
            <ContactFields
              :email="formData.email"
              :show-email-field="isThaiDPath"
              :show-address-checkbox="isThaiDPath"
              v-model:institution="formData.institution"
              v-model:address="formData.address"
              v-model:phone="formData.phone"
              @update:email="onEmailUpdate"
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
            :loading="isSendingOtp || props.isSubmitting"
            :disable="props.isSubmitting"
            unelevated
          />
        </div>
      </q-form>
    </q-card>

    <!-- OTP Verification Dialog (ใช้เฉพาะ ThaiD path) -->
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

import PhotoSection from 'src/components/register/photo-section.vue';
import EducationSection from 'src/components/register/education-section.vue';
import IdentityFields from 'src/components/register/identity-fields.vue';
import ContactFields from 'src/components/register/contact-fields.vue';
import AppFormField from 'src/components/base/app-form-field.vue';
import OtpVerificationDialog from 'src/components/register/otp-verification-dialog.vue';
import type { ThaidPrefillSession } from 'src/services/thaid.service';

interface Props {
  initialEditMode: boolean;
  isThai?: boolean;
  credentials?: RegisterCredentials;
  userData?: User | null;
  registrationMethod?: 'email' | 'thaid';
  isSubmitting?: boolean;
  thaidPrefill?: ThaidPrefillSession | null;
}

const props = withDefaults(defineProps<Props>(), {
  isThai: true,
  registrationMethod: 'email',
  isSubmitting: false,
  thaidPrefill: null,
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
const { focusFirstInvalidField } = useFocusFirstInvalidField(formRef);

/** isThai มาจาก prop ที่ parent ส่งมา (ตาม userType ใน step 1) */
const isThailand = computed<boolean>(() => props.isThai);

/** ตรวจว่าเป็น ThaiD path หรือไม่ */
const isThaiDPath = computed<boolean>(() => props.registrationMethod === 'thaid');

/** Email path = skip OTP (ยืนยันไปแล้วที่ register-card) */
const skipOtp = computed<boolean>(() => props.registrationMethod === 'email');

const submitButtonText = computed<string>(() => {
  if (isEditMode.value) return t('profile.saveEdit');
  if (skipOtp.value) return tr('profile.register', 'สมัครสมาชิก');
  return tr('profile.sendOtp', 'ส่งรหัส OTP');
});

const { formData, dialog, initFormData, handleTitleTHChange, submitForm, onDialogClose } =
  useRegisterForm(isEditMode.value, (payload) => {
    emit('save', payload);
  });

const passwordRule = (val: string | number | null | undefined): true | string =>
  (typeof val === 'string' && val.length >= 8) || t('auth.thaidCallback.passwordRequired');

const requiredRule = (val: string | number | null | undefined): true | string =>
  !!val || t('profile.required');

const confirmPasswordRule = (
  val: string | number | null | undefined,
): true | string => val === formData.value.password || t('profile.passwordMismatch');

const onThaidPassword = (value: string | number | null): void => {
  formData.value.password = typeof value === 'string' ? value : '';
};

const onThaidConfirmPassword = (value: string | number | null): void => {
  formData.value.confirmPassword = typeof value === 'string' ? value : '';
};

/** อัปเดต email ใน formData เมื่อ ThaiD path user กรอก email ที่ contact-column */
const onEmailUpdate = (value: string): void => {
  formData.value.email = value;
};

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

/**
 * q-form emits submit only after validation passes.
 * On failure it emits validation-error instead — scroll/focus the first bad field.
 */
const onValidationError = async (): Promise<void> => {
  await focusFirstInvalidField();
  $q.notify({
    type: 'warning',
    message: t('profile.validationError', 'กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง'),
    position: 'top',
  });
};

const onSubmit = async (): Promise<void> => {
  // Edit mode → submit ตรง ๆ
  if (isEditMode.value) {
    submitForm();
    return;
  }

  // Email path → OTP ยืนยันไปแล้วที่ register-card → submit ตรง ๆ
  if (skipOtp.value) {
    submitForm();
    return;
  }

  // ThaiD path → ต้องส่ง OTP ที่นี่ (ตาม email ที่กรอกใน form)
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
    formData.value.confirmPassword =
      props.credentials.confirmPassword || props.credentials.password;
    formData.value.country = props.isThai ? 'TH' : '';
  }
  const prefill = props.thaidPrefill?.prefill;
  if (prefill) {
    formData.value.nationalId = prefill.nationalId;
    formData.value.titleTH = prefill.titleTH;
    formData.value.titleEN = prefill.titleEN;
    formData.value.fullName = prefill.fullName;
    formData.value.englishName = prefill.englishName;
    formData.value.birthdate = prefill.birthdate;
    if (prefill.address) {
      formData.value.address = prefill.address;
    }
    formData.value.country = 'TH';
  }
});
</script>

<style scoped lang="scss">
.register-profile-form {
  width: 100%;
  font-family: var(--font-family-base);
}

.profile-card {
  width: 100%;
  // Fit within viewport: leave room for header + footer + page padding
  max-height: calc(100vh - var(--header-height) - 150px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--q-grey-3);
  border-radius: 8px;
  padding: 16px 28px 14px;
  background: var(--surface-card);
  overflow: hidden; // Inner grid handles its own scroll
}

// Form fills the card so title/actions pin while the grid scrolls
.profile-form {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.profile-form-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  flex: 0 0 auto;
}

.profile-form-title .text-h6 {
  font-size: 18px;
  line-height: 1.3;
}

.profile-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  column-gap: 22px;
  row-gap: 10px;
  align-items: start; // Row 2 cells align at the same baseline
  // Scroll only the fields if the viewport is too short
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.profile-grid-cell {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

// (1,1) ยืดเต็มความสูงของแถว เพื่อให้กล่องรูปสูงสุด
.profile-grid-cell--fill {
  align-self: stretch;
}

.profile-card :deep(.custom-input .q-field__control) {
  min-height: 32px;
}

.profile-card :deep(.custom-input .q-field__native),
.profile-card :deep(.custom-input .q-field__input),
.profile-card :deep(.custom-input .q-field__append) {
  min-height: 32px;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  flex: 0 0 auto; // Stay pinned below the scrollable grid
}

.profile-dialog-card {
  min-width: 235px;
  font-family: var(--font-family-base);
}

@media (max-width: 900px) {
  .profile-card {
    padding: 19px 16px;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .profile-card {
    padding: 15px 9px;
  }

  .profile-actions {
    flex-direction: column-reverse;
  }

  .profile-action-btn {
    width: 100%;
  }
}
</style>
