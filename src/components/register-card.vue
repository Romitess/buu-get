<template>
  <q-card class="register-card shadow-1 q-pa-lg">
    <!-- Toggle Buttons -->
    <div class="user-type-toggle q-mb-lg">
      <div class="toggle-btn" :class="{ active: userType === 'thai' }" @click="userType = 'thai'">
        {{ $t('profile.userTypeThai') }}
      </div>
      <div
        class="toggle-btn"
        :class="{ active: userType === 'foreigner' }"
        @click="userType = 'foreigner'"
      >
        {{ $t('profile.userTypeForeigner') }}
      </div>
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

      <!-- Submit Button -->
      <q-btn
        type="submit"
        color="primary"
        class="full-width q-mb-md submit-btn"
        :label="$t('profile.register')"
        no-caps
        unelevated
      />

      <!-- Extra options container to maintain fixed card height without jumping -->
      <div :style="{ visibility: userType === 'thai' ? 'visible' : 'hidden' }">
        <!-- Divider -->
        <div class="row items-center q-mb-md">
          <q-separator class="col" color="grey-4" />
          <div class="q-px-sm text-grey-6 text-body2 font-weight-medium">
            {{ $t('profile.or') }}
          </div>
          <q-separator class="col" color="grey-4" />
        </div>

        <!-- ThaID Button -->
        <q-btn class="full-width thaid-btn" no-caps unelevated :disable="userType !== 'thai'">
          <q-icon name="fingerprint" size="xs" class="q-mr-sm" />
          {{ $t('profile.thaidRegister') }}
        </q-btn>
      </div>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export interface RegisterCredentials {
  email: string;
  password: string;
  userType: 'thai' | 'foreigner';
}

const emit = defineEmits<{
  register: [payload: RegisterCredentials];
}>();

const { locale } = useI18n();

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
  max-width: 420px;
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08) !important;
  margin: 0 auto;
}

/* User Type Toggle */
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

/* ThaID Button */
.thaid-btn {
  background-color: var(--thaid-bg);
  color: var(--text-on-primary);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
}

/* Form Inputs */
.custom-input :deep(.q-field__control) {
  border-radius: 8px;
  border-color: var(--neutral-200);
}

/* Submit Button */
.submit-btn {
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
}
</style>
