<template>
  <div class="register-card q-pa-lg">
    <!-- BUU Circular Logo -->
    <div class="row justify-center q-mb-md">
      <img src="~assets/img/buu-logo.png" alt="BUU Logo" class="buu-logo-img" />
    </div>

    <!-- Title -->
    <div class="text-center q-mb-lg">
      <div class="text-h5 text-weight-bold">
        {{ $t('profile.register') }}
      </div>
    </div>

    <!-- User Type Toggle -->
    <div class="type-toggle q-mb-lg">
      <button
        type="button"
        class="toggle-btn"
        :class="{ active: userType === 'thai' }"
        @click="userType = 'thai'"
      >
        {{ $t('auth.thaiPerson') }}
      </button>
      <button
        type="button"
        class="toggle-btn"
        :class="{ active: userType === 'foreigner' }"
        @click="userType = 'foreigner'"
      >
        {{ $t('auth.foreigner') }}
      </button>
      <div class="toggle-slider" :class="{ right: userType === 'foreigner' }"></div>
    </div>

    <!-- Form -->
    <q-form @submit.prevent="onSubmit" class="register-form">
      <!-- Email -->
      <div class="field-block">
        <label>{{ $t('profile.emailUsername') }}</label>
        <q-input
          v-model="email"
          outlined
          dense
          :placeholder="$t('profile.emailPlaceholder')"
          class="field-input"
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
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
              color="grey-6"
              size="18px"
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
        >
          <template v-slot:append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
              color="grey-6"
              size="18px"
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
            color="grey-3"
            text-color="black"
            class="full-width submit-btn btn-cancel"
            :label="$t('profile.cancel')"
            no-caps
            unelevated
            @click="onCancel"
          />
        </div>
        <div class="col-6">
          <q-btn
            type="submit"
            color="primary"
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
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

export interface RegisterCredentials {
  email: string;
  password: string;
  userType: 'thai' | 'foreigner';
}

const emit = defineEmits<{
  register: [payload: RegisterCredentials];
}>();

const { locale } = useI18n();
const router = useRouter();

const userType = ref<'thai' | 'foreigner'>('thai');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Watch userType and change locale dynamically
watch(userType, (newVal) => {
  locale.value = newVal === 'thai' ? 'th' : 'en-US';
});

const onCancel = (): void => {
  void router.push('/login');
};

const onSubmit = (): void => {
  if (!email.value || !password.value || !confirmPassword.value) {
    return;
  }
  if (password.value !== confirmPassword.value) {
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

/* BUU Logo */
.buu-logo-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

/* User Type Toggle */
.type-toggle {
  position: relative;
  display: flex;
  background-color: var(--neutral-100);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.toggle-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--surface-card);
  border-radius: 9px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-slider.right {
  transform: translateX(100%);
}

.toggle-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--neutral-500);
  cursor: pointer;
  transition: color 0.25s;
  border-radius: 9px;
}

.toggle-btn.active {
  color: var(--primary);
}

// ============================================================
// Header
// ============================================================
.card-header {
  text-align: center;
  margin-bottom: 16px;

  .crest-img {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: contain;
    margin: 0 auto 12px;
    filter: drop-shadow(0 2px 8px rgba(13, 71, 161, 0.12));
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--neutral-900);
    margin: 0;
    letter-spacing: -0.01em;
  }
}

// ============================================================
// Type Toggle
// ============================================================
.type-toggle {
  position: relative;
  display: flex;
  background: var(--neutral-100);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;

  .toggle-slider {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: var(--surface-card);
    border-radius: 9px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &.right {
      transform: translateX(100%);
    }
  }

  .toggle-btn {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 10px 0;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--neutral-400);
    cursor: pointer;
    transition: color 0.25s;
    border-radius: 9px;

    &.active {
      color: var(--primary);
    }
  }
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

// ============================================================
// ThaID Section
// ============================================================
.thaid-section {
  overflow: hidden;
}

.thaid-btn {
  width: 100%;
  background-color: var(--thaid-bg) !important;
  color: var(--text-on-primary) !important;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 0;
  transition: all 0.2s ease;
}

.thaid-btn:hover {
  filter: brightness(1.12);
  box-shadow: 0 8px 20px rgba(var(--thaid-bg-rgb), 0.2) !important;
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
.cancel-btn {
  width: 100%;
  height: 52px;
  background: var(--neutral-100) !important;
  color: var(--neutral-700) !important;
  border-radius: 12px !important;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.25s;

  &:hover {
    background: var(--neutral-200) !important;
    transform: translateY(-1px);
  }
}

.submit-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%) !important;
  color: var(--text-on-primary) !important;
  border-radius: 12px !important;
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(13, 71, 161, 0.2) !important;
  transition: all 0.25s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(13, 71, 161, 0.3) !important;
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

.btn-cancel {
  background-color: var(--neutral-200) !important;
  color: var(--neutral-700) !important;
  transition: all 0.3s ease;
}
.btn-cancel:hover {
  filter: brightness(0.95);
}
</style>
