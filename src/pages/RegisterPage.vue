<template>
  <q-layout view="lHh Lpr lFf" class="register-layout">
    <!-- Public Header -->
    <q-header class="bg-white text-black shadow-1">
      <q-toolbar class="q-px-xl q-py-sm flex justify-between items-center">
        <!-- Logo -->
        <div class="row items-center cursor-pointer" @click="$router.push('/')">
          <div class="text-h6 text-weight-bold" style="color: #e53935; line-height: 1.1">
            BUU-GET
            <div class="text-caption text-weight-medium" style="font-size: 10px; color: #d32f2f">
              BURAPHA UNIVERSITY
            </div>
          </div>
        </div>

        <!-- Desktop Menu -->
        <div
          class="row items-center q-gutter-xl text-weight-medium text-body1 gt-sm"
          style="color: #424242"
        >
          <div class="cursor-pointer" @click="$router.push('/')">หน้าหลัก</div>
          <div class="cursor-pointer row items-center">
            รายการสอบ <q-icon name="keyboard_arrow_down" size="sm" class="q-ml-xs" />
          </div>
        </div>

        <!-- Auth Buttons -->
        <div class="row items-center q-gutter-lg">
          <div
            class="cursor-pointer text-weight-medium text-body1"
            style="color: #424242"
            @click="$router.push('/login')"
          >
            เข้าสู่ระบบ
          </div>
          <q-btn
            color="primary"
            label="สมัครสมาชิก"
            no-caps
            unelevated
            class="text-weight-bold"
            style="border-radius: 8px; padding: 6px 24px"
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
            <div class="logo-panel flex flex-center">
              <img src="~assets/img/BUU-GET LOGO.png" alt="BUU-GET Logo" class="large-logo" />
            </div>

            <!-- Right Side (Register Form) - White Panel -->
            <div class="form-panel flex flex-center">
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
import RegisterCard from 'src/components/RegisterCard.vue';
import type { RegisterCredentials } from 'src/components/RegisterCard.vue';
import type { RegisterFormData } from 'src/types/register';
import RegisterAndEditProfile from 'src/components/register-and-edit-profile.vue';
import FooterCredits from 'src/components/footer/FooterCredits.vue';

type Step = 'credentials' | 'profile';

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
const handleSave = (formData: RegisterFormData): void => {
  // TODO: เรียก API สมัครสมาชิก โดยรวม credentials + formData
  console.log('Final registration data:', {
    ...credentials.value,
    ...formData,
  });
};
</script>

<style scoped>
.register-layout {
  position: relative;
}

.register-page-bg {
  background-color: #eef1f6;
  min-height: 100vh;
}

.register-container {
  width: 94%;
  max-width: 1100px;
  margin: 0 auto;
  min-height: 580px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
}

/* Panel สีน้ำเงินฝั่งซ้าย (โลโก้) */
.logo-panel {
  flex: 1;
  background-color: #0d47a1;
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
  background-color: #ffffff;
  padding: 2.5rem 3rem;
  z-index: 2;
  border-top-left-radius: 36px;
  border-bottom-left-radius: 36px;
  margin-left: -32px;
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.25);
}

/* ซ่อนโลโก้ด้านซ้ายในหน้าจอมือถือ */
@media (max-width: 1023px) {
  .logo-panel {
    display: none;
  }
  .form-panel {
    flex: 0 0 100%;
    max-width: 100%;
  }
  .register-container {
    width: 95%;
    max-width: 480px;
  }
}
</style>
