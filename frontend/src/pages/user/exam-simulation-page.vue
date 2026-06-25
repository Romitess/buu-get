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

    <!-- MOODLE LMS IFRAME CONTAINER -->
    <div class="iframe-wrapper">
      <!-- Loading Overlay -->
      <div v-if="isLoading" class="iframe-loading-overlay">
        <q-spinner-dots color="primary" size="48px" />
        <div class="text-grey-7 text-body2 q-mt-md text-weight-medium">
          กำลังโหลดระบบจำลองการสอบ...
        </div>
      </div>

      <!-- Error State -->
      <div v-if="hasError" class="iframe-error-state">
        <q-icon name="error_outline" color="negative" size="56px" />
        <div class="text-h6 text-weight-bold text-grey-9 q-mt-md">
          ไม่สามารถโหลดระบบจำลองการสอบได้
        </div>
        <div class="text-body2 text-grey-6 q-mt-sm" style="max-width: 420px">
          กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของท่าน
          หรือลองรีเฟรชหน้าเว็บใหม่อีกครั้ง
        </div>
        <q-btn
          color="primary"
          label="รีเฟรชหน้าจอ"
          icon="refresh"
          class="q-mt-lg rounded-borders"
          @click="reloadIframe"
        />
      </div>

      <!-- Moodle LMS Iframe -->
      <iframe
        ref="moodleIframeRef"
        :src="moodleUrl"
        class="moodle-iframe"
        :class="{ 'iframe-hidden': isLoading || hasError }"
        frameborder="0"
        allow="fullscreen"
        allowfullscreen
        title="BUU-GET LMS Moodle - ระบบจำลองการสอบ"
        @load="onIframeLoad"
        @error="onIframeError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';

const { t } = useI18n();

// === STATE ===
const isLoading = ref(true);
const hasError = ref(false);
const moodleIframeRef = ref<HTMLIFrameElement | null>(null);

// Moodle LMS URL — configured via environment variable with sensible fallback
const moodleUrl = computed<string>(() => {
  const envUrl =
    typeof import.meta.env?.VITE_MOODLE_URL === 'string'
      ? import.meta.env.VITE_MOODLE_URL
      : '';
  return envUrl || 'https://lms-buuget.buu.ac.th';
});

// === METHODS ===
const onIframeLoad = (): void => {
  isLoading.value = false;
  hasError.value = false;
};

const onIframeError = (): void => {
  isLoading.value = false;
  hasError.value = true;
};

const reloadIframe = (): void => {
  isLoading.value = true;
  hasError.value = false;

  if (moodleIframeRef.value) {
    // Force reload by setting src again
    const currentSrc = moodleIframeRef.value.src;
    moodleIframeRef.value.src = '';
    // Use requestAnimationFrame to ensure browser processes the empty src first
    requestAnimationFrame(() => {
      if (moodleIframeRef.value) {
        moodleIframeRef.value.src = currentSrc;
      }
    });
  }
};

// Safety timeout — if iframe takes too long to load, show error
let loadTimeout: ReturnType<typeof setTimeout> | null = null;

onMounted(() => {
  loadTimeout = setTimeout(() => {
    if (isLoading.value) {
      // After 30 seconds, if still loading, assume it loaded
      // (some cross-origin iframes don't fire load event properly)
      isLoading.value = false;
    }
  }, 30000);
});

onBeforeUnmount(() => {
  if (loadTimeout) {
    clearTimeout(loadTimeout);
  }
});
</script>

<style scoped lang="scss">
.exam-simulation-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

// Iframe container takes remaining space
.iframe-wrapper {
  flex: 1;
  position: relative;
  min-height: 0; // Allow flex shrink
  background-color: #f5f5f5;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

// Full-size iframe
.moodle-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.iframe-hidden {
  opacity: 0;
  pointer-events: none;
}

// Loading spinner overlay
.iframe-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  z-index: 10;
}

// Error state overlay
.iframe-error-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  z-index: 10;
  text-align: center;
  padding: 24px;
}
</style>
