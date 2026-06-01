<template>
  <div class="register-card q-pa-lg">
    <!-- BUU Circular Logo -->
    <div class="row justify-center q-mb-md">
      <img src="~assets/img/buu-logo.png" :alt="$t('profile.buuLogoAlt')" class="buu-logo-img" />
    </div>

    <!-- Title & Subtitle -->
    <div class="text-center q-mb-lg">
      <div class="text-h5 text-weight-bold text-primary">
        {{ $t('profile.register') }}
      </div>
      <div class="text-subtitle2 text-grey-7 q-mt-xs">
        {{ $t('profile.registerSubtitle') }}
      </div>
    </div>

    <!-- Form -->
    <q-form ref="formRef" @submit.prevent="onSubmit" class="register-form">
      <!-- Email -->
      <div class="field-block">
        <label>{{ $t('profile.emailUsername') }}</label>
        <q-input
          v-model="email"
          outlined
          dense
          :placeholder="$t('profile.emailPlaceholder')"
          class="field-input"
          :rules="[
            (val) => !!val || $t('profile.requiredEmail'),
            (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'รูปแบบอีเมลไม่ถูกต้อง',
          ]"
          lazy-rules
        />
      </div>

      <!-- Password -->
      <div class="field-block">
        <label>{{ $t('profile.passwordFormat') }}</label>
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          class="field-input"
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
        <label>{{ $t('profile.confirmPassword') }}</label>
        <q-input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          outlined
          dense
          class="field-input"
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

      <Transition name="expand">
        <div v-if="userType === 'thai'" class="thaid-section">
          <div class="or-divider">
            <span>{{ $t('profile.or') }}</span>
          </div>
          <q-btn class="full-width thaid-btn q-mb-lg" unelevated no-caps>
            <q-icon name="fingerprint" size="xs" class="q-mr-sm" />
            {{ $t('profile.thaidRegister') }}
          </q-btn>
        </div>
      </Transition>

      <!-- Bottom Action Buttons: Cancel and Next -->
      <div class="row q-col-gutter-md">
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
            :label="$t('profile.next')"
            no-caps
            unelevated
          />
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { QForm } from 'quasar';
import type { RegisterCredentials } from 'src/types/register';
import { useFocusFirstInvalidField } from 'src/composables/use-focus-first-invalid-field';

const emit = defineEmits<{
  register: [payload: RegisterCredentials];
}>();

const { locale } = useI18n();
const router = useRouter();

// State
const userType = ref<'thai' | 'foreigner'>('thai');
const formRef = ref<QForm | null>(null);
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const { validateAndFocusFirstInvalid } = useFocusFirstInvalidField(formRef);

// Lifecycle
onMounted(() => {
  userType.value = locale.value === 'th' ? 'thai' : 'foreigner';
});

// Methods
const onCancel = (): void => {
  void router.push('/login');
};

const onSubmit = async (): Promise<void> => {
  const isValid = await validateAndFocusFirstInvalid();
  if (!isValid) {
    return;
  }

  emit('register', {
    email: email.value,
    password: password.value,
    userType: userType.value,
  });
};
</script>

<style scoped lang="scss">
// ============================================================
// Card Shell
// ============================================================
.register-card {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.buu-logo-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

// ============================================================
// Form & Fields
// ============================================================
.register-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-block {
  label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--neutral-900);
    margin-bottom: 6px;
  }
}

.field-input {
  :deep(.q-field__control) {
    background: var(--neutral-50);
    border-radius: 10px;
    border-color: var(--neutral-200);
    transition: all 0.2s;
  }

  :deep(.q-field__control:hover::before) {
    border-color: var(--neutral-400);
  }

  :deep(.q-field--focused .q-field__control::before) {
    border-color: var(--primary);
    border-width: 1.5px;
  }
}

.field-icon {
  color: var(--neutral-400);
  font-size: 18px;
}

// ============================================================
// ThaID Section
// ============================================================
.thaid-section {
  overflow: hidden;
}

.q-btn.thaid-btn {
  width: 100%;
  background-color: var(--thaid-bg);
  color: var(--text-on-primary);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 0;
  transition: all 0.2s ease;

  &:hover {
    filter: brightness(1.12);
    box-shadow: 0 8px 20px rgba(var(--thaid-bg-rgb), 0.2);
  }
}

.or-divider {
  display: flex;
  align-items: center;
  margin: 10px 0 14px;
  gap: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--neutral-200);
  }

  span {
    font-size: 0.78rem;
    color: var(--neutral-400);
    white-space: nowrap;
    font-weight: 500;
  }
}

// ============================================================
// Action Buttons Row
// ============================================================
.q-btn.cancel-btn {
  width: 100%;
  height: 52px;
  background: var(--neutral-200);
  color: var(--neutral-700);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.25s;

  &:hover {
    filter: brightness(0.92);
    transform: translateY(-1px);
  }
}

.q-btn.submit-btn {
  width: 100%;
  height: 52px;
  background: var(--primary);
  color: var(--text-on-primary);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.25s;

  &:hover {
    filter: brightness(0.9);
    transform: translateY(-1px);
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
