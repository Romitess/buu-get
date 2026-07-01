<template>
  <div class="register-card">
    <!-- BUU Circular Logo -->
    <div class="row justify-center q-mb-xs">
      <img src="~assets/img/buu-logo.png" :alt="$t('profile.buuLogoAlt')" class="buu-logo-img" />
    </div>

    <!-- Title -->
    <div class="text-center q-mb-sm">
      <div class="register-title">
        {{ $t('profile.register') }}
      </div>
    </div>

    <!-- Form -->
    <q-form ref="formRef" @submit.prevent="onSubmit" class="register-form">
      <!-- Email -->
      <div class="field-block">
        <div class="text-body2 text-weight-medium q-mb-xs field-label block">
          {{ $t('profile.email') }}
        </div>
        <q-input
          v-model="email"
          outlined
          dense
          :placeholder="$t('profile.emailPlaceholder')"
          class="custom-input"
          :rules="[
            (val) => !!val || $t('profile.requiredEmail'),
            (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง',
          ]"
          lazy-rules
          hide-bottom-space
        />
      </div>

      <!-- Password -->
      <div class="field-block">
        <div class="text-body2 text-weight-medium q-mb-xs field-label block">
          {{ $t('profile.password') }}
        </div>
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          class="custom-input password-input"
          :rules="[validatePassword]"
          lazy-rules
          hide-bottom-space
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer field-icon"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <div class="password-requirements" aria-live="polite">
          <div
            v-for="requirement in passwordRequirements"
            :key="requirement.label"
            class="password-requirement"
            :class="{ 'password-requirement--met': requirement.isMet }"
          >
            <q-icon
              :name="requirement.isMet ? 'check_circle' : 'circle'"
              :size="requirement.isMet ? '11px' : '7px'"
            />
            <span>{{ requirement.label }}</span>
          </div>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="field-block">
        <div class="text-body2 text-weight-medium q-mb-xs field-label block">
          {{ $t('profile.confirmPassword') }}
        </div>
        <q-input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          outlined
          dense
          class="custom-input"
          :rules="[
            (val) => !!val || $t('profile.requiredConfirmPassword'),
            (val) => val === password || $t('profile.passwordMismatch'),
          ]"
          lazy-rules
          hide-bottom-space
        >
          <template v-slot:append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer field-icon"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </q-input>
      </div>

      <!-- OTP Helper Text -->
      <div class="otp-helper-text">
        {{ $t('profile.emailOtpHelper') }}
      </div>

      <!-- Bottom Action Buttons: Cancel and Send OTP -->
      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-btn
            type="button"
            class="full-width cancel-btn"
            :label="$t('profile.cancel')"
            no-caps
            unelevated
            @click="onCancel"
          />
        </div>
        <div class="col-6">
          <q-btn
            type="submit"
            class="full-width submit-btn"
            :label="$t('profile.sendOtp')"
            :loading="isSendingOtp"
            no-caps
            unelevated
          />
        </div>
      </div>

      <!-- Divider & ThaiID Button -->
      <Transition name="expand">
        <div v-if="userType === 'thai'" class="thaid-section">
          <div class="or-divider">
            <span>{{ $t('profile.or') }}</span>
          </div>
          <q-btn class="full-width thaid-btn" unelevated no-caps @click="onThaiID">
            <q-icon name="fingerprint" size="20px" class="q-mr-sm" />
            {{ $t('profile.thaidRegister') }}
          </q-btn>
        </div>
      </Transition>
    </q-form>

    <!-- OTP Verification Dialog -->
    <OtpVerificationDialog
      v-model="showOtpDialog"
      :is-sending="isSendingOtp"
      :is-verifying="isVerifyingOtp"
      @verify="handleVerifyOtp"
      @resend="handleResendOtp"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { QForm } from 'quasar';
import type { RegisterCredentials } from 'src/types/register';
import { useFocusFirstInvalidField } from 'src/composables/use-focus-first-invalid-field';
import { useAuthStore } from 'src/stores/auth.store';
import OtpVerificationDialog from 'src/components/register/otp-verification-dialog.vue';

const emit = defineEmits<{
  register: [payload: RegisterCredentials];
  'thaid-register': [payload: RegisterCredentials];
}>();

const i18n = useI18n();
const { locale } = i18n;
const { t } = i18n;
const tr = (key: string, fallback: string): string => (i18n.te(key) ? t(key) : fallback);
const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

// State
const userType = ref<'thai' | 'foreigner'>('thai');
const formRef = ref<QForm | null>(null);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const showOtpDialog = ref(false);
const isSendingOtp = ref(false);
const isVerifyingOtp = ref(false);
const { validateAndFocusFirstInvalid } = useFocusFirstInvalidField(formRef);

interface PasswordRequirement {
  label: string;
  isMet: boolean;
}

