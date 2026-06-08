<template>
  <div class="login-root">
    <!-- ===== Global Background Decorations ===== -->
    <div class="geo geo-1"></div>
    <div class="geo geo-2"></div>
    <div class="geo geo-3"></div>
    <div class="geo geo-4"></div>
    <div class="geo geo-5"></div>
    <div class="geo geo-6"></div>
    <div class="grid-lines"></div>

    <!-- ===== LEFT PANEL: Brand & Visual (always in place) ===== -->
    <div class="left-panel" :class="{ hidden: panelPhase === 'center' }">
      <div class="left-content">
        <!-- <div class="brand-pill">
          <div class="pill-wordmark">
            <span class="pill-buu">BUU</span><span class="pill-dash">-</span
            ><span class="pill-get">GET</span>
          </div>
        </div> -->
        <div class="brand-logo-wrap">
          <img src="~assets/img/buu-get-logo.png" alt="BUU-GET Logo" class="brand-logo-img" />
        </div>
        <!-- <div class="brand-headline">
          <p>{{ $t('auth.systemDescription', 'ระบบทดสอบวัดความสามารถทางภาษาอังกฤษ') }}</p>
        </div> -->
      </div>
    </div>

    <!-- ===== CARD: Positioned absolutely, animated via transform ===== -->
    <div
      ref="cardWrapperRef"
      class="card-wrapper"
      :class="cardWrapperClasses"
      :style="cardWrapperStyle"
    >
      <transition name="fade" mode="out-in">
        <div v-if="showForm" :key="formKey">
          <div v-if="formKey === 'login'">
            <LoginCard />
          </div>
          <div v-else-if="formKey === 'credentials'">
            <div class="register-card-shell">
              <RegisterCard @register="handleRegister" @thaid-register="handleRegister" />
            </div>
          </div>
          <div v-else-if="formKey === 'profile'">
            <div class="register-profile-shell">
              <RegisterAndEditProfile
                :initial-edit-mode="false"
                :is-thai="isThai"
                :credentials="credentials"
                :registration-method="credentials.registrationMethod"
                @close="goBackToCredentials"
                @save="handleSave"
              />
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth.store';
import LoginCard from 'src/components/auth/login-card.vue';
import RegisterCard from 'src/components/register-card.vue';
import type { RegisterCredentials } from 'src/types/register';
import type { RegisterFormData } from 'src/types/register';
import RegisterAndEditProfile from 'src/components/register-and-edit-profile.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const authStore = useAuthStore();

const isRegisterMode = computed(() => route.path.includes('register'));
const currentStep = ref<'credentials' | 'profile'>('credentials');
const isThai = ref<boolean>(true);
const credentials = ref<RegisterCredentials>({
  email: '',
  password: '',
  userType: 'thai',
  registrationMethod: 'email',
});

// ============================================================
// Animation state
// ============================================================
type CardPosition = 'right' | 'center';
type CardSize = 'login' | 'credentials' | 'profile';

const panelPhase = ref<CardPosition>('right');
const cardSize = ref<CardSize>('login');
const showForm = ref(false);
const formKey = ref<'login' | 'credentials' | 'profile'>('login');
const animating = ref(false);
const lockedHeight = ref<number | null>(null);

const cardWrapperRef = ref<HTMLElement | null>(null);

const cardWrapperClasses = computed(() => ({
  'pos-right': panelPhase.value === 'right',
  'pos-center': panelPhase.value === 'center',
  'size-login': cardSize.value === 'login',
  'size-credentials': cardSize.value === 'credentials',
  'size-profile': cardSize.value === 'profile',
  animating: animating.value,
}));

const cardWrapperStyle = computed(() => {
  if (lockedHeight.value !== null) {
    return { minHeight: `${lockedHeight.value}px` };
  }
  return {};
});

/** Capture the current card height and lock it so card doesn't collapse when content is removed */
const lockHeight = (): void => {
  if (cardWrapperRef.value) {
    lockedHeight.value = cardWrapperRef.value.offsetHeight;
  }
};

const unlockHeight = (): void => {
  lockedHeight.value = null;
};

// ============================================================
// Initialization
// ============================================================
onMounted(() => {
  if (isRegisterMode.value) {
    panelPhase.value = 'center';
    cardSize.value = currentStep.value === 'profile' ? 'profile' : 'credentials';
    formKey.value = currentStep.value === 'profile' ? 'profile' : 'credentials';
  } else {
    panelPhase.value = 'right';
    cardSize.value = 'login';
    formKey.value = 'login';
  }
  showForm.value = true;
});

// ============================================================
// Login <-> Register transition
// ============================================================
const targetMode = ref<boolean | null>(null);

