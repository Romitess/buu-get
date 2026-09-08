<template>
  <q-page class="station-scanner-page">
    <header class="scanner-top-bar">
      <div class="scanner-top-bar__content">
        <q-btn
          flat
          dense
          round
          icon="arrow_back"
          class="scanner-top-bar__back"
          :aria-label="t('admin.checkIn.backAria')"
          @click="goBack"
        />
        <div class="scanner-top-bar__text">
          <h1 class="scanner-top-bar__title">{{ t('admin.checkIn.station.pageTitle') }}</h1>
          <p v-if="station" class="scanner-top-bar__exam">
            {{ station.examName }} · {{ roomHeadline }}
          </p>
          <p v-else-if="isLoading" class="scanner-top-bar__exam">
            {{ t('admin.checkIn.loading') }}
          </p>
        </div>
        <AppButton
          flat
          :label="t('admin.checkIn.station.closeStation')"
          :aria-label="t('admin.checkIn.station.closeAria')"
          :disable="!station"
          @click="closeAndLeave"
        />
      </div>
      <p v-if="station" class="scanner-top-bar__count">
        {{
          t('admin.checkIn.rooms.attendedCount', {
            attended: station.attendedCount,
            total: station.totalCount,
          })
        }}
        · {{ sessionTimeLabel }}
      </p>
    </header>

    <section v-if="loadError" class="scanner-panel">
      <q-banner dense rounded class="bg-negative text-white">
        {{ loadError }}
      </q-banner>
    </section>

    <template v-else-if="station">
      <section class="camera-panel">
        <div :id="scannerElementId" class="camera-viewport" />
        <p v-if="cameraError" class="camera-error">{{ cameraError }}</p>
        <p v-else-if="!isCameraActive" class="camera-hint">{{ t('admin.checkIn.openingCamera') }}</p>
      </section>

      <Transition name="result-slide">
        <section v-if="lastResult" class="result-card" :class="resultCardClass">
          <div class="result-card__title">{{ resultTitle }}</div>
          <div v-if="lastResult.candidate" class="result-card__body">
            <ImageDisplay
              :image-path="lastResult.candidate.profileImage"
              :alt="lastResult.candidate.fullnameTh"
              width="96px"
              height="120px"
              object-fit="cover"
              border-radius="8px"
            />
            <dl class="result-card__fields">
              <div>
                <dt>{{ t('admin.checkIn.station.name') }}</dt>
                <dd>
                  {{ lastResult.candidate.titleTh }} {{ lastResult.candidate.fullnameTh }}
                </dd>
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
              <div>
                <dt>{{ t('admin.checkIn.station.seat') }}</dt>
                <dd>{{ lastResult.candidate.seatNumber }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.checkIn.station.room') }}</dt>
                <dd>{{ lastResult.candidate.roomLabel || '-' }}</dd>
              </div>
              <div>
                <dt>{{ t('admin.checkIn.station.status') }}</dt>
                <dd>{{ resultTitle }}</dd>
              </div>
              <div v-if="lastResult.type === 'ALREADY_CHECKED_IN' && lastResult.candidate.checkedInAt">
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
          <AppButton
            flat
            class="q-mt-sm"
            :label="t('admin.checkIn.station.dismiss')"
            @click="lastResult = null"
          />
        </section>
      </Transition>

      <section class="manual-panel">
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
import type {
  AssistEvent,
  AssistExpectedRoom,
  RoomStation,
} from 'src/types/check-in-assist.types';
import { normalizeScanPayload } from 'src/utils/scan-keyboard';

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

const roomHeadline = computed((): string => {
  if (!station.value) return '';
  const parts = [station.value.locationName];
  if (station.value.roomNo) {
    parts.push(t('admin.checkIn.rooms.roomNo', { room: station.value.roomNo }));
  }
  return parts.join(' · ');
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
  if (expected.roomNo) {
    parts.push(t('admin.checkIn.rooms.roomNo', { room: expected.roomNo }));
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
      $q.notify({ type: 'positive', message: t('admin.checkIn.notify.checkedIn'), position: 'top' });
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
      $q.notify({ type: 'warning', message: t('admin.checkIn.notify.invalidCode'), position: 'top' });
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
    font-size: 1.15rem;
    font-weight: 700;
  }

  &__exam,
  &__count {
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
  min-height: 40dvh;
}

.camera-viewport {
  width: 100%;
  flex: 1;
  min-height: 40dvh;
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

.result-card {
  flex: 0 0 auto;
  margin: 12px 16px;
  padding: 12px;
  border-radius: 12px;
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

    dt {
      font-size: 0.75rem;
      opacity: 0.85;
    }

    dd {
      margin: 0;
      font-weight: 600;
    }
  }

  &__expected {
    margin-top: 10px;
    font-weight: 600;
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
