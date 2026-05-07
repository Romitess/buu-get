<template>
  <div class="exam-clock">
    <q-icon name="access_time" class="exam-clock__icon" />
    <span class="exam-clock__time">{{ timeRange }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Clock Component
 * Displays the exam time slot with an icon.
 */
interface Props {
  /** Time range string (e.g., '10:30 - 11:30') */
  timeRange: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.exam-clock {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  min-width: 120px;
  transition: all 0.3s ease;

  &__icon {
    font-size: 24px;
    color: #424242;
    margin-bottom: 4px;
  }

  &__time {
    font-size: 1rem;
    font-weight: 700;
    color: #212121;
    white-space: nowrap;
  }

  &:hover {
    border-color: var(--primary-light);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

// Responsive adjustments
@media (max-width: 600px) {
  .exam-clock {
    padding: 8px 16px;
    min-width: 100px;

    &__icon {
      font-size: 20px;
    }

    &__time {
      font-size: 0.9rem;
    }
  }
}
</style>
