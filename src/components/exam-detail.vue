<template>
  <q-card class="exam-detail-card buu-card" flat>
    <div class="accent-bar"></div>
    <q-card-section class="q-pa-md q-pl-lg">
      <div class="q-mb-sm" v-if="badgeText">
        <div class="exam-badge">
          <div class="exam-dot bg-primary"></div>
          <span class="exam-badge-text text-primary">{{ badgeText }}</span>
        </div>
      </div>

      <div class="text-h6 text-weight-bold q-mb-xs text-dark">
        {{ title }}
      </div>

      <div class="text-caption text-grey-7 q-mb-md" v-if="subtitle">
        {{ subtitle }}
      </div>

      <div class="row items-center q-gutter-x-lg">
        <div class="row items-center" v-if="locationText">
          <q-icon name="location_on" color="primary" size="20px" class="q-mr-xs" />
          <span class="detail-text text-dark">{{ locationText }}</span>
        </div>
        <div class="row items-center" v-if="feeText">
          <q-icon name="payments" color="positive" size="20px" class="q-mr-xs" />
          <span class="detail-text text-dark">{{ feeText }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { ExamDetailProps } from 'src/types/exam';

defineProps<ExamDetailProps>();
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
  padding: 4px 12px;
  border-radius: 16px;
  gap: 8px;
}

.exam-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.exam-badge-text {
  font-size: 13px;
  font-weight: 700;
}

.detail-text {
  font-size: 15px;
  font-weight: 500;
}

// Responsive adjustments
@media (max-width: 600px) {
  .exam-detail-card {
    border-radius: 12px;
  }

  .q-card__section {
    padding: 16px !important;
  }

  .text-h6 {
    font-size: 1.15rem !important;
    line-height: 1.3;
  }

  .row.items-center.q-gutter-x-lg {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .detail-text {
    font-size: 14px;
  }
}
</style>
