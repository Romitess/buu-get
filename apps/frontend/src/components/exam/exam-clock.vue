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
  padding: 10px 18px;
  background: transparent;
  border: 1px solid var(--border-color) !important;
  border-radius: 10px;
  min-width: 124px;
  transition: border-color var(--transition-fast);
  box-shadow: none !important;

  &__icon {
    font-size: 22px;
    color: var(--text-secondary, var(--clock-icon));
    margin-bottom: 4px;
  }

  &__time {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--clock-text);
    white-space: nowrap;
  }

  &:hover {
    border-color: var(--border-color);
    box-shadow: none !important;
  }
}

@media (max-width: 600px) {
  .exam-clock {
    padding: 8px 14px;
    min-width: 104px;

    &__icon {
      font-size: 20px;
    }

    &__time {
      font-size: 1rem;
    }
  }
}
</style>
