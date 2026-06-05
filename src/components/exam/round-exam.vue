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
            : isNotOpenYet
              ? t('examSchedule.notOpenBtnText')
              : isFull
                ? fullBtnText || t('examSchedule.fullBtnText')
                : registerBtnText || t('examSchedule.registerBtnText')
        "
        :color="isDisabled ? 'full' : 'primary'"
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
import ExamClock from './exam-clock.vue';
import AppButton from '../base/app-button.vue';

const props = defineProps<RoundExamProps>();

const emit = defineEmits<{
  (e: 'register', status: 'expired' | 'notOpen' | ''): void;
}>();

const { t } = useI18n();
const isFull = computed(() => props.availableSeats <= 0);

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
      now.value = getThaiTime();
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
        now.value = getThaiTime();
        return;
      }
    } catch (err) {
      void err;
    }
  }

  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Bangkok');
    const data = await response.json();
    if (data && data.datetime) {
      serverOffset.value = new Date(data.datetime).getTime() - Date.now();
    }
  } catch {
    try {
      const resp = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Bangkok');
      const data = await resp.json();
      if (data && data.dateTime) {
        serverOffset.value = new Date(data.dateTime).getTime() - Date.now();
      }
    } catch (err) {
      console.error('[TimeSync] Failed to sync time', err);
    }
  }
  now.value = getThaiTime();
}

function getThaiTime(): Date {
  const d = new Date(Date.now() + serverOffset.value);
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

onMounted(async () => {
  await syncTime();

  timer = setInterval(() => {
    now.value = getThaiTime();
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
  if (!props.regEndDate) return false;
  try {
    const regEnd = new Date(props.regEndDate);
    return now.value > regEnd;
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

const isDisabled = computed((): boolean => isFull.value || isExpired.value || isNotOpenYet.value);

const handleRegister = (): void => {
  const status = isExpired.value ? 'expired' : isNotOpenYet.value ? 'notOpen' : '';
  emit('register', status);
};
</script>

<style scoped lang="scss">
.round-exam {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  background: var(--surface-card);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  margin-bottom: 12px;
  box-shadow: var(--shadow-card) !important;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  gap: 14px;

  &--full {
    background-color: var(--surface-card);
    border-color: var(--border-color);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--round-exam-hover-shadow) !important;
  }

  &__time {
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    line-height: 1.2;
  }

  &__tag {
    font-weight: 500 !important;
    font-size: 0.7rem;
    border-radius: 10px !important;
    padding: 2px 8px;
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
    gap: 6px;
    font-weight: 500;
    font-size: 0.8rem;

    .text-muted {
      color: var(--text-muted);
      font-weight: 400;
      margin-left: 2px;
    }
  }

  &__btn {
    min-width: 130px;
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
      font-size: 1.1rem;
    }

    &__action-group {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    &__status {
      justify-content: center;
      width: 100%;
    }

    &__btn {
      width: 100%;
      min-width: unset;
    }
  }
}
</style>
