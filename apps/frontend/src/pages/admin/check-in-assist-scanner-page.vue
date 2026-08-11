<template>
  <q-page class="assist-scanner-page">
    <header class="scanner-top-bar">
      <div class="scanner-top-bar__content">
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          class="scanner-top-bar__back"
          aria-label="ย้อนกลับ"
          @click="goBack"
        />
        <div class="scanner-top-bar__text">
          <h1 class="scanner-top-bar__title">ช่วยแสกนเช็กอิน</h1>
          <p v-if="sessionMeta?.examName" class="scanner-top-bar__exam">{{ sessionMeta.examName }}</p>
          <p v-else-if="isLoadingMeta" class="scanner-top-bar__exam">กำลังโหลด...</p>
        </div>
      </div>
    </header>

    <section v-if="loadError" class="scanner-panel">
      <q-banner dense rounded class="bg-negative text-white">
        {{ loadError }}
      </q-banner>
    </section>

    <template v-else-if="sessionMeta">
      <section class="camera-panel">
        <div :id="scannerElementId" class="camera-viewport" />
        <p v-if="cameraError" class="camera-error">{{ cameraError }}</p>
        <p v-else-if="!isCameraActive" class="camera-hint">กำลังเปิดกล้อง...</p>
      </section>

      <Transition name="result-slide">
        <section v-if="lastResult" class="result-banner" :class="resultBannerClass">
          <div class="result-banner__title">{{ resultTitle }}</div>
          <div v-if="lastResult.candidate" class="result-banner__body">
            {{ lastResult.candidate.fullnameTh }} — ที่นั่ง {{ lastResult.candidate.seatNumber }}
          </div>
        </section>
      </Transition>

      <section class="manual-panel">
        <AppLabeledInput
          v-model="manualCode"
          label="พิมพ์รหัสด้วยตนเอง"
          placeholder="Test Taker ID / เลขบัตร / Passport"
          maxlength="64"
          hide-bottom-space
          :disable="isSubmitting"
          @keyup.enter="submitManualCode"
        />
        <AppButton
          label="ส่งรหัส"
          color="primary"
          class="submit-btn"
          :loading="isSubmitting"
          :disable="!manualCode.trim()"
          @click="submitManualCode"
        />
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';
import { useBarcodeCamera } from 'src/composables/use-barcode-camera';
import {
  getAssistSessionByToken,
  submitAssistScan,
} from 'src/services/check-in-assist.service';
import type { AssistEvent, AssistSessionMeta } from 'src/types/check-in-assist.types';
import { normalizeScanPayload } from 'src/utils/scan-keyboard';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const joinToken = computed(() => String(route.params.joinToken ?? ''));
const sessionMeta = ref<AssistSessionMeta | null>(null);
const isLoadingMeta = ref(true);
const loadError = ref('');
const manualCode = ref('');
const isSubmitting = ref(false);
const lastResult = ref<AssistEvent | null>(null);

const {
  scannerElementId,
  isCameraActive,
  cameraError,
  startCamera,
  stopCamera,
} = useBarcodeCamera();

const goBack = async (): Promise<void> => {
  await stopCamera();
  if (window.history.length > 1) {
    router.back();
    return;
  }
  await router.push({ name: 'admin-exam-management' });
};

const resultTitle = computed((): string => {
  switch (lastResult.value?.type) {
    case 'CHECKED_IN':
      return 'เช็กอินสำเร็จ';
    case 'ALREADY_CHECKED_IN':
      return 'เช็กอินแล้ว';
    case 'NOT_FOUND':
      return 'ไม่พบผู้เข้าสอบ';
    case 'INVALID_CODE':
      return 'รหัสไม่ถูกต้อง';
    default:
      return '';
  }
});

const resultBannerClass = computed((): string => {
  switch (lastResult.value?.type) {
    case 'CHECKED_IN':
      return 'result-banner--success';
    case 'ALREADY_CHECKED_IN':
      return 'result-banner--warning';
    case 'NOT_FOUND':
    case 'INVALID_CODE':
      return 'result-banner--error';
    default:
      return '';
  }
});

