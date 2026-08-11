<template>
  <q-card class="round-exam" :class="{ 'round-exam--full': isFull }">
    <q-card-section class="round-exam__time q-pa-none">
      <ExamClock :time-range="timeRange" />
    </q-card-section>

    <q-card-section class="round-exam__info q-pa-none">
      <h3 class="round-exam__title">{{ title }}</h3>
      <AppButton
        :label="roundTypeLabel || t('examSchedule.roundTypeLabel')"
        color="secondary"
        dense
        class="round-exam__tag"
      />
      <div v-if="locationText" class="round-exam__meta row items-center no-wrap">
        <q-icon name="location_on" color="primary" size="20px" class="q-mr-xs" />
        <span class="round-exam__meta-text">{{ locationText }}</span>
      </div>
      <div v-if="feeText" class="round-exam__meta row items-center no-wrap">
        <q-icon name="payments" color="positive" size="20px" class="q-mr-xs" />
        <span class="round-exam__meta-text">{{ feeText }}</span>
      </div>
    </q-card-section>
    <q-space />

    <q-card-actions class="round-exam__action-group q-pa-none">
      <div class="round-exam__status" :class="isDisabled ? 'text-negative' : 'text-positive'">
        <q-icon
          :name="isExpired ? 'history_toggle_off' : isNotOpenYet ? 'pending_actions' : 'groups'"
          size="xs"
        />
        <span class="round-exam__seats">
          {{
            isExpired
              ? t('examSchedule.expiredStatusText')
              : isNotOpenYet
                ? t('examSchedule.notOpenStatusText')
                : isFull
                  ? fullStatusText || t('examSchedule.fullStatusText')
                  : `${availableStatusTextPrefix || t('examSchedule.availableStatusTextPrefix')}${availableSeats}${availableStatusTextSuffix || t('examSchedule.availableStatusTextSuffix')}`
          }}
          <span v-if="!isExpired && !isNotOpenYet" class="text-muted">
            ({{ totalSeats - availableSeats }}/{{ totalSeats }})
          </span>
        </span>
      </div>

      <AppButton
        :label="
          isExpired
            ? t('examSchedule.expiredBtnText')
            : isRegistered
              ? registeredBtnText || t('examSchedule.registeredBtnText')
              : isNotOpenYet
                ? t('examSchedule.notOpenBtnText')
                : isFull
                  ? fullBtnText || t('examSchedule.fullBtnText')
                  : registerBtnText || t('examSchedule.registerBtnText')
        "
        :color="isDisabled ? 'full' : 'primary'"
        :disable="isDisabled"
        class="round-exam__btn"
        @click="handleRegister"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import type { RoundExamProps } from 'src/types/exam';
import { isExamRoundRegistrationExpired } from 'src/utils/exam-registration';
import ExamClock from './exam-clock.vue';
import AppButton from '../base/app-button.vue';

const props = defineProps<RoundExamProps>();

const emit = defineEmits<{
  (e: 'register', status: 'expired' | 'notOpen' | ''): void;
}>();

const { t } = useI18n();
const isFull = computed(() => props.availableSeats <= 0);
const isRegistered = computed(() => props.isRegistered === true);

const now = ref(new Date());
const serverOffset = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let resyncTimer: ReturnType<typeof setInterval> | null = null;

async function syncTime(): Promise<void> {
  try {
    const start = Date.now();
    const response = await api.get<{ serverTime: string }>('/exam/time', { params: { _t: start } });
    if (response.data && response.data.serverTime) {
      const serverTime = new Date(response.data.serverTime).getTime();
      const end = Date.now();
      const latency = (end - start) / 2;
      serverOffset.value = serverTime + latency - end;
      now.value = getSyncedNow();
      return;
    }
  } catch {
    try {
      const start = Date.now();
      const response = await api.get('/exam', { params: { _t: start } });
      const serverDate = response.headers['date'];
      if (serverDate) {
        const serverTime = new Date(serverDate).getTime();
        const end = Date.now();
        const latency = (end - start) / 2;
        serverOffset.value = serverTime + latency - end;
        now.value = getSyncedNow();
        return;
      }
    } catch (err) {
      console.error('[TimeSync] Failed to sync with backend', err);
    }
  }
  now.value = getSyncedNow();
}

/** Absolute synced clock for registration window checks (Bangkok instants via +07:00) */
function getSyncedNow(): Date {
  return new Date(Date.now() + serverOffset.value);
}

onMounted(async () => {
  await syncTime();

  timer = setInterval(() => {
    now.value = getSyncedNow();
  }, 1000);

  resyncTimer = setInterval(() => {
    void syncTime();
  }, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (resyncTimer) clearInterval(resyncTimer);
});

const isExpired = computed((): boolean => {
  try {
    return isExamRoundRegistrationExpired(
      {
        regEndDate: props.regEndDate ?? '',
        examDate: props.examDate ?? '',
        timeRange: props.timeRange,
      },
      now.value,
    );
  } catch (e) {
    console.error('Error calculating expiration:', e);
    return false;
  }
});

const isNotOpenYet = computed((): boolean => {
  if (!props.regStartDate) return false;
  try {
    const regStart = new Date(props.regStartDate);
    return now.value < regStart;
  } catch (e) {
    console.error('Error calculating not-open status:', e);
    return false;
  }
});

const isDisabled = computed(
  (): boolean => isFull.value || isExpired.value || isNotOpenYet.value || isRegistered.value,
);

const handleRegister = (): void => {
  if (isDisabled.value || isRegistered.value) return;
  const status = isExpired.value ? 'expired' : isNotOpenYet.value ? 'notOpen' : '';
  emit('register', status);
};
</script>

<style scoped lang="scss">
.round-exam {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
  box-shadow: none !important;
  transition: transform var(--transition-fast);
  gap: 16px;

  &--full {
    background-color: var(--surface-card);
    border-color: var(--border-color);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: none !important;
  }

  &__time {
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.3;
  }

  &__tag {
    font-weight: 600 !important;
    font-size: 0.9rem !important;
    border-radius: 10px !important;
    padding: 4px 12px !important;
    min-height: 32px !important;
  }

  &__meta {
    max-width: 100%;
  }

  &__meta-text {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    word-break: break-word;
  }

  &__action-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 0.95rem;

    .text-muted {
      color: var(--text-muted);
      font-weight: 500;
      margin-left: 2px;
    }
  }

  &__btn {
    min-width: 150px;
    min-height: 44px;
    font-size: 1rem !important;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

@media (max-width: 900px) {
  .round-exam {
    flex-wrap: wrap;
    padding: 16px;
    gap: 16px;

    &__info {
      flex: 1;
      min-width: 200px;
    }

    .q-space {
      display: none;
    }

    &__action-group {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--round-exam-divider);
      padding-top: 16px;
    }
  }
}

@media (max-width: 600px) {
  .round-exam {
    padding: 16px;
    &__title {
      font-size: 1.15rem;
    }

    &__meta-text {
      font-size: 0.95rem;
    }

    &__action-group {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    &__status {
      justify-content: center;
      width: 100%;
      font-size: 0.95rem;
    }

    &__btn {
      width: 100%;
      min-width: unset;
    }
  }
}
</style>
