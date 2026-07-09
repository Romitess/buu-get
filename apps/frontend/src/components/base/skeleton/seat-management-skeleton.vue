<template>
  <div
    class="seat-management-skeleton skeleton-root seat-management-row"
    :aria-busy="true"
    :aria-label="ariaLabel"
  >
    <div class="seat-management-list-column">
      <div class="seat-management-skeleton__panel">
        <div class="row items-center justify-between q-mb-md">
          <q-skeleton type="text" width="140px" height="20px" animation="wave" />
          <q-skeleton type="rect" width="54px" height="28px" animation="wave" />
        </div>
        <q-skeleton type="rect" height="40px" animation="wave" class="q-mb-md" />
        <div class="seat-management-skeleton__list">
          <div v-for="n in listItems" :key="n" class="seat-management-skeleton__list-item">
            <q-skeleton type="circle" size="40px" animation="wave" />
            <div class="col">
              <q-skeleton type="text" width="70%" animation="wave" class="q-mb-xs" />
              <q-skeleton type="text" width="45%" animation="wave" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="seat-management-map-column">
      <div class="seat-management-skeleton__panel seat-management-skeleton__map-panel">
        <q-skeleton type="text" width="120px" height="20px" animation="wave" class="q-mb-md" />
        <q-skeleton
          type="rect"
          height="100%"
          animation="wave"
          class="seat-management-skeleton__map"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
  listItems?: number;
}

withDefaults(defineProps<Props>(), {
  listItems: 5,
});

const { t } = useI18n();
const ariaLabel = computed(() => t('components.skeleton.loading'));
</script>

<style scoped lang="scss">
.seat-management-row {
  display: grid;
  grid-template-columns: minmax(360px, 0.38fr) minmax(0, 0.62fr);
  gap: 16px;
  height: clamp(600px, 72vh, 760px);
  align-items: stretch;
}

.seat-management-list-column,
.seat-management-map-column {
  height: 100%;
  min-width: 0;
}

.seat-management-skeleton__panel {
  height: 100%;
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.seat-management-skeleton__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.seat-management-skeleton__list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.seat-management-skeleton__map-panel {
  min-height: 0;
}

.seat-management-skeleton__map {
  flex: 1;
  min-height: 400px;
  border-radius: var(--radius-sm);
}
</style>
