<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="otp-card">
      <q-btn
        flat
        round
        dense
        icon="close"
        class="otp-close-btn"
        :disable="isBusy"
        @click="emit('update:modelValue', false)"
      />

      <div class="otp-icon-wrap">
        <q-icon name="mail" size="32px" color="dark" />
      </div>

      <div class="otp-title">{{ tr('profile.otpTitle', 'ยืนยันรหัส OTP') }}</div>
      <div class="otp-subtitle">
        {{ tr('profile.otpSubtitle', 'กรุณากรอกรหัส OTP ที่ส่งไปยังอีเมลของคุณ') }}
      </div>
      <div class="otp-timer">{{ formattedTime }}</div>

      <div class="otp-input-row">
        <q-input
          v-for="(_, index) in otpDigits"
          :key="index"
          :ref="(el) => setOtpInputRef(el, index)"
          :model-value="otpDigits[index] ?? ''"
          outlined
          dense
          maxlength="1"
          input-class="text-center otp-digit-input"
          class="otp-digit"
          :disable="isBusy"
          @update:model-value="(value) => onDigitInput(value, index)"
          @keydown="(event: KeyboardEvent) => onDigitKeydown(event, index)"
          @paste="onPaste"
        />
      </div>

      <q-btn
        unelevated
        color="primary"
        class="otp-confirm-btn"
        :label="tr('profile.otpConfirm', 'ยืนยัน')"
        :loading="isVerifying"
        :disable="otpValue.length !== otpDigits.length || isSending"
        @click="emit('verify', otpValue)"
      />

      <button class="otp-resend-btn" type="button" :disabled="isBusy" @click="handleResend">
        {{ tr('profile.otpResend', 'ส่งรหัสอีกครั้ง') }}
      </button>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  modelValue: boolean;
  isSending?: boolean;
  isVerifying?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSending: false,
  isVerifying: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  verify: [otp: string];
  resend: [];
}>();

const i18n = useI18n();
const { t } = i18n;
const tr = (key: string, fallback: string): string => (i18n.te(key) ? t(key) : fallback);

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 5 * 60;

type FocusableInput = { focus: () => void };

const otpDigits = ref<string[]>(Array.from({ length: OTP_LENGTH }, () => ''));
const otpInputRefs = ref<Array<FocusableInput | null>>([]);
const remainingSeconds = ref(COUNTDOWN_SECONDS);
let timerId: number | null = null;

const isBusy = computed<boolean>(() => props.isSending || props.isVerifying);
const otpValue = computed<string>(() => otpDigits.value.join(''));
const formattedTime = computed<string>(() => {
  const minutes = Math.floor(remainingSeconds.value / 60);
  const seconds = remainingSeconds.value % 60;
  return `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
});

const setOtpInputRef = (el: unknown, index: number): void => {
  otpInputRefs.value[index] = el as FocusableInput | null;
};

const focusInput = async (index: number): Promise<void> => {
  await nextTick();
  otpInputRefs.value[index]?.focus();
};

const resetOtp = (): void => {
  otpDigits.value = Array.from({ length: OTP_LENGTH }, () => '');
  void focusInput(0);
};

const startTimer = (): void => {
  if (timerId) {
    window.clearInterval(timerId);
  }

  remainingSeconds.value = COUNTDOWN_SECONDS;
  timerId = window.setInterval(() => {
    if (remainingSeconds.value <= 0) {
      if (timerId !== null) {
        window.clearInterval(timerId);
      }
      timerId = null;
      return;
    }

    remainingSeconds.value -= 1;
  }, 1000);
};

const onDigitInput = (value: string | number | null, index: number): void => {
  const digit = String(value ?? '')
    .replace(/\D/g, '')
    .slice(-1);
  otpDigits.value[index] = digit;

  if (digit && index < OTP_LENGTH - 1) {
    void focusInput(index + 1);
  }
};

const onDigitKeydown = (event: KeyboardEvent, index: number): void => {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    void focusInput(index - 1);
  }
};

const onPaste = (event: ClipboardEvent): void => {
  const pasted = event.clipboardData?.getData('text') ?? '';
  const digits = pasted.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
  if (!digits.length) return;

  event.preventDefault();
  otpDigits.value = Array.from({ length: OTP_LENGTH }, (_, index) => digits[index] ?? '');
  void focusInput(Math.min(digits.length, OTP_LENGTH - 1));
};

const handleResend = (): void => {
  resetOtp();
  startTimer();
  emit('resend');
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetOtp();
      startTimer();
      return;
    }

    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  },
);

onBeforeUnmount(() => {
  if (timerId) {
    window.clearInterval(timerId);
  }
});
</script>

<style scoped lang="scss">
.otp-card {
  width: min(429px, calc(100vw - 32px));
  border-radius: 7px;
  padding: 28px 42px 16px;
  position: relative;
  text-align: center;
  font-family: var(--font-family-base);
}

.otp-close-btn {
  position: absolute;
  top: 9px;
  right: 11px;
  color: #8a8a8a;
}

.otp-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #dedede;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.otp-title {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 700;
  color: #050505;
  margin-bottom: 8px;
}

.otp-subtitle {
  font-size: 16px;
  line-height: 1.4;
  color: #666;
  margin-bottom: 9px;
}

.otp-timer {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--q-primary);
  margin-bottom: 13px;
}

.otp-input-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 7px;
  margin-bottom: 16px;
}

.otp-digit {
  :deep(.q-field__control) {
    height: 59px;
    border-radius: 5px;
  }
}

:deep(.otp-digit-input) {
  font-size: 28px;
  font-weight: 700;
}

.otp-confirm-btn {
  width: 100%;
  min-height: 38px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 11px;
}

.otp-resend-btn {
  border: 0;
  background: transparent;
  color: #666;
  font-size: 14px;
  text-decoration: underline;
  cursor: pointer;
}

.otp-resend-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 600px) {
  .otp-card {
    padding: 23px 13px 15px;
  }

  .otp-input-row {
    gap: 4px;
  }

  .otp-digit {
    :deep(.q-field__control) {
      height: 43px;
    }
  }
}
</style>
