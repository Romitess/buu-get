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
        pill
        dense
        class="round-exam__tag"
      />
    </q-card-section>
    <q-space />

    <q-card-actions class="round-exam__action-group q-pa-none">
      <div class="round-exam__status" :class="isFull ? 'text-negative' : 'text-positive'">
        <q-icon name="groups" size="xs" />
        <span class="round-exam__seats">
          {{
            isFull
              ? fullStatusText || t('examSchedule.fullStatusText')
              : `${availableStatusTextPrefix || t('examSchedule.availableStatusTextPrefix')}${availableSeats}${availableStatusTextSuffix || t('examSchedule.availableStatusTextSuffix')}`
          }}
          <span class="text-muted">({{ totalSeats - availableSeats }}/{{ totalSeats }})</span>
        </span>
      </div>

      <AppButton
        :label="
          isFull
            ? fullBtnText || t('examSchedule.fullBtnText')
            : registerBtnText || t('examSchedule.registerBtnText')
        "
        :color="isFull ? 'full' : 'primary'"
        class="round-exam__btn"
        @click="$emit('register')"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RoundExamProps } from 'src/types/exam';
import ExamClock from './exam-clock.vue';
import AppButton from '../base/app-button.vue';

const props = defineProps<RoundExamProps>();

defineEmits<{
  (e: 'register'): void;
}>();

const { t } = useI18n();
const isFull = computed(() => props.availableSeats <= 0);
</script>

<style scoped lang="scss">
.round-exam {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e8e8e8;
  margin-bottom: 12px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25) !important;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
  gap: 16px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &--full {
    background-color: #ffffff;
    border-color: #e8e8e8;
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
    color: #1a1a1a;
    margin: 0;
    line-height: 1.2;
  }

  &__tag {
    font-weight: 700 !important;
    font-size: 0.75rem;
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
    font-weight: 600;
    font-size: 0.8rem;

    .text-muted {
      color: #9e9e9e;
      font-weight: 400;
      margin-left: 2px;
    }
  }

  &__btn {
    min-width: 130px;
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
      border-top: 1px solid #f5f5f5;
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
