<template>
  <q-layout view="lHh Lpr lFf" class="register-layout">
    <!-- Public Header -->
    <q-header class="bg-white text-black shadow-1">
      <q-toolbar class="q-px-xl q-py-sm flex justify-between items-center">
        <!-- Logo -->
        <div class="row items-center cursor-pointer" @click="$router.push('/')">
          <div class="text-h6 text-weight-bold text-negative brand-logo-text">
            BUU-GET
            <div class="text-caption text-weight-medium text-red-8 brand-logo-sub">
              BURAPHA UNIVERSITY
            </div>
          </div>
        </div>

        <!-- Desktop Menu -->
        <div class="row items-center q-gutter-xl text-weight-medium text-body1 gt-sm text-grey-9">
          <div class="cursor-pointer" @click="$router.push('/')">หน้าหลัก</div>
          <div class="cursor-pointer row items-center">
            รายการสอบ <q-icon name="keyboard_arrow_down" size="sm" class="q-ml-xs" />
          </div>
        </div>

        <!-- Auth Buttons -->
        <div class="row items-center q-gutter-lg">
          <div
            class="cursor-pointer text-weight-medium text-body1 text-grey-9"
            @click="$router.push('/login')"
          >
            เข้าสู่ระบบ
          </div>
          <q-btn
            color="primary"
            label="สมัครสมาชิก"
            no-caps
            unelevated
            class="text-weight-bold btn-register"
            @click="$router.push('/register')"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="register-page-bg flex flex-center">
        <!-- ─── Step 1: Registration Card (Email + Password) ─── -->
        <template v-if="currentStep === 'credentials'">
          <div class="register-container row no-wrap items-stretch">
            <!-- Left Side (Logo) - Blue Panel -->
            <div class="logo-panel flex flex-center bg-primary">
              <img src="~assets/img/buu-get-logo.png" alt="BUU-GET Logo" class="large-logo" />
            </div>

            <!-- Right Side (Register Form) - White Panel -->
            <div class="form-panel flex flex-center bg-white">
              <RegisterCard @register="handleRegister" />
            </div>
          </div>
        </template>

        <!-- ─── Step 2: Profile Form (Identity + Contact Info) ─── -->
        <template v-if="currentStep === 'profile'">
          <RegisterAndEditProfile
            :initial-edit-mode="false"
            :is-thai="isThai"
            :credentials="credentials"
            @close="goBackToCredentials"
            @save="handleSave"
          />
        </template>
      </q-page>
    </q-page-container>

    <!-- Footer -->
    <q-footer class="bg-white text-black">
      <FooterCredits variant="white" />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RegisterCard from 'src/components/register-card.vue';
import type { RegisterCredentials } from 'src/components/register-card.vue';
import type { RegisterFormData } from 'src/types/register';
import RegisterAndEditProfile from 'src/components/register-and-edit-profile.vue';
import FooterCredits from 'src/components/footer/footer-credits.vue';
import { useAuthStore } from 'src/stores/auth.store';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

type Step = 'credentials' | 'profile';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const currentStep = ref<Step>('credentials');
const isThai = ref<boolean>(true);
const credentials = ref<RegisterCredentials>({
  email: '',
  password: '',
  userType: 'thai',
});

/** Step 1 → Step 2: ผู้ใช้กรอกอีเมล+รหัสผ่านแล้ว กดสมัคร */
const handleRegister = (payload: RegisterCredentials): void => {
  credentials.value = payload;
  isThai.value = payload.userType === 'thai';
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
        message: 'สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ',
        position: 'top',
      });
      await router.push('/login');
    } else {
      $q.notify({
        type: 'negative',
        message: response.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
};
</script>

<style scoped>
.register-layout {
  position: relative;
}

.brand-logo-text {
  line-height: 1.1;
}

.brand-logo-sub {
  font-size: 10px;
}

.btn-register {
  border-radius: var(--radius-sm);
  padding: 6px 24px;
}

.register-page-bg {
  background-color: var(--surface-page);
  min-height: 100vh;
}

.register-container {
  width: 94%;
  max-width: 1100px;
  margin: 0 auto;
  min-height: 580px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

/* Panel สีน้ำเงินฝั่งซ้าย (โลโก้) */
.logo-panel {
  flex: 1;
  padding: 2rem;
}

.large-logo {
  max-width: 80%;
  max-height: 60vh;
  object-fit: contain;
}

/* Panel สีขาวฝั่งขวา (ฟอร์ม) */
.form-panel {
  flex: 0 0 52%;
  max-width: 52%;
  padding: 2.5rem 3rem;
  z-index: 2;
  border-top-left-radius: 36px;
  border-bottom-left-radius: 36px;
  margin-left: -32px;
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.15);
}

/* ซ่อนโลโก้ด้านซ้ายในหน้าจอมือถือ */
@media (max-width: 1023px) {
  .logo-panel {
    display: none;
  }
  .form-panel {
    flex: 0 0 100%;
    max-width: 100%;
    border-radius: 24px;
    margin-left: 0;
  }
  .register-container {
    width: 95%;
    max-width: 480px;
  }
}
</style>
