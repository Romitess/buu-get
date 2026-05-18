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
      <q-page class="register-page-bg flex flex-center q-py-xl">
        <div
          class="register-container row no-wrap items-stretch"
          :class="{ 'step-profile': currentStep === 'profile' }"
        >
          <div class="form-panel flex flex-center bg-white">
            <transition name="fade" mode="out-in">
              <div v-if="currentStep === 'credentials'" key="credentials" class="full-width">
                <RegisterCard @register="handleRegister" />
              </div>
              <div v-else key="profile" class="full-width">
                <RegisterAndEditProfile
                  :initial-edit-mode="false"
                  :is-thai="isThai"
                  :credentials="credentials"
                  @close="goBackToCredentials"
                  @save="handleSave"
                />
              </div>
            </transition>
          </div>
        </div>
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
  background: linear-gradient(
    145deg,
    var(--primary-dark) 0%,
    var(--primary) 55%,
    var(--secondary-dark) 100%
  );
  min-height: 100vh;
}

.register-container {
  width: 94%;
  max-width: 600px; /* Centered card width in Step 1 */
  margin: 0 auto;
  min-height: 740px; /* Height of Step 1 */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.register-container.step-profile {
  max-width: 1400px; /* Stretches wide in Step 2 */
  min-height: 780px; /* Height of Step 2 */
}

/* Panel สีขาวฝั่งขวา (ฟอร์ม) */
.form-panel {
  flex: 0 0 100%;
  max-width: 100%;
  padding: 2.5rem 3rem;
  z-index: 2;
  position: relative;
  border-radius: 12px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.register-container.step-profile .form-panel {
  flex: 0 0 100%;
  max-width: 100%;
  margin-left: 0;
  border-radius: 12px;
  box-shadow: none;
}

/* Strip profile card styling inside register container step 2 */
.register-container .profile-card {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-shadow: none !important;
}

/* Let the inputs and grid columns fully expand and fill the white panel */
.register-container .profile-card .q-px-xl {
  padding-left: 12px !important;
  padding-right: 12px !important;
}

.register-container .profile-card .q-pa-xl {
  padding: 0 !important;
}

.register-container .profile-card .q-mb-lg {
  margin-bottom: 20px !important;
}

.register-container .profile-card .q-mt-xl {
  margin-top: 24px !important;
}

/* Premium Slide-Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-leave-active {
  position: absolute;
  left: 3rem;
  right: 3rem;
  top: 2.5rem;
}
.fade-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

/* Mobile Responsive */
@media (max-width: 1023px) {
  .form-panel {
    padding: 2rem 1.5rem;
  }
  .register-container {
    width: 95%;
  }
}
</style>
