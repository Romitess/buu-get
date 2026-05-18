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

    <!-- Form -->
    <q-form @submit.prevent="onSubmit">
      <!-- Email -->
      <div class="q-mb-md">
        <div class="text-body2 text-weight-medium q-mb-xs">
          {{ $t('profile.emailUsername') }}
        </div>
        <q-input
          v-model="email"
          outlined
          dense
          :placeholder="$t('profile.emailPlaceholder')"
          class="custom-input"
        />
      </div>

      <!-- Password -->
      <div class="q-mb-md">
        <div class="text-body2 text-weight-medium q-mb-xs">
          {{ $t('profile.passwordFormat') }}
        </div>
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          class="custom-input"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
              color="grey-6"
              size="20px"
            />
          </template>
        </q-input>
      </div>

      <!-- Confirm Password -->
      <div class="q-mb-lg">
        <div class="text-body2 text-weight-medium q-mb-xs">
          {{ $t('profile.confirmPassword') }}
        </div>
        <q-input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          outlined
          dense
          class="custom-input"
        >
          <template v-slot:append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
              color="grey-6"
              size="20px"
            />
          </template>
        </q-input>
      </div>

      <!-- Divider -->
      <div class="row items-center q-mb-md">
        <q-separator class="col" color="grey-4" />
        <div class="q-px-sm text-grey-6 text-body2 font-weight-medium">
          {{ $t('profile.or') }}
        </div>
        <q-separator class="col" color="grey-4" />
      </div>

      <!-- ThaID Button -->
      <q-btn class="full-width thaid-btn q-mb-lg" no-caps unelevated>
        <q-icon name="fingerprint" size="xs" class="q-mr-sm" />
        {{ $t('profile.thaidRegister') }}
      </q-btn>

      <!-- Bottom Action Buttons: Cancel and Next -->
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-btn
            color="grey-3"
            text-color="black"
            class="full-width submit-btn btn-cancel"
            :label="$t('profile.cancel')"
            no-caps
            unelevated
            @click="goToLogin"
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

// Watch userType and change locale dynamically
watch(userType, (newVal) => {
  locale.value = newVal === 'thai' ? 'th' : 'en-US';
});
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const goToLogin = (): void => {
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

<style scoped>
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

/* User Type Toggle (hidden in template but kept just in case) */
.user-type-toggle {
  display: flex;
  background-color: var(--neutral-100);
  border-radius: 10px;
  padding: 4px;
}
.toggle-btn {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 8px;
  color: var(--neutral-500);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.toggle-btn.active {
  background-color: var(--surface-card);
  color: var(--primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* ThaID Button - Premium Deep Navy */
.thaid-btn {
  background-color: var(--thaid-bg) !important;
  color: var(--text-on-primary) !important;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
  transition: all 0.3s ease;
}
.thaid-btn:hover {
  filter: brightness(1.12);
  box-shadow: 0 8px 20px rgba(var(--thaid-bg-rgb), 0.2) !important;
}

/* Form Inputs */
.custom-input :deep(.q-field__control) {
  border-radius: 8px;
  border-color: var(--neutral-200);
}

/* Submit Button & Cancel Button */
.submit-btn {
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
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