const runModeAnimation = (goingToRegister: boolean) => {
  animating.value = true;
  lockHeight();
  showForm.value = false;

  if (goingToRegister) {
    setTimeout(() => {
      panelPhase.value = 'center';
    }, 350);
    setTimeout(() => {
      cardSize.value = 'credentials';
    }, 1350);
    setTimeout(() => {
      formKey.value = 'credentials';
      unlockHeight();
      void nextTick(() => {
        showForm.value = true;
        animating.value = false;
        checkPendingAnimations();
      });
    }, 1800);
  } else {
    setTimeout(() => {
      cardSize.value = 'login';
    }, 350);
    setTimeout(() => {
      panelPhase.value = 'right';
    }, 800);
    setTimeout(() => {
      formKey.value = 'login';
      unlockHeight();
      void nextTick(() => {
        showForm.value = true;
        animating.value = false;
        checkPendingAnimations();
      });
    }, 1800);
  }
};

watch(isRegisterMode, (goingToRegister) => {
  targetMode.value = goingToRegister;
  if (animating.value) return;
  runModeAnimation(goingToRegister);
});

// ============================================================
// Step 1 <-> Step 2 within register
// ============================================================
const targetStep = ref<'credentials' | 'profile' | null>(null);

const runStepAnimation = (newStep: 'credentials' | 'profile') => {
  animating.value = true;
  lockHeight();
  showForm.value = false;

  setTimeout(() => {
    cardSize.value = newStep === 'profile' ? 'profile' : 'credentials';
    formKey.value = newStep === 'profile' ? 'profile' : 'credentials';
  }, 350);

  setTimeout(() => {
    unlockHeight();
    void nextTick(() => {
      showForm.value = true;
      animating.value = false;
      checkPendingAnimations();
    });
  }, 800);
};

watch(currentStep, (newStep) => {
  if (!isRegisterMode.value) {
    cardSize.value = newStep === 'profile' ? 'profile' : 'credentials';
    formKey.value = newStep === 'profile' ? 'profile' : 'credentials';
    return;
  }
  targetStep.value = newStep;
  if (animating.value) return;
  runStepAnimation(newStep);
});

const checkPendingAnimations = () => {
  // Check if route mode changed while we were animating
  if (targetMode.value !== null && targetMode.value !== isRegisterMode.value) {
    targetMode.value = isRegisterMode.value;
    runModeAnimation(isRegisterMode.value);
    return;
  }
  // Make sure we end up in the actual requested mode regardless of targetMode variable
  if (isRegisterMode.value && formKey.value === 'login') {
    runModeAnimation(true);
    return;
  }
  if (!isRegisterMode.value && formKey.value !== 'login') {
    runModeAnimation(false);
    return;
  }

  // Check if step changed while animating
  if (targetStep.value !== null && isRegisterMode.value) {
    const desiredFormKey = targetStep.value === 'profile' ? 'profile' : 'credentials';
    if (formKey.value !== desiredFormKey) {
      runStepAnimation(targetStep.value);
      return;
    }
  }
};

/** Step 1 → Step 2 */
const handleRegister = (payload: RegisterCredentials): void => {
  credentials.value = payload;
  isThai.value = payload.userType === 'thai';
  currentStep.value = 'profile';
};

/** Step 2 → Step 1 */
const goBackToCredentials = (): void => {
  currentStep.value = 'credentials';
};

/** Step 2 complete */
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
        message: t('auth.notify.registerSuccess', 'สมัครสมาชิกสำเร็จ! โปรดเข้าสู่ระบบ'),
        position: 'top',
      });
      await router.push('/login');
      currentStep.value = 'credentials';
    } else {
      $q.notify({
        type: 'negative',
        message:
          response.message || t('auth.notify.registerFailed', 'เกิดข้อผิดพลาดในการสมัครสมาชิก'),
        position: 'top',
      });
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: t('auth.notify.connectionError', 'เกิดข้อผิดพลาดในการเชื่อมต่อ'),
      position: 'top',
    });
  } finally {
    $q.loading.hide();
  }
};
</script>

<style scoped lang="scss">
// ============================================================
// Root — full viewport, no flexbox layout shifts
// ============================================================
.login-root {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  font-family: var(--font-family-base);
  background: linear-gradient(
    145deg,
    var(--primary-dark) 0%,
    var(--primary) 55%,
    var(--secondary-dark) 100%
  );
}

// ============================================================
// Left Panel — absolute positioned, fades in/out
// ============================================================
.left-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 52%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  opacity: 1;
  transition: opacity 0.5s ease;
  pointer-events: auto;

  &.hidden {
    opacity: 0;
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    display: none;
  }
}

// ============================================================
// Card Wrapper — positioned absolutely, uses transform for movement
// ============================================================
.card-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 40px 36px 36px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 32px 64px rgba(0, 0, 0, 0.25),
    0 0 120px rgba(30, 137, 229, 0.12);

  // GPU-accelerated smooth transitions
  will-change: transform, width, max-width, min-height, padding;
  transition:
    transform 1s cubic-bezier(0.25, 1, 0.5, 1),
    width 0.45s cubic-bezier(0.25, 1, 0.5, 1),
    max-width 0.45s cubic-bezier(0.25, 1, 0.5, 1),
    min-height 0.45s cubic-bezier(0.25, 1, 0.5, 1),
    padding 0.45s cubic-bezier(0.25, 1, 0.5, 1);

  // Disable scrolling entirely
  overflow: hidden;
}

