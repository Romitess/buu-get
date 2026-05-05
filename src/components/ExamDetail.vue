<template>
  <q-card class="exam-detail-card buu-card" flat>
    <q-card-section class="q-pa-lg">
      <!-- Badge Section -->
      <div class="q-mb-md" v-if="badgeText">
        <div class="exam-badge">
          <div class="exam-dot bg-primary"></div>
          <span class="exam-badge-text text-primary">{{ badgeText }}</span>
        </div>
      </div>

      <!-- Title -->
      <div class="text-h5 text-weight-bold q-mb-sm text-dark">
        {{ title }}
      </div>

      <!-- Subtitle -->
      <div class="text-body1 text-grey-7 q-mb-lg" v-if="subtitle">
        {{ subtitle }}
      </div>

      <!-- Details Row -->
      <div class="row items-center q-gutter-x-xl">
        <div class="row items-center" v-if="locationText">
          <q-icon name="location_on" color="primary" size="24px" class="q-mr-sm" />
          <span class="detail-text text-dark">{{ locationText }}</span>
        </div>
        <div class="row items-center" v-if="feeText">
          <q-icon name="payments" color="positive" size="24px" class="q-mr-sm" />
          <span class="detail-text text-dark">{{ feeText }}</span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
/**
 * ExamDetail Component
 * Displays the core information of an exam including title, type, location, and fee.
 */
interface Props {
  badgeText?: string;
  title: string;
  subtitle?: string;
  locationText?: string;
  feeText?: string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.exam-detail-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.exam-badge {
  display: inline-flex;
  align-items: center;
  background-color: #e8f0fe;
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
</style>
