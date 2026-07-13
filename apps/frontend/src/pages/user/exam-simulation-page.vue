<template>
  <div class="page-container exam-simulation-page q-pa-lg">
    <AppBreadcrumbs />

    <!-- PAGE HEADER -->
    <div class="q-pt-md q-pb-sm">
      <AppPageHeader
        :title="t('navigation.examSimulation') || 'จำลองการสอบ'"
        :subtitle="
          t('examSimulation.pageSubtitle') ||
          'ใช้สำหรับจำลองการสอบรูปแบบคอมพิวเตอร์ เพื่อให้ผู้เข้าสอบคุ้นเคยกับระบบก่อนสอบจริง'
        "
      />
    </div>

    <!-- MOODLE LMS CONTENT -->
    <div class="moodle-content q-pb-lg">
      <!-- State 1: Mock Login (Hero Card) -->
      <q-card
        v-if="!isLoggedIn"
        class="moodle-hero-card q-mb-lg position-relative"
        flat
        @vue:mounted="onLoginViewMounted"
      >
        <div class="hero-layout">
          <!-- Left: Welcome Banner -->
          <div class="hero-left">
            <!-- กล่องน้ำเงินเทาใน -->
            <div class="hero-inner-box">
              <h2 class="hero-inner-box__title">Welcome to Moodle</h2>
              <p class="hero-inner-box__desc">
                Your learning journey starts here. Access courses, connect with peers, and achieve
                your goals.
              </p>
              <p class="hero-inner-box__sub">You're part of a global learning community</p>
              <div class="hero-stats">
                <div class="hero-stat">
                  <div class="hero-stat__value">500M</div>
                  <div class="hero-stat__label">users</div>
                </div>
                <div class="hero-stat">
                  <div class="hero-stat__value">150K</div>
                  <div class="hero-stat__label">sites</div>
                </div>
                <div class="hero-stat">
                  <div class="hero-stat__value">200+</div>
                  <div class="hero-stat__label">countries</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Login Panel -->
          <div class="hero-right">
            <div class="hero-login-panel">
              <h3 class="hero-login-panel__title">Welcome back</h3>
              <p class="hero-login-panel__subtitle text-grey-7">Log in to LMS-BUUGET</p>

              <div class="q-mt-lg">
                <div data-tour="login-inputs">
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
                </div>

                <div class="text-right q-mb-lg">
                  <span class="forgot-link cursor-pointer">Forgot password?</span>
                </div>

                <div data-tour="login-button" class="login-btn-tour-target">
                  <q-btn
                    color="primary"
                    label="Log in"
                    class="full-width login-btn"
                    no-caps
                    size="lg"
                    @click="handleMockLogin"
                  />
                </div>

                <div class="text-center q-mt-md">
                  <span class="cookies-link text-grey-6 cursor-pointer">Cookies notice</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <q-btn
          round
          color="grey-5"
          text-color="white"
          icon="question_mark"
          class="exam-simulation-help-btn shadow-0"
          size="sm"
          :aria-label="t('examSimulation.tour.restartLabel')"
          @click="restartTour"
        />
      </q-card>

      <!-- State 2: Moodle Mockup Dashboard -->
      <transition name="fade">
        <MoodleMockupDashboard
          v-if="isLoggedIn"
          ref="dashboardRef"
          class="q-mb-lg"
          @tour-dashboard-ready="onTourDashboardReady"
          @tour-attempt-ready="onTourAttemptReady"
          @tour-attempt-page-change="onTourAttemptPageChange"
          @tour-attempt-summary-ready="onTourAttemptSummaryReady"
          @dashboard-view-change="onTourDashboardViewChange"
          @restart-tour="restartTour"
        />
      </transition>
    </div>

    <ProductTourOverlay
      :visible="isTourActive"
      :target-rect="tourTargetRect"
      :step-number="tourStepNumber"
      :title="tourTitle"
      :body="tourBody"
      :badge-label="tourBadgeLabel"
      :next-label="tourNextLabel"
      :placement="tourPlacement"
      :is-last="tourIsLastStep"
      @next="goToNextTourStep"
      @skip="skipTour"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import MoodleMockupDashboard from 'src/components/exam-simulation/moodle-mockup-dashboard.vue';
import ProductTourOverlay from 'src/components/base/product-tour/product-tour-overlay.vue';
import { useExamSimulationTour } from 'src/composables/use-exam-simulation-tour';
import type { DashboardViewType } from 'src/composables/exam-simulation-tour-steps';

type MoodleDashboardExpose = {
  currentView: { value: DashboardViewType };
  goToView: (view: DashboardViewType) => void;
};

const { t } = useI18n();

const isLoggedIn = ref(false);
const lmsUsername = ref('');
const lmsPassword = ref('');
const showPassword = ref(false);
const dashboardRef = ref<MoodleDashboardExpose | null>(null);
const trackedDashboardView = ref<DashboardViewType | null>(null);
const isAttemptSummary = ref(false);