// Position: right side (login)
.card-wrapper.pos-right {
  // Center within the right 48% of the screen:
  // right panel starts at 52%, is 48% wide
  // so card center = 52% + 24% = 76% from left
  // since left is fixed at 50%, we shift by +26vw to align the center
  transform: translate(calc(26vw - 50%), -50%);

  @media (max-width: 1024px) {
    transform: translate(-50%, -50%);
  }
}

// Position: center (register)
.card-wrapper.pos-center {
  transform: translate(-50%, -50%);
}

// Size: login card
.card-wrapper.size-login {
  width: clamp(340px, 90vw, 420px);
  max-width: 420px;
  padding: 24px clamp(24px, 3.5vw, 36px);
}

// Size: register credentials
.card-wrapper.size-credentials {
  width: clamp(340px, 90vw, 504px);
  min-height: clamp(480px, 75dvh, 520px);
  max-width: 100%;
  padding: clamp(16px, 2.5vw, 20px) clamp(18px, 3.1vw, 25px);
}

// Size: register profile
.card-wrapper.size-profile {
  width: calc(100vw - 96px);
  max-width: 1720px;
  max-height: calc(100dvh - 24px);
  overflow-y: auto;
  padding: 28px 44px 22px;
}

@media (max-width: 1024px) {
  .card-wrapper.size-profile {
    width: calc(100vw - 24px);
    padding: 28px 24px 22px;
  }
}

// ============================================================
// Internal card style overrides — make children transparent
// ============================================================
.card-wrapper :deep(.login-card) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  max-width: 100% !important;
  animation: none !important;
  transform: none !important;

  &:hover {
    transform: none !important;
    box-shadow: none !important;
  }
}

.register-card-shell,
.register-profile-shell {
  width: 100%;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.register-profile-shell :deep(.profile-card) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-shadow: none !important;
}

// ============================================================
// Geometric CSS art (Fixed position to cover whole page)
// ============================================================
.geo {
  position: fixed;
  border-radius: 50%;
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
}

.geo-1 {
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, #4dabf5 0%, transparent 70%);
  top: -180px;
  right: -120px;
  animation: pulse 8s ease-in-out infinite;
}

.geo-2 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, #82b1ff 0%, transparent 70%);
  bottom: -100px;
  left: -80px;
  animation: pulse 10s ease-in-out 2s infinite;
}

.geo-3 {
  width: 200px;
  height: 200px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  top: 15%;
  left: 12%;
  transform: rotate(30deg);
  animation: spin 30s linear infinite;
  opacity: 0.3;
}

.geo-4 {
  width: 110px;
  height: 110px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 0;
  bottom: 20%;
  right: 15%;
  transform: rotate(15deg);
  animation: spin 20s linear reverse infinite;
  opacity: 0.35;
}

.geo-5 {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.07);
  top: 50%;
  left: 8%;
  transform: rotate(45deg);
  border-radius: 8px;
  animation: float 6s ease-in-out infinite;
}

.geo-6 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #64b5f6 0%, transparent 70%);
  top: 30%;
  right: 5%;
  opacity: 0.1;
  animation: pulse 12s ease-in-out 4s infinite;
}

.grid-lines {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

// ============================================================
// Left Content Styles
// ============================================================
.left-content {
  position: relative;
  z-index: 2;
  padding: 48px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  padding: 18px 56px;
  margin-bottom: 48px;
  animation: fadeInDown 0.7s ease-out;

  .pill-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: 0;
  }

  .pill-buu {
    font-size: 3.5rem;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .pill-dash {
    font-size: 3.5rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 2px;
  }

  .pill-get {
    font-size: 3.5rem;
    font-weight: 900;
    color: #90caf9;
    letter-spacing: -0.01em;
  }
}

.brand-logo-wrap {
  margin-bottom: 40px;
  animation: fadeInUp 0.7s ease-out 0.05s both;

  .brand-logo-img {
    max-width: 680px;
    width: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.3)) brightness(1.05);
  }
}

.brand-headline {
  animation: fadeInUp 0.7s ease-out 0.15s both;

  p {
    font-size: 1.44rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.7;
    margin-bottom: 40px;
  }
}

// ============================================================
// Fade transition for form content
// ============================================================
.fade-leave-active {
  transition: opacity 0.3s ease-out;
  position: absolute;
  width: 100%;
}
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active {
  transition: opacity 0.4s ease-out;
}
.fade-enter-from {
  opacity: 0;
}

// ============================================================
// Animations keyframes
// ============================================================
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
