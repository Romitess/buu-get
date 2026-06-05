<template>
  <div class="app-exam-info-card buu-card q-pa-lg">
    <div class="card-content row items-start no-wrap">
      <header class="col">
        <h2 class="exam-title text-h5 text-weight-bold q-mb-md q-ma-none">
          {{ title }}
        </h2>

        <section class="row items-center q-gutter-x-xl details-row">
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
        </section>
      </header>

      <section
        class="col-auto row no-wrap items-center stats-section"
        v-if="isAdmin && !isAttendance && !isScore"
      >
        <q-separator vertical class="stat-divider q-mr-md gt-xs" v-if="!hideMainSeparator" />
        <div class="text-center q-px-lg">
          <div class="applicant-label text-grey-7 text-caption">
            {{ $t('components.examInfoCard.registeredCount') }}
          </div>
          <div class="applicant-value text-h4 text-weight-medium text-dark">
            {{ applicantCount }}
          </div>
        </div>
        <q-separator vertical class="stat-divider q-mx-sm" v-if="!hidePaid" />
        <div class="text-center q-px-lg" v-if="!hidePaid">
          <div class="applicant-label text-grey-7 text-caption">
            {{ $t('components.examInfoCard.paidCount') }}
          </div>
          <div class="applicant-value text-h4 text-weight-medium text-dark">
            {{ paidCount }}/{{ totalCapacity }}
          </div>
        </div>
      </section>
      <section
        class="col-auto row no-wrap items-center stats-section"
        v-else-if="isAdmin && isScore"
      >
        <q-separator vertical class="stat-divider q-mr-md gt-xs" v-if="!hideMainSeparator" />
        <div class="text-center q-px-lg">
          <div class="applicant-label text-grey-7 text-caption">
            {{ $t('components.examInfoCard.examTakerCount') }}
          </div>
          <div class="applicant-value text-h4 text-weight-medium text-dark">
            {{ applicantCount }}
          </div>
        </div>
      </section>
      <section
        class="col-auto row no-wrap items-center stats-section"
        v-else-if="isAdmin && isAttendance"
      >
        <q-separator vertical class="stat-divider q-mr-md gt-xs" v-if="!hideMainSeparator" />
        <div class="text-center q-px-lg">
          <div class="applicant-label text-grey-7 text-caption">
            {{ $t('components.examInfoCard.attendedCount') }}
          </div>
          <div class="applicant-value text-h4 text-weight-medium text-dark">
            {{ applicantCount }}/{{ totalCapacity }}
          </div>
        </div>
      </section>
      <section class="col-auto text-right self-start" v-else-if="applicantCount !== undefined">
        <div class="applicant-label text-grey-7 text-caption">
          {{ $t('components.examInfoCard.candidateCount') }}
        </div>
        <div class="applicant-value text-h4 text-weight-bold text-dark">{{ applicantCount }}</div>
      </section>
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
  isAdmin?: boolean;
  isAttendance?: boolean;
  isScore?: boolean;
  paidCount?: number | string;
  totalCapacity?: number | string;
  hidePaid?: boolean;
  hideMainSeparator?: boolean;
}

withDefaults(defineProps<Props>(), {
  isAdmin: false,
  hidePaid: false,
  isAttendance: false,
  isScore: false,
  hideMainSeparator: false,
});
</script>

<style scoped lang="scss">
.app-exam-info-card {
  border-left: 8px solid var(--primary);
  border-radius: var(--radius-md);
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
  border-radius: var(--radius-pill);
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
  color: var(--dashboard-header-text);
  line-height: 1.3;
}

.info-item {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);

  :deep(.q-icon) {
    color: var(--dashboard-info-item-icon);
  }
}

.stat-divider {
  height: 70px;
  background-color: var(--dashboard-divider-color);
}

.applicant-label {
  margin-bottom: 2px;
}

.applicant-value {
  line-height: 1;
}

@media (max-width: 800px) {
  .details-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .card-content {
    flex-direction: column;
  }

  .stats-section {
    margin-top: 16px;
    width: 100%;
    justify-content: space-around;
  }

  .text-right {
    text-align: left !important;
    margin-top: 16px;
    padding-left: 0;
  }
}
</style>
