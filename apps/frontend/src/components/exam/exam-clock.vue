<template>
  <q-card class="exam-clock" flat bordered>
    <q-icon name="access_time" class="exam-clock__icon" />
    <span class="exam-clock__time">{{ timeRange }}</span>
  </q-card>
</template>

<script setup lang="ts">
import type { ExamClockProps } from 'src/types/exam';

defineProps<ExamClockProps>();
</script>

<style scoped lang="scss">
.exam-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  background: var(--clock-bg);
  border: 1.5px solid var(--clock-border) !important;
  border-radius: 12px;
  min-width: 132px;
  transition: all 0.3s ease;
  box-shadow: var(--clock-shadow) !important;

  &__icon {
    font-size: 26px;
    color: var(--clock-icon);
    margin-bottom: 6px;
  }

  &__time {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--clock-text);
    white-space: nowrap;
  }

  &:hover {
    border-color: var(--primary-light);
    box-shadow: var(--clock-shadow-hover);
  }
}

@media (max-width: 600px) {
  .exam-clock {
    padding: 10px 16px;
    min-width: 110px;

    &__icon {
      font-size: 22px;
    }

    &__time {
      font-size: 1.05rem;
    }
  }
}
</style>
