<template>
  <article class="exam-round-card">
    <h3 class="exam-round-card__title">{{ round.roundNumber }}</h3>

    <div class="exam-round-card__meta">
      <div class="meta-row">
        <q-icon name="event" size="18px" class="meta-row__icon" />
        <span>{{ formatDateShort(round.examDate) }}</span>
      </div>
      <div class="meta-row">
        <q-icon name="edit_calendar" size="18px" class="meta-row__icon" />
        <span>{{ formatDateRange(round.regStartDate, round.regEndDate) }}</span>
      </div>
      <div class="meta-row">
        <q-icon name="timelapse" size="18px" class="meta-row__icon" />
        <span>{{ formatRegDuration(round.regStartDate, round.regEndDate) }}</span>
      </div>
      <div v-if="round.availableSeats > 0" class="meta-row">
        <q-icon name="event_seat" size="18px" class="meta-row__icon" />
        <span>
          {{ $t('home.availableRounds.table.columns.seatsAvailable', { count: round.availableSeats }) }}
        </span>
      </div>
    </div>

    <AppButton
      :label="$t('home.availableRounds.table.columns.viewDetails')"
      icon="arrow_forward"
      class="exam-round-card__cta"
      @click="emit('select', round)"
    />
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import { useAppDate } from 'src/composables/useAppDate';
import type { AvailableExamRound } from 'src/composables/use-available-exam-rounds';

interface Props {
  round: AvailableExamRound;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', round: AvailableExamRound): void;
}>();

const { t } = useI18n();
const { formatDateShort, formatDateRange, calcDaysDiff } = useAppDate();

const formatRegDuration = (regStartDate: string, regEndDate: string): string => {
  if (!regStartDate || !regEndDate) return '-';
  const days = calcDaysDiff(regStartDate, regEndDate) + 1;
  return `${days} ${t('common.day', days)}`;
};
</script>

<style scoped lang="scss">
.exam-round-card {
  background: #fff;
  border: 1px solid rgba(13, 71, 161, 0.12);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 6px 16px -8px rgba(13, 71, 161, 0.25);
  animation: round-card-enter 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(var(--stagger-index, 0) * 40ms);
}

.exam-round-card__title {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-dark, #0a3578);
  line-height: 1.35;
}

.exam-round-card__meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #546e7a;
  font-size: 0.875rem;
  line-height: 1.4;
}

.meta-row__icon {
  color: var(--primary);
  flex-shrink: 0;
  margin-top: 1px;
}

.exam-round-card__cta {
  width: 100%;
  min-height: 44px;
}

@keyframes round-card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
