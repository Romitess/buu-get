<template>
  <q-page class="page-container assist-scanner-page">
    <header class="scanner-header">
      <h1>ช่วยแสกนเช็กอิน</h1>
      <p v-if="sessionMeta?.examName" class="exam-name">{{ sessionMeta.examName }}</p>
      <p v-else-if="isLoadingMeta" class="exam-name">กำลังโหลด...</p>
    </header>

    <section v-if="loadError" class="scanner-panel">
      <q-banner dense rounded class="bg-negative text-white">
        {{ loadError }}
      </q-banner>
    </section>

    <template v-else-if="sessionMeta">
      <section class="scanner-panel camera-panel">
        <div :id="scannerElementId" class="camera-viewport" />
        <p v-if="cameraError" class="camera-error">{{ cameraError }}</p>
        <p v-else-if="!isCameraActive" class="camera-hint">กำลังเปิดกล้อง...</p>
      </section>

      <section class="scanner-panel manual-panel">
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

      <section v-if="lastResult" class="scanner-panel result-panel">
        <div class="result-title">{{ resultTitle }}</div>
        <div v-if="lastResult.candidate" class="result-body">
          <div>{{ lastResult.candidate.fullnameTh }}</div>
          <div>ที่นั่ง {{ lastResult.candidate.seatNumber }}</div>
        </div>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
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

const submitCode = async (rawCode: string): Promise<void> => {
  if (!sessionMeta.value || isSubmitting.value) return;

  const code = normalizeScanPayload(rawCode);
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
      message: 'ไม่สามารถส่งผลการแสกนได้',
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
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
}

.scanner-header {
  margin-bottom: 16px;

  h1 {
    margin: 0;
    font-size: 1.35rem;
    font-weight: 700;
    color: #0f172a;
  }
}

.exam-name {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.scanner-panel {
  margin-bottom: 16px;
}

.camera-viewport {
  width: 100%;
  min-height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}

.camera-hint,
.camera-error {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.camera-error {
  color: #e53935;
}

.manual-panel {
  display: grid;
  gap: 12px;
}

.submit-btn {
  height: 40px;
  border-radius: 8px !important;
}

.result-panel {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.result-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.result-body {
  color: #334155;
  font-size: 0.95rem;
}
</style>
