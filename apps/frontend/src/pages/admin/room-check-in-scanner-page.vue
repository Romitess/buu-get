<template>
  <q-page class="station-scanner-page">
    <header class="scanner-header">
      <div class="scanner-header__nav">
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          class="scanner-header__icon-btn"
          :aria-label="t('admin.checkIn.backAria')"
          @click="goBack"
        />
        <q-btn
          flat
          dense
          no-caps
          class="scanner-header__close"
          :disable="!station"
          :aria-label="t('admin.checkIn.station.closeAria')"
          @click="closeAndLeave"
        >
          {{ t('admin.checkIn.station.closeStation') }}
        </q-btn>
      </div>
      <h1 class="scanner-header__title">{{ t('admin.checkIn.station.pageTitle') }}</h1>

      <div v-if="station && roomDisplay" class="scanner-meta">
        <div class="scanner-meta__room">{{ roomDisplay.title }}</div>
        <div class="scanner-meta__exam">{{ station.examName }}</div>
        <div v-if="roomDisplay.subtitle" class="scanner-meta__place">
          <q-icon name="location_on" size="16px" />
          <span>{{ roomDisplay.subtitle }}</span>
        </div>
        <div class="scanner-meta__chips">
          <span v-if="sessionTimeLabel" class="scanner-chip">
            <q-icon name="schedule" size="16px" />
            {{ sessionTimeLabel }}
          </span>
          <span class="scanner-chip scanner-chip--count">
            <q-icon name="groups" size="16px" />
            {{
              t('admin.checkIn.rooms.countChip', {
                attended: station.attendedCount,
                total: station.totalCount,
              })
            }}
          </span>
        </div>
      </div>
      <div v-else-if="isLoading" class="scanner-meta">
        <q-skeleton type="text" width="36%" />
        <q-skeleton type="text" width="58%" />
        <q-skeleton type="text" width="70%" />
      </div>
    </header>

    <section v-if="loadError" class="scanner-panel">
      <q-banner dense rounded class="bg-negative text-white">
        {{ loadError }}
      </q-banner>
    </section>

    <template v-else-if="station">
      <section class="camera-panel">
        <div :id="scannerElementId" class="camera-viewport" />
        <div class="scan-reticle" aria-hidden="true">
          <div class="scan-reticle__box">
            <span class="scan-reticle__corner scan-reticle__corner--tl" />
            <span class="scan-reticle__corner scan-reticle__corner--tr" />
            <span class="scan-reticle__corner scan-reticle__corner--bl" />
            <span class="scan-reticle__corner scan-reticle__corner--br" />
          </div>
        </div>
        <p v-if="cameraError" class="camera-status camera-status--error">{{ cameraError }}</p>
        <p v-else-if="!isCameraActive && !lastResult" class="camera-status">
          {{ t('admin.checkIn.openingCamera') }}
        </p>

        <Transition name="result-slide">
          <section
            v-if="lastResult"
            class="result-card"
            :class="resultCardClass"
            role="status"
            aria-live="polite"
          >
            <div class="result-card__title">{{ resultTitle }}</div>
            <div v-if="lastResult.candidate" class="result-card__body">
              <ImageDisplay
                :image-path="lastResult.candidate.profileImage"
                :alt="lastResult.candidate.fullnameTh"
                width="72px"
                height="90px"
                object-fit="cover"
                border-radius="8px"
              />
              <dl class="result-card__fields">
                <div>
                  <dt>{{ t('admin.checkIn.station.name') }}</dt>
                  <dd>{{ lastResult.candidate.titleTh }} {{ lastResult.candidate.fullnameTh }}</dd>
                </div>
                <div>
                  <dt>
                    {{
                      lastResult.candidate.nationalId
                        ? t('admin.checkIn.station.nationalId')
                        : t('admin.checkIn.station.passport')
                    }}
                  </dt>
                  <dd>
                    {{ lastResult.candidate.nationalId || lastResult.candidate.passportNo || '-' }}
                  </dd>
                </div>
                <div class="result-card__pair">
                  <div>
                    <dt>{{ t('admin.checkIn.station.seat') }}</dt>
                    <dd>{{ lastResult.candidate.seatNumber }}</dd>
                  </div>
                  <div>
                    <dt>{{ t('admin.checkIn.station.room') }}</dt>
                    <dd>{{ lastResult.candidate.roomLabel || '-' }}</dd>
                  </div>
                </div>
                <div
                  v-if="
                    lastResult.type === 'ALREADY_CHECKED_IN' && lastResult.candidate.checkedInAt
                  "
                >
                  <dt>{{ t('admin.checkIn.station.checkedInAt') }}</dt>
                  <dd>{{ formatCheckedInAt(lastResult.candidate.checkedInAt) }}</dd>
                </div>
              </dl>
            </div>
            <div v-if="lastResult.type === 'WRONG_ROOM'" class="result-card__expected">
              <template v-if="lastResult.expectedRoom">
                {{ t('admin.checkIn.station.expectedRoom') }}:
                {{ formatExpectedRoom(lastResult.expectedRoom) }}
              </template>
              <template v-else>
                {{ t('admin.checkIn.station.noSeatHint') }}
              </template>
            </div>
            <button type="button" class="result-card__dismiss" @click="lastResult = null">
              {{ t('admin.checkIn.station.dismiss') }}
            </button>
          </section>
        </Transition>
      </section>

      <section class="manual-panel">
        <div class="manual-panel__handle" aria-hidden="true" />
        <AppLabeledInput
          v-model="manualCode"
          :label="t('admin.checkIn.manualLabel')"
          :placeholder="t('admin.checkIn.manualPlaceholder')"
          maxlength="64"
          hide-bottom-space
          :disable="isSubmitting"
          @keyup.enter="submitManualCode"
        />
        <AppButton
          :label="t('admin.checkIn.submitCode')"
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
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';
import ImageDisplay from 'src/components/base/image-display.vue';
import { useBarcodeCamera } from 'src/composables/use-barcode-camera';
import {
  closeAssistSession,
  getRoomStation,
  submitAssistScan,
} from 'src/services/check-in-assist.service';
import type { AssistEvent, AssistExpectedRoom, RoomStation } from 'src/types/check-in-assist.types';
import { normalizeScanPayload } from 'src/utils/scan-keyboard';
import {
  buildExamRoomDisplay,
  normalizeExamRoomNo,
  type ExamRoomDisplay,
} from 'src/utils/check-in-room-label';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();

