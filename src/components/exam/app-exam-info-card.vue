<template>
  <div class="app-exam-info-card buu-card q-pa-lg">
    <div class="card-content row items-center no-wrap">
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
          <div
            class="info-item row items-center"
            :class="{ 'location-select-item': locationOptions.length > 0 }"
          >
            <q-icon name="location_on" size="20px" class="q-mr-sm" />
            <q-select
              v-if="locationOptions.length > 0"
              :model-value="selectedLocationId"
              :options="locationOptions"
              emit-value
              map-options
              outlined
              dense
              dropdown-icon="keyboard_arrow_down"
              popup-content-class="seat-room-menu"
              class="location-select"
              @update:model-value="$emit('update:selectedLocationId', $event)"
            />
            <span v-else>{{ location }}</span>
          </div>
        </section>
      </header>

      <section
        class="col-auto row no-wrap items-center justify-end stats-section"
        v-if="isAdmin && !isAttendance && !isScore"
      >
        <q-separator vertical class="stat-divider q-mr-md gt-xs" v-if="!hideMainSeparator" />
        <div class="count-block text-center">
          <div class="applicant-label text-grey-7">
            {{ $t('components.examInfoCard.registeredCount') }}
          </div>
          <div class="applicant-value text-weight-medium text-dark">
            {{ countWithCapacity ? `${applicantCount}/${totalCapacity}` : applicantCount }}
          </div>
        </div>
        <q-separator vertical class="stat-divider q-mx-sm" v-if="!hidePaid" />
        <div class="count-block text-center" v-if="!hidePaid">
          <div class="applicant-label text-grey-7">
            {{ $t('components.examInfoCard.paidCount') }}
          </div>
          <div class="applicant-value text-weight-medium text-dark">
            {{ paidCount }}/{{ totalCapacity }}
          </div>
        </div>
      </section>
      <section
        class="col-auto row no-wrap items-center stats-section"
        v-else-if="isAdmin && isScore"
      >
        <q-separator vertical class="stat-divider q-mr-md gt-xs" v-if="!hideMainSeparator" />
        <div class="count-block text-center">
          <div class="applicant-label text-grey-7">
            {{ $t('components.examInfoCard.examTakerCount') }}
          </div>
          <div class="applicant-value text-weight-medium text-dark">
            {{ applicantCount }}
          </div>
        </div>
      </section>
      <section
        class="col-auto row no-wrap items-center stats-section"
        v-else-if="isAdmin && isAttendance"
      >
        <q-separator vertical class="stat-divider q-mr-md gt-xs" v-if="!hideMainSeparator" />
        <div class="count-block text-center">
          <div class="applicant-label text-grey-7">
            {{ $t('components.examInfoCard.attendedCount') }}
          </div>
          <div class="applicant-value text-weight-medium text-dark">
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
  selectedLocationId?: number | null;
  locationOptions?: { label: string; value: number }[];
  applicantCount?: number | string;
  isAdmin?: boolean;
  isAttendance?: boolean;
  isScore?: boolean;
  paidCount?: number | string;
  totalCapacity?: number | string;
  hidePaid?: boolean;
  hideMainSeparator?: boolean;
  countWithCapacity?: boolean;
}

withDefaults(defineProps<Props>(), {
  selectedLocationId: null,
  locationOptions: () => [],
  isAdmin: false,
  hidePaid: false,
  isAttendance: false,
  isScore: false,
  hideMainSeparator: false,
  countWithCapacity: false,
});

defineEmits<{
  (e: 'update:selectedLocationId', value: number | null): void;
}>();
</script>

<style scoped lang="scss">
.app-exam-info-card {
  border-left: 8px solid var(--primary);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  box-shadow: var(--shadow-card) !important;
  position: relative;
  overflow: hidden;
  min-height: 126px;
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
  margin-bottom: 18px !important;
}

.info-item {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);

  :deep(.q-icon) {
    color: var(--dashboard-info-item-icon);
  }
}

.location-select-item {
  flex: 1 1 360px;
}

.location-select {
  width: min(452px, 100%);
  font-weight: 400;

  :deep(.q-field__control) {
    min-height: 40px;
    border-radius: 12px;
    color: #111111;
  }

  :deep(.q-field__control:before) {
    border: 1px solid var(--detail-dropdown-border);
  }

  :deep(.q-field__native) {
    font-size: 16px;
    font-weight: 400;
  }

  :deep(.q-field__append) {
    color: #222222;
  }
}

:global(.seat-room-menu) {
  width: min(500px, calc(100vw - 32px)) !important;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

:global(.seat-room-menu .q-item) {
  min-height: 44px;
  padding: 8px 12px;
  font-size: 16px;
}

:global(.seat-room-menu .q-item--active) {
  color: #111111;
  background: #ffffff;
}

.stat-divider {
  height: 70px;
  background-color: var(--dashboard-divider-color);
}

.stats-section {
  min-width: 160px;
  padding-top: 4px;
  margin-left: 28px;
}

.applicant-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
}

.applicant-value {
  line-height: 1;
  font-size: 32px;
  font-weight: 500;
}

.count-block {
  min-width: 138px;
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
    padding-top: 0;
    margin-left: 0;
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
