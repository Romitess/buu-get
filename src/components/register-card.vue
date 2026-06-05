<template>
  <div class="register-card q-pa-lg">
    <!-- BUU Circular Logo -->
    <div class="row justify-center q-mb-xs">
      <img src="~assets/img/buu-logo.png" :alt="$t('profile.buuLogoAlt')" class="buu-logo-img" />
    </div>

    <!-- Title -->
    <div class="text-center q-mb-md">
      <div class="register-title">
        {{ $t('profile.register') }}
      </div>
    </div>

    <!-- Form -->
    <q-form ref="formRef" @submit.prevent="onSubmit" class="register-form">
      <!-- Email -->
      <div class="field-block">
        <label class="buu-label-muted">{{ $t('profile.email') }}</label>
        <q-input
          v-model="email"
          outlined
          dense
          :placeholder="$t('profile.emailPlaceholder')"
          class="field-input buu-input-muted"
          :rules="[
            (val) => !!val || $t('profile.requiredEmail'),
            (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง',
          ]"
          lazy-rules
        />
      </div>

      <!-- Password -->
      <div class="field-block">
        <label class="buu-label-muted">{{ $t('profile.password') }}</label>
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          class="field-input buu-input-muted"
          :rules="[
            (val) => !!val || $t('profile.requiredPassword'),
            (val) => val.length >= 8 || $t('profile.passwordFormat'),
          ]"
          lazy-rules
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer field-icon"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </div>

      <!-- Confirm Password -->
      <div class="field-block">
        <label class="buu-label-muted">{{ $t('profile.confirmPassword') }}</label>
        <q-input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          outlined
          dense
          class="field-input buu-input-muted"
          :rules="[
            (val) => !!val || $t('profile.requiredConfirmPassword'),
            (val) => val === password || $t('profile.passwordMismatch'),
          ]"
          lazy-rules
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
            <q-icon name="fingerprint" size="sm" class="q-mr-sm" />
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
import { ref, onMounted } from 'vue';
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
  width: 100%;
  max-width: 500px;
  background: var(--surface-card);
  border-radius: 12px;
  // padding: 40px 36px 36px;
  font-family: var(--font-family-base);
}

.buu-logo-img {
  width: 75px;
  height: 75px;
  object-fit: contain;
  transform: translateY(-8px);
}

.logo-section {
  margin-bottom: 4px;
}

.register-title {
  font-size: 1.8rem;
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

.field-block {
  label {
    display: block;
    font-size: 0.95rem;
    font-weight: 700;
    color: #000;
    margin-bottom: 2px;
  }
}

.field-input {
  :deep(.q-field__control) {
    background: #fff;
    border-radius: 4px;
    border: 1px solid var(--neutral-200);
    transition: all 0.2s;
    height: 48px;
  }

  :deep(.q-field__native) {
    font-size: 0.95rem;
    padding: 0 10px;
  }

  :deep(.q-field__bottom) {
    padding: 2px 0 0;
  }
}

.field-icon {
  color: var(--neutral-400);
  font-size: 18px;
}

.otp-helper-text {
  font-size: 0.8rem;
  color: var(--neutral-400);
  font-weight: 400;
  margin-top: -2px;
}

// ============================================================
// Action Buttons Row
// ============================================================
.q-btn.cancel-btn {
  height: 56px;
  background: var(--neutral-200) !important;
  color: #000;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.25s;

  &:hover {
    filter: brightness(0.95);
  }
}

.q-btn.submit-btn {
  height: 56px;
  background: var(--primary) !important;
  color: var(--text-on-primary);
  border-radius: 8px;
  font-size: 1rem;
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
  background-color: var(--thaid-bg) !important;
  color: #fff;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 500;
  padding: 14px 0;
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
    font-size: 0.85rem;
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