const casId = computed(() => Number(route.params.casId));
const station = ref<RoomStation | null>(null);
const isLoading = ref(true);
const loadError = ref('');
const manualCode = ref('');
const isSubmitting = ref(false);
const lastResult = ref<AssistEvent | null>(null);

const { scannerElementId, isCameraActive, cameraError, startCamera, stopCamera } =
  useBarcodeCamera();

const roomDisplay = computed((): ExamRoomDisplay | null => {
  if (!station.value) return null;
  return buildExamRoomDisplay(
    station.value,
    (roomNo) => t('admin.checkIn.rooms.roomNo', { room: roomNo }),
    (floor) => t('admin.checkIn.rooms.floor', { floor }),
  );
});

const sessionTimeLabel = computed((): string => {
  if (!station.value) return '';
  const start = station.value.sessionStart?.slice(0, 5);
  const end = station.value.sessionEnd?.slice(0, 5);
  if (start && end) return `${start}–${end}`;
  return start ?? end ?? '';
});

const resultTitle = computed((): string => {
  switch (lastResult.value?.type) {
    case 'CHECKED_IN':
      return t('admin.checkIn.result.checkedIn');
    case 'ALREADY_CHECKED_IN':
      return t('admin.checkIn.result.alreadyCheckedIn');
    case 'NOT_FOUND':
      return t('admin.checkIn.result.notFound');
    case 'INVALID_CODE':
      return t('admin.checkIn.result.invalidCode');
    case 'WRONG_ROOM':
      return t('admin.checkIn.result.wrongRoom');
    default:
      return '';
  }
});

const resultCardClass = computed((): string => {
  switch (lastResult.value?.type) {
    case 'CHECKED_IN':
      return 'result-card--success';
    case 'ALREADY_CHECKED_IN':
      return 'result-card--warning';
    case 'WRONG_ROOM':
    case 'NOT_FOUND':
    case 'INVALID_CODE':
      return 'result-card--error';
    default:
      return '';
  }
});