const goToDashboardView = (view: DashboardViewType): void => {
  dashboardRef.value?.goToView(view);
};

const {
  isActive: isTourActive,
  targetRect: tourTargetRect,
  stepNumber: tourStepNumber,
  title: tourTitle,
  body: tourBody,
  badgeLabel: tourBadgeLabel,
  nextLabel: tourNextLabel,
  placement: tourPlacement,
  isLastStep: tourIsLastStep,
  restartTour,
  goToNextStep: goToNextTourStep,
  skipTour,
  maybeAutoStart,
  tryResumeTour,
} = useExamSimulationTour({
  isLoggedIn,
  dashboardView: trackedDashboardView,
  isAttemptSummary,
  goToDashboardView,
});

const onLoginViewMounted = (): void => {
  void maybeAutoStart();
};

const onTourDashboardReady = (): void => {
  trackedDashboardView.value = 'overview';
  isAttemptSummary.value = false;
  void tryResumeTour('mount');
};

const onTourAttemptReady = (): void => {
  isAttemptSummary.value = false;
  void tryResumeTour('mount');
};

const onTourAttemptPageChange = (): void => {
  isAttemptSummary.value = false;
  void tryResumeTour('attempt-page');
};

const onTourAttemptSummaryReady = (): void => {
  isAttemptSummary.value = true;
  void tryResumeTour('attempt-summary');
};

const onTourDashboardViewChange = (view: DashboardViewType): void => {
  trackedDashboardView.value = view;
  if (view !== 'attempt') {
    isAttemptSummary.value = false;
  }
  void tryResumeTour('dashboard', view);
};

const handleMockLogin = (): void => {
  isLoggedIn.value = true;
};
</script>

<style scoped lang="scss">
.exam-simulation-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  // ให้เว้นซ้ายขวาของหน้าให้เท่ากับหน้า exam-schedule-page
  width: clamp(921.6px, 81vw, 1440px) !important;
  margin: 0 auto;

  @media (max-width: 1023px) {
    width: 100% !important;
    min-width: 0 !important;
  }
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

// ── Hero Card ─────────────────────────────────────────────────
.moodle-hero-card {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

// ใช้ CSS Grid แทน Quasar row เพื่อควบคุมได้เต็มที่
.hero-layout {
  display: grid;
  grid-template-columns: 1fr 1fr; // 50 / 50
  min-height: 560px; // ปรับความสูงเพิ่มขึ้นตามต้องการ

  @media (max-width: 1023px) {
    grid-template-columns: 1fr;
  }
}

// ── ฝั่งซ้าย: พื้นเทาเข้ม + กล่องน้ำเงินเทาลอยตรงกลาง ────────
.hero-left {
  background-color: #616161; // ปรับเป็นสีเทาเข้มตามรูปภาพ
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;

  @media (max-width: 1023px) {
    padding: 36px 28px;
    min-height: 320px;
  }
}

// กล่องน้ำเงินเทา — ความสูงตาม content ไม่ยืด
.hero-inner-box {
  background-color: #3b5982; // ปรับสีน้ำเงินอมเทาตามรูปภาพ
  border-radius: 12px;
  padding: 36px 32px;
  width: 100%;
  max-width: 400px;
  text-align: center; // จัดข้อความให้อยู่ตรงกลางทั้งหมด
  // ไม่กำหนด height → ยืดตาม content เท่านั้น
}

.hero-inner-box__title {
  font-size: 1.85rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 16px;
  line-height: 1.25;
  text-align: center;
}

.hero-inner-box__desc {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.65;
  margin: 0 0 8px;
  text-align: center;
}

.hero-inner-box__sub {
  font-size: 0.83rem;
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
  margin: 0 0 24px;
}

// stats row
.hero-stats {
  display: flex;
  justify-content: space-around; // จัดการกระจายของข้อมูลสถิติให้อยู่ห่างกันอย่างสวยงาม
  margin-top: 24px;
}

.hero-stat {
  text-align: center;
}

.hero-stat__value {
  font-size: 1.6rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
}

.hero-stat__label {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.65);
  text-transform: lowercase;
}

// ── ฝั่งขวา: Login Panel ─────────────────────────────────────
.hero-right {
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-login-panel {
  width: 100%;
  max-width: 420px;
  padding: 48px 56px;

  @media (max-width: 1023px) {
    padding: 36px 28px;
  }
}

.hero-login-panel__title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
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
  &:hover {
    text-decoration: underline;
  }
}

.login-btn {
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.login-btn-tour-target {
  display: block;
  width: 100%;
}

.cookies-link {
  font-size: 0.8rem;
  &:hover {
    text-decoration: underline;
  }
}

.exam-simulation-help-btn {
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 2;
}
</style>