const notifyForResult = (event: AssistEvent): void => {
  switch (event.type) {
    case 'CHECKED_IN':
      $q.notify({ type: 'positive', message: 'เช็กอินสำเร็จ', position: 'top' });
      break;
    case 'ALREADY_CHECKED_IN':
      $q.notify({ type: 'warning', message: 'ผู้เข้าสอบคนนี้เช็กอินแล้ว', position: 'top' });
      break;
    case 'NOT_FOUND':
      $q.notify({ type: 'negative', message: 'ไม่พบข้อมูลผู้เข้าสอบในรอบสอบนี้', position: 'top' });
      break;
    case 'INVALID_CODE':
      $q.notify({ type: 'warning', message: 'รหัสที่แสกนไม่ถูกต้อง', position: 'top' });
      break;
    default:
      break;
  }
};

const resolveSubmitErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string | string[] } } })
      .response;
    const status = response?.status;
    const rawMessage = response?.data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : '';

    if (status === 410) {
      return 'Session ช่วยแสกนปิดหรือหมดอายุแล้ว กรุณาสแกน QR ใหม่จากจอหลัก';
    }
    if (status === 401 || status === 403) {
      return 'ไม่มีสิทธิ์ส่งผลการแสกน กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าหน้าที่';
    }
    if (message) {
      return message;
    }
  }
  return 'ไม่สามารถส่งผลการแสกนได้';
};

const submitCode = async (rawCode: string): Promise<void> => {
  if (!sessionMeta.value || isSubmitting.value) return;

  const code = normalizeScanPayload(rawCode).slice(0, 64);
  if (!code) return;

  isSubmitting.value = true;
  try {
    const result = await submitAssistScan(sessionMeta.value.casId, code);
    lastResult.value = result;
    notifyForResult(result);
    manualCode.value = '';
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: resolveSubmitErrorMessage(error),
      position: 'top',
    });
  } finally {
    isSubmitting.value = false;
  }
};

const submitManualCode = async (): Promise<void> => {
  await submitCode(manualCode.value);
};

onMounted(async () => {
  if (!joinToken.value) {
    loadError.value = 'ลิงก์เข้าร่วมไม่ถูกต้อง';
    isLoadingMeta.value = false;
    return;
  }

  try {
    sessionMeta.value = await getAssistSessionByToken(joinToken.value);
    await startCamera((code) => {
      void submitCode(code);
    });
  } catch (error) {
    console.error(error);
    loadError.value = 'ไม่สามารถเข้าร่วม session ช่วยแสกนได้ (อาจปิดหรือหมดอายุแล้ว)';
    await stopCamera();
  } finally {
    isLoadingMeta.value = false;
  }
});
</script>

<style scoped lang="scss">
.assist-scanner-page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  background: #0f172a;
}

.scanner-top-bar {
  flex: 0 0 auto;
  padding: env(safe-area-inset-top, 12px) 16px 12px;
  background: var(--surface-card);

  &__content {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 600px;
    margin: 0 auto;
  }

  &__back {
    flex: 0 0 auto;
    min-width: 44px;
    min-height: 44px;
  }

  &__text {
    min-width: 0;
    flex: 1 1 auto;
  }

  &__title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__exam {
    margin: 2px 0 0;
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
}

.scanner-panel {
  padding: 16px;
}

.camera-panel {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 50dvh;
}

.camera-viewport {
  width: 100%;
  flex: 1;
  min-height: 50dvh;
  overflow: hidden;
  background: #0f172a;
}

.camera-hint,
.camera-error {
  margin: 8px 16px 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.camera-error {
  color: #e53935;
}

.result-banner {
  flex: 0 0 auto;
  padding: 12px 16px;
  font-weight: 600;
  color: #fff;

  &--success {
    background: #2e7d32;
  }

  &--warning {
    background: #e65100;
  }

  &--error {
    background: #c62828;
  }

  &__title {
    font-size: 1rem;
    font-weight: 700;
  }

  &__body {
    font-size: 0.9rem;
    font-weight: 400;
    margin-top: 2px;
    opacity: 0.92;
  }
}

.result-slide-enter-active,
.result-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}

.result-slide-enter-from,
.result-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.manual-panel {
  flex: 0 0 auto;
  display: grid;
  gap: 12px;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  background: var(--surface-card);
}

.submit-btn {
  height: 48px;
  min-height: 48px;
  border-radius: 8px !important;
}
</style>
