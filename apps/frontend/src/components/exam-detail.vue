<template>
  <q-card
    class="exam-detail-card buu-card"
    :class="{ 'exam-detail-card--summary': isSummaryOnly }"
    flat
  >
    <div class="accent-bar"></div>
    <q-card-section class="exam-detail-card__section q-pa-md q-pl-lg">
      <div v-if="badgeText" class="q-mb-sm">
        <div class="exam-badge">
          <div class="exam-dot bg-primary"></div>
          <span class="exam-badge-text text-primary">{{ badgeText }}</span>
        </div>
      </div>

      <div class="exam-detail-card__copy">
        <div class="exam-detail-card__title text-weight-bold text-dark">
          {{ title }}
        </div>

        <div v-if="subtitle" class="exam-detail-card__subtitle">
          {{ subtitle }}
        </div>
      </div>

      <div v-if="hasMeta" class="row items-center detail-row q-mt-md">
        <div v-if="locationText" class="row items-center">
          <q-icon name="location_on" color="primary" size="22px" class="q-mr-xs" />
          <span class="detail-text text-dark">{{ locationText }}</span>
        </div>
        <div v-if="feeText" class="row items-center">
          <q-icon name="payments" color="positive" size="22px" class="q-mr-xs" />
          <span class="detail-text text-dark">{{ feeText }}</span>
        </div>
        <div v-if="formatText" class="row items-center">
          <q-icon :name="formatIcon" color="dark" size="22px" class="q-mr-xs" />
          <span class="detail-text text-dark">{{ formatText }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ExamDetailProps } from 'src/types/exam';

const props = defineProps<ExamDetailProps>();

const hasMeta = computed(
  (): boolean => Boolean(props.locationText || props.feeText || props.formatText),
);

/** Title + subtitle only (multi-exam / empty day) — center copy on the Y axis */
const isSummaryOnly = computed((): boolean => !props.badgeText && !hasMeta.value);

const formatIcon = computed((): string => {
  const format = props.formatText?.toLowerCase() || '';
  if (format.includes('กระดาษ') || format.includes('paper')) {
    return 'description';
  }
  return 'computer';
});
</script>

<style scoped lang="scss">
.exam-detail-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card) !important;
  transition:
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--detail-card-hover-shadow) !important;
    background-color: var(--detail-card-hover-bg);
  }

  &__section {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 52rem;
  }

  &__title {
    font-size: 1.35rem;
    line-height: 1.35;
  }

  /* Readable body copy for older users — avoid tiny caption grey */
  &__subtitle {
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 500;
    color: var(--text-secondary, #4a5568);
  }

  /* Multi-exam / empty-day: keep title+subtitle vertically centered in the card */
  &--summary {
    min-height: 112px;

    .exam-detail-card__section {
      min-height: 112px;
      justify-content: center;
    }
  }
}

.accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background-color: var(--primary);
  z-index: 1;
}

.exam-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--detail-card-badge-bg);
  padding: 6px 14px;
  border-radius: 16px;
  gap: 8px;
}

.exam-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.exam-badge-text {
  font-size: 0.95rem;
  font-weight: 700;
}

.detail-text {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
}

.detail-row {
  gap: 24px;

  :global(.exam-schedule) & {
    gap: 21.6px;
  }
}

@media (max-width: 600px) {
  .exam-detail-card {
    border-radius: 12px;

    &__title {
      font-size: 1.2rem;
      line-height: 1.35;
    }

    &__subtitle {
      font-size: 0.95rem;
    }

    &--summary {
      min-height: 100px;

      .exam-detail-card__section {
        min-height: 100px;
      }
    }
  }

  .q-card__section {
    padding: 16px !important;
  }

  .detail-row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .detail-text {
    font-size: 1rem;
  }
}
</style>