const formatExpectedRoom = (expected: AssistExpectedRoom): string => {
  const parts = [expected.locationName];
  const roomNo = normalizeExamRoomNo(expected.roomNo);
  if (roomNo) {
    parts.push(t('admin.checkIn.rooms.roomNo', { room: roomNo }));
  }
  if (expected.floorNo != null) {
    parts.push(t('admin.checkIn.rooms.floor', { floor: expected.floorNo }));
  }
  if (expected.seatNumber) {
    parts.push(`${t('admin.checkIn.station.seat')} ${expected.seatNumber}`);
  }
  const start = expected.sessionStart?.slice(0, 5);
  const end = expected.sessionEnd?.slice(0, 5);
  if (start && end) {
    parts.push(`${start}–${end}`);
  }
  return parts.join(' · ');
};

const formatCheckedInAt = (iso: string): string => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const goBack = async (): Promise<void> => {
  await stopCamera();
  await router.push({ name: 'admin-check-in-rooms' });
};

const closeAndLeave = async (): Promise<void> => {
  if (station.value) {
    try {
      await closeAssistSession(station.value.casId);
    } catch (error) {
      console.error(error);
    }
  }
  await goBack();
};

const notifyForResult = (event: AssistEvent): void => {
  switch (event.type) {
    case 'CHECKED_IN':
      $q.notify({
        type: 'positive',
        message: t('admin.checkIn.notify.checkedIn'),
        position: 'top',
      });
      break;
    case 'ALREADY_CHECKED_IN':
      $q.notify({
        type: 'warning',
        message: t('admin.checkIn.notify.alreadyCheckedIn'),
        position: 'top',
      });
      break;
    case 'WRONG_ROOM':
      $q.notify({
        type: 'negative',
        message: event.expectedRoom
          ? t('admin.checkIn.notify.wrongRoom')
          : t('admin.checkIn.notify.noSeatAssigned'),
        position: 'top',
      });
      break;
    case 'NOT_FOUND':
      $q.notify({ type: 'negative', message: t('admin.checkIn.notify.notFound'), position: 'top' });
      break;
    case 'INVALID_CODE':
      $q.notify({
        type: 'warning',
        message: t('admin.checkIn.notify.invalidCode'),
        position: 'top',
      });
      break;
    default:
      break;
  }
};

const resolveSubmitErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (
      error as { response?: { status?: number; data?: { message?: string | string[] } } }
    ).response;
    const status = response?.status;
    if (status === 410) {
      return t('admin.checkIn.errors.stationExpired');
    }
    if (status === 401 || status === 403) {
      return t('admin.checkIn.errors.unauthorized');
    }
    const rawMessage = response?.data?.message;
    if (Array.isArray(rawMessage)) return rawMessage.join(', ');
    if (typeof rawMessage === 'string') return rawMessage;
  }
  return t('admin.checkIn.errors.submitFailed');
};

const submitCode = async (rawCode: string): Promise<void> => {
  if (!station.value || isSubmitting.value) return;
  const code = normalizeScanPayload(rawCode).slice(0, 64);
  if (!code) return;

  isSubmitting.value = true;
  try {
    const result = await submitAssistScan(station.value.casId, code);
    lastResult.value = result;
    notifyForResult(result);
    manualCode.value = '';
    if (result.type === 'CHECKED_IN') {
      station.value = {
        ...station.value,
        attendedCount: Math.min(station.value.totalCount, station.value.attendedCount + 1),
      };
    }
  } catch (error) {
    console.error(error);
    const message = resolveSubmitErrorMessage(error);
    $q.notify({ type: 'negative', message, position: 'top' });
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 410
    ) {
      await goBack();
    }
  } finally {
    isSubmitting.value = false;
  }
};

const submitManualCode = async (): Promise<void> => {
  await submitCode(manualCode.value);
};

