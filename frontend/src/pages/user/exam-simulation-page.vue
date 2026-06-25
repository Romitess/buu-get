<template>
  <div class="exam-simulation-page">
    <AppBreadcrumbs />

    <!-- PAGE HEADER -->
    <div class="q-px-lg q-pt-md q-pb-sm">
      <AppPageHeader
        :title="t('navigation.examSimulation') || 'จำลองการสอบ'"
        :subtitle="
          t('examSimulation.pageSubtitle') ||
          'ใช้สำหรับจำลองการสอบรูปแบบคอมพิวเตอร์ เพื่อให้ผู้เข้าสอบคุ้นเคยกับระบบก่อนสอบจริง'
        "
      />
    </div>

    <!-- MOODLE LMS CONTENT -->
    <div class="moodle-content q-px-lg q-pb-lg">
      <!-- State 1: Mock Login (Hero Card) -->
      <q-card v-if="!isLoggedIn" class="moodle-hero-card q-mb-lg" flat>
        <div class="row no-wrap items-stretch hero-row">
          <!-- Left: Welcome Banner -->
          <div class="col-12 col-md-5 hero-banner-col">
            <div class="hero-banner">
              <div class="hero-banner__overlay" />
              <div class="hero-banner__content">
                <h2 class="hero-banner__title">
                  Welcome to Moodle
                </h2>
                <p class="hero-banner__desc">
                  Your learning journey starts here. Access courses,
                  connect with peers, and achieve your goals.
                </p>
                <p class="hero-banner__sub">
                  You're part of a global learning community
                </p>
                <div class="hero-stats row q-gutter-lg q-mt-lg">
                  <div class="hero-stat text-center">
                    <div class="hero-stat__value">500M</div>
                    <div class="hero-stat__label">users</div>
                  </div>
                  <div class="hero-stat text-center">
                    <div class="hero-stat__value">150K</div>
                    <div class="hero-stat__label">sites</div>
                  </div>
                  <div class="hero-stat text-center">
                    <div class="hero-stat__value">200+</div>
                    <div class="hero-stat__label">countries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Login Panel -->
          <div class="col-12 col-md-7 hero-login-col">
            <div class="hero-login-panel">
              <h3 class="hero-login-panel__title">Welcome back</h3>
              <p class="hero-login-panel__subtitle text-grey-7">
                Log in to LMS-BUUGET
              </p>

              <div class="q-mt-lg">
                <label class="field-label">Username or email</label>
                <q-input
                  v-model="lmsUsername"
                  outlined
                  dense
                  placeholder="Enter your username or email"
                  class="q-mb-md"
                />

                <label class="field-label">Password</label>
                <q-input
                  v-model="lmsPassword"
                  outlined
                  dense
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  class="q-mb-sm"
                  @keyup.enter="handleMockLogin"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showPassword ? 'visibility' : 'visibility_off'"
                      class="cursor-pointer"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>

                <div class="text-right q-mb-lg">
                  <span class="forgot-link cursor-pointer">
                    Forgot password?
                  </span>
                </div>

                <q-btn
                  color="primary"
                  label="Log in"
                  class="full-width login-btn"
                  no-caps
                  size="lg"
                  @click="handleMockLogin"
                />

                <div class="text-center q-mt-md">
                  <span class="cookies-link text-grey-6 cursor-pointer">
                    Cookies notice
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card>

      <!-- State 2: Moodle Mockup Dashboard -->
      <transition name="fade">
        <MoodleMockupDashboard v-if="isLoggedIn" class="q-mb-lg" />
      </transition>

      <!-- Info Banner -->
      <q-banner class="info-banner rounded-borders q-mb-lg" dense>
        <template v-slot:avatar>
          <q-icon name="info" color="primary" size="24px" />
        </template>
        <div class="text-body2 text-grey-8">
          <span class="text-weight-bold">หมายเหตุ:</span>
          ระบบจำลองการสอบนี้เป็นเพียง <span class="text-primary text-weight-bold">หน้าจอจำลอง (Mockup)</span> เท่านั้น ไม่ได้เชื่อมต่อกับ Moodle จริง เพื่อให้ผู้เข้าสอบทดลองคลิกใช้งานระบบ
        </div>
      </q-banner>
    </div>

    <!-- FOOTER -->
    <div class="moodle-footer row justify-between items-center q-px-lg q-py-sm">
      <span class="text-caption text-grey-7">
        Crafted by the computer center of Burapha University
      </span>
      <span class="text-caption text-grey-7">
        © {{ currentYear }} Copyright All Right Reserved.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import MoodleMockupDashboard from 'src/components/exam-simulation/moodle-mockup-dashboard.vue';

const { t } = useI18n();

// === STATE ===
const isLoggedIn = ref(false);
const lmsUsername = ref('');
const lmsPassword = ref('');
const showPassword = ref(false);

const currentYear = computed<number>(() => new Date().getFullYear());

// === METHODS ===
const handleMockLogin = (): void => {
  // In a real app this would validate, but here we just show the mockup
  isLoggedIn.value = true;
};
</script>

<style scoped lang="scss">
.exam-simulation-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-from {
  opacity: 0;
}

// Hero Card
.moodle-hero-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.hero-row {
  min-height: 480px;

  @media (max-width: 1023px) {
    flex-wrap: wrap;
  }
}

// Left banner
.hero-banner-col {
  @media (max-width: 1023px) {
    max-height: 280px;
  }
}

.hero-banner {
  position: relative;
  height: 100%;
  background: linear-gradient(135deg, #546e8a 0%, #6b8299 40%, #8fa4b5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;

  @media (max-width: 1023px) {
    padding: 32px 24px;
  }
}

.hero-banner__overlay {
  position: absolute;
  top: 10%;
  left: 8%;
  right: 20%;
  bottom: 15%;
  background-color: rgba(255, 255, 255, 0.12);
  border-radius: 8px;
}

.hero-banner__content {
  position: relative;
  z-index: 2;
  color: #ffffff;
}

.hero-banner__title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px;
  line-height: 1.2;
}

.hero-banner__desc {
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0 0 8px;
}

.hero-banner__sub {
  font-size: 0.85rem;
  opacity: 0.75;
  margin: 0;
}

.hero-stats {
  margin-top: 24px;
}

.hero-stat__value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
}

.hero-stat__label {
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: lowercase;
}

// Right login panel
.hero-login-panel {
  padding: 48px 56px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #ffffff;

  @media (max-width: 1023px) {
    padding: 32px 24px;
  }
}

.hero-login-panel__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.hero-login-panel__subtitle {
  font-size: 0.95rem;
  margin: 4px 0 0;
}

.field-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333333;
  margin-bottom: 6px;
}

.forgot-link {
  font-size: 0.85rem;
  color: var(--q-primary, #1565c0);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.login-btn {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.cookies-link {
  font-size: 0.8rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// Info Banner
.info-banner {
  background-color: #e8f0fe;
  border: 1px solid #c5d8f0;
}

// Footer
.moodle-footer {
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background-color: #fafafa;
}
</style>
