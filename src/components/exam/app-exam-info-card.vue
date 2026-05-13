<template>
  <div class="app-exam-info-card buu-card q-pa-lg">
    <div class="card-content row items-start no-wrap">
      <div class="col">
        <!-- Title -->
        <div class="exam-title text-h5 text-weight-bold text-dark q-mb-sm">
          {{ title }}
        </div>

        <!-- Details Row -->
        <div class="row items-center q-gutter-x-xl details-row">
          <div class="info-item row items-center">
            <q-icon name="event" size="20px" class="q-mr-sm" />
            <span>{{ date }}</span>
          </div>
          <div class="info-item row items-center">
            <q-icon name="schedule" size="20px" class="q-mr-sm" />
            <span>{{ time }}</span>
          </div>
          <div class="info-item row items-center">
            <q-icon name="location_on" size="20px" class="q-mr-sm" />
            <span>{{ location }}</span>
          </div>
        </div>
      </div>

      <!-- Right Side: Applicant Count -->
      <div class="col-auto text-right self-start" v-if="applicantCount !== undefined">
        <div class="applicant-label text-grey-7 text-caption">จำนวนคนที่สมัคร</div>
        <div class="applicant-value text-h4 text-weight-bold text-dark">{{ applicantCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  date: string;
  time: string;
  location: string;
  applicantCount?: number | string;
}

defineProps<Props>();
</script>

<style scoped lang="scss">
.app-exam-info-card {
  border-left: 8px solid var(--primary);
  border-radius: 12px;
  background: var(--surface-card);
  box-shadow: var(--shadow-card) !important;
  position: relative;
  overflow: hidden;
  min-height: 133px;
  display: flex;
  align-items: center;

  .card-content {
    width: 100%;
  }
}

.info-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--detail-card-badge-bg);
  padding: 4px 12px;
  border-radius: 100px;
  gap: 8px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--primary);
}

.badge-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
}

.exam-title {
  line-height: 1.3;
}

.info-item {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);

  :deep(.q-icon) {
    color: var(--text-primary);
  }
}

.applicant-label {
  margin-bottom: 2px;
}

.applicant-value {
  line-height: 1;
}

/* Responsive */
@media (max-width: 800px) {
  .details-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .card-content {
    flex-direction: column;
  }

  .text-right {
    text-align: left !important;
    margin-top: 16px;
    padding-left: 0;
  }
}
</style>