onMounted(async () => {
  if (!Number.isInteger(casId.value) || casId.value <= 0) {
    loadError.value = t('admin.checkIn.errors.invalidJoinLink');
    isLoading.value = false;
    return;
  }

  try {
    station.value = await getRoomStation(casId.value);
    await nextTick();
    await startCamera((code) => {
      void submitCode(code);
    });
  } catch (error) {
    console.error(error);
    loadError.value = t('admin.checkIn.errors.stationExpired');
    await stopCamera();
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped lang="scss">
.station-scanner-page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: #0b1220;
}

.scanner-header {
  flex: 0 0 auto;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 12px;
  background: var(--surface-card);

  &__nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
  }

  &__icon-btn {
    min-width: 44px;
    min-height: 44px;
  }

  &__title {
    margin: 2px 4px 0;
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1.25;
    color: var(--text-primary);
  }

  &__close {
    min-height: 44px;
    padding: 0 10px;
    font-weight: 700;
    color: var(--negative);
  }
}

.scanner-meta {
  margin-top: 10px;
  padding: 14px;
  border-radius: 16px;
  background: #f4f7fb;

  &__room {
    font-size: 1.2rem;
    font-weight: 800;
    line-height: 1.25;
    color: var(--text-primary);
  }

  &__exam {
    margin-top: 2px;
    font-size: 0.92rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__place {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin-top: 4px;
    color: var(--text-secondary);
    font-size: 0.85rem;
    line-height: 1.4;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
}

.scanner-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #e3e8ef;

  &--count {
    background: var(--badge-primary-bg);
    border-color: transparent;
    color: var(--primary);
  }
}

.scanner-panel {
  padding: 16px;
}

.camera-panel {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 38dvh;
}

.camera-viewport {
  width: 100%;
  flex: 1;
  min-height: 38dvh;
  overflow: hidden;
  background: #0b1220;
}

.camera-status {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 12px;
  margin: 0;
  font-size: 0.85rem;
  color: #cbd5e1;
  text-align: center;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(11, 18, 32, 0.7);

  &--error {
    color: #ef9a9a;
  }
}

.scan-reticle {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 1;

  &__box {
    position: relative;
    width: min(68vw, 240px);
    aspect-ratio: 1;
  }

  &__corner {
    position: absolute;
    width: 28px;
    height: 28px;
    border: 3px solid rgba(255, 255, 255, 0.92);
    border-radius: 4px;

    &--tl {
      top: 0;
      left: 0;
      border-right: 0;
      border-bottom: 0;
    }

    &--tr {
      top: 0;
      right: 0;
      border-left: 0;
      border-bottom: 0;
    }

    &--bl {
      bottom: 0;
      left: 0;
      border-right: 0;
      border-top: 0;
    }

    &--br {
      bottom: 0;
      right: 0;
      border-left: 0;
      border-top: 0;
    }
  }
}

.result-card {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  padding: 12px;
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);

  &--success {
    background: #1b7a3a;
  }

  &--warning {
    background: #c05600;
  }

  &--error {
    background: #b71c1c;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 700;
  }

  &__body {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    align-items: flex-start;
  }

  &__fields {
    margin: 0;
    display: grid;
    gap: 6px;
    flex: 1;
    min-width: 0;

    dt {
      font-size: 0.72rem;
      opacity: 0.85;
    }

    dd {
      margin: 0;
      font-weight: 600;
      word-break: break-word;
    }
  }

  &__pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  &__expected {
    margin-top: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  &__dismiss {
    margin-top: 10px;
    width: 100%;
    min-height: 40px;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }
}

.result-slide-enter-active,
.result-slide-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.result-slide-enter-from,
.result-slide-leave-to {
  transform: translateY(12px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .result-slide-enter-active,
  .result-slide-leave-active {
    transition: none;
  }
}

.manual-panel {
  display: grid;
  gap: 12px;
  padding: 10px 16px calc(16px + env(safe-area-inset-bottom, 0px));
  background: var(--surface-card);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);

  &__handle {
    width: 36px;
    height: 4px;
    margin: 0 auto 2px;
    border-radius: 999px;
    background: #d7dee8;
  }
}

.submit-btn {
  height: 48px;
  min-height: 48px;
  border-radius: 12px !important;
}
</style>
