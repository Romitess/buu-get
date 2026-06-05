<template>
  <q-page class="register-page flex flex-center">
    <!-- ===== Global Background Decorations ===== -->
    <div class="geo geo-1"></div>
    <div class="geo geo-2"></div>
    <div class="geo geo-3"></div>
    <div class="geo geo-4"></div>
    <div class="geo geo-5"></div>
    <div class="geo geo-6"></div>
    <div class="grid-lines"></div>

    <!-- ─── Step 1: Registration Card (Email + Password) ─── -->
    <template v-if="currentStep === 'credentials'">
      <div class="form-center">
        <RegisterCard @register="handleRegister" @thaid-register="handleThaiDRegister" />
      </div>
    </template>

    <!-- ─── Step 2: Profile Form (Identity + Contact Info) ─── -->
    <template v-if="currentStep === 'profile'">
      <div class="profile-form-container">
        <RegisterAndEditProfile
          :initial-edit-mode="false"
          :is-thai="isThai"
          :credentials="credentials"
          :registration-method="registrationMethod"
          @close="goBackToCredentials"
          @save="handleSave"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import RegisterCard from 'src/components/register-card.vue';
import type { RegisterCredentials } from 'src/types/register';
import type { RegisterFormData } from 'src/types/register';
import RegisterAndEditProfile from 'src/components/register-and-edit-profile.vue';
import { useAuthStore } from 'src/stores/auth.store';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

type Step = 'credentials' | 'profile';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const currentStep = ref<Step>('credentials');
const isThai = ref<boolean>(true);
const registrationMethod = ref<'email' | 'thaid'>('email');
const credentials = ref<RegisterCredentials>({
  email: '',
  password: '',
  userType: 'thai',
  registrationMethod: 'email',
});

/** Email Path: ผู้ใช้กรอกอีเมล+รหัสผ่าน + ยืนยัน OTP สำเร็จแล้ว → ไปหน้า profile */
const handleRegister = (payload: RegisterCredentials): void => {
  credentials.value = payload;
  isThai.value = payload.userType === 'thai';
  registrationMethod.value = 'email';
  currentStep.value = 'profile';
};

/** ThaiD Path: ผู้ใช้กดปุ่ม ThaiD → ไปหน้า profile (มีช่องกรอก email) */
const handleThaiDRegister = (payload: RegisterCredentials): void => {
  credentials.value = payload;
  isThai.value = true;
  registrationMethod.value = 'thaid';
  currentStep.value = 'profile';
};

/** Step 2 → Step 1: ผู้ใช้กดยกเลิกในหน้ากรอกข้อมูล */
const goBackToCredentials = (): void => {
  currentStep.value = 'credentials';
};

/** Step 2 complete: ผู้ใช้กดบันทึกข้อมูล */
const handleSave = async (formData: RegisterFormData): Promise<void> => {
  const finalData = {
    ...credentials.value,
    ...formData,
  };

  $q.loading.show();

  try {
    const response = await authStore.register(finalData);

    if (response.success) {
      $q.notify({
        type: 'positive',
        message: t('auth.notify.registerSuccess'),
        position: 'top',
      });
      await router.push('/login');
    } else {
      $q.notify({
        type: 'negative',
        message: response.message || t('auth.notify.registerFailed'),
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: t('auth.notify.connectionError'),
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
};
</script>

<style scoped lang="scss">
// ============================================================
// Page Shell
// ============================================================
.register-page {
  min-height: calc(100vh - var(--header-height));
  background: linear-gradient(
    145deg,
    var(--primary-dark) 0%,
    var(--primary) 55%,
    var(--secondary-dark) 100%
  );
  position: relative;
  padding: 40px 16px 80px;
}

.form-center {
  width: 100%;
  max-width: 540px;
  position: relative;
  z-index: 1;
  animation: fadeIn 0.7s ease-out;
}

.profile-form-container {
  width: 100%;
  position: relative;
  z-index: 1;
  animation: fadeIn 0.7s ease-out;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.12;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.18;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: rotate(45deg) translateY(0);
  }
  50% {
    transform: rotate(45deg) translateY(-14px);
  }
}
</style>