const passwordRequirements = computed<PasswordRequirement[]>(() => [
  {
    label: t('profile.passwordRequirementMinLength'),
    isMet: password.value.length >= 8,
  },
  {
    label: t('profile.passwordRequirementUppercase'),
    isMet: /[A-Z]/u.test(password.value),
  },
  {
    label: t('profile.passwordRequirementSpecial'),
    isMet: /[!@#]/u.test(password.value),
  },
]);

const validatePassword = (): true | string => {
  if (!password.value) {
    return t('profile.requiredPassword');
  }

  return passwordRequirements.value.every((requirement) => requirement.isMet)
    ? true
    : t('profile.passwordRequirementError');
};

// Lifecycle
onMounted(() => {
  userType.value = locale.value === 'th' ? 'thai' : 'foreigner';
});

// Methods
const onCancel = (): void => {
  void router.push('/login');
};

/** ส่ง OTP ไปที่ email ที่กรอก */
const sendOtp = async (): Promise<boolean> => {
  isSendingOtp.value = true;

  try {
    const response = await authStore.sendOtp(email.value);
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

/** กด Submit → validate form → ส่ง OTP → เปิด dialog */
const onSubmit = async (): Promise<void> => {
  const isValid = await validateAndFocusFirstInvalid();
  if (!isValid) {
    return;
  }

  const isSent = await sendOtp();
  if (isSent) {
    showOtpDialog.value = true;
  }
};

/** ยืนยัน OTP สำเร็จ → emit register event */
const handleVerifyOtp = async (otp: string): Promise<void> => {
  isVerifyingOtp.value = true;

  try {
    const response = await authStore.verifyOtp(email.value, otp);
    if (!response.success) {
      $q.notify({
        type: 'negative',
        message: response.message || tr('profile.otpVerifyError', 'ไม่สามารถยืนยันรหัส OTP ได้'),
        position: 'top',
      });
      return;
    }

    showOtpDialog.value = false;

    // OTP verified สำเร็จ → ไปหน้า profile form
    emit('register', {
      email: email.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
      userType: userType.value,
      registrationMethod: 'email',
    });
  } finally {
    isVerifyingOtp.value = false;
  }
};

/** ส่ง OTP อีกครั้ง */
const handleResendOtp = async (): Promise<void> => {
  await sendOtp();
};

/** กดปุ่ม ThaiD → emit thaid-register event */
const onThaiID = (): void => {
  emit('thaid-register', {
    email: '',
    password: '',
    userType: 'thai',
    registrationMethod: 'thaid',
  });
};
</script>

<style scoped lang="scss">
// ============================================================
// Card Shell
// ============================================================
.register-card {
  width: 85%;
  max-width: 100%;
  margin: clamp(8px, 2vw, 12px) auto;
  background: transparent;
  padding: 0;
  font-family: var(--font-family-base);
}

.buu-logo-img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  transform: translateY(-8px);
}

.logo-section {
  margin-bottom: 4px;
}

.register-title {
  font-size: clamp(1.56rem, 5.18vw, 1.87rem);
  font-weight: 800;
  color: #000;
}

// ============================================================
// Form & Fields
// ============================================================
.register-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.password-requirements {
  display: grid;
  gap: 2px;
  margin-top: 3px;
}

.password-requirement {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--neutral-400);
  font-size: 0.84rem;
  line-height: 1.15;

  .q-icon {
    flex: 0 0 auto;
  }
}

.password-requirement--met {
  color: #21ba45;
}

.field-icon {
  color: var(--neutral-400);
  font-size: 18px;
}

.otp-helper-text {
  font-size: 0.91rem;
  color: var(--neutral-400);
  font-weight: 400;
  margin-top: -2px;
}

// ============================================================
// Action Buttons Row
// ============================================================
.q-btn.cancel-btn {
  height: 55px;
  background: var(--neutral-200) !important;
  color: #000;
  border-radius: 8px;
  font-size: 1.03rem;
  font-weight: 500;
  transition: all 0.25s;

  &:hover {
    filter: brightness(0.95);
  }
}

.q-btn.submit-btn {
  height: 55px;
  background: var(--primary) !important;
  color: var(--text-on-primary);
  border-radius: 8px;
  font-size: 1.03rem;
  font-weight: 500;
  transition: all 0.25s;

  &:hover {
    filter: brightness(0.9);
  }
}

// ============================================================
// ThaID Section
// ============================================================
.thaid-section {
  overflow: hidden;
}

.q-btn.thaid-btn {
  width: 100%;
  height: 55px;
  background-color: var(--thaid-bg) !important;
  color: #fff;
  border-radius: 8px;
  font-size: 1.09rem;
  font-weight: 500;
  padding: 0;
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.1);
  }
}

.or-divider {
  display: flex;
  align-items: center;
  margin: 4px 0 8px;
  gap: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1.2px;
    background: var(--neutral-400);
  }

  span {
    font-size: 1.22rem;
    color: var(--neutral-400);
    white-space: nowrap;
    font-weight: 500;
  }
}

// ============================================================
// Transitions
// ============================================================
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
