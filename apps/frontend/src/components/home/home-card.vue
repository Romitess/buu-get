<template>
  <q-card class="home-card full-height q-py-md q-pr-md q-pl-lg text-left q-mx-auto">
    <q-card-section class="home-card__body q-pa-none">
      <div v-if="icon" class="home-card__icon">
        <q-icon :name="icon" color="primary" size="md" />
      </div>
      <div class="home-card__text">
        <h3 class="home-card__title">{{ title }}</h3>
        <p class="home-card__subtitle">{{ subtitle }}</p>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  icon?: string;
}>();
</script>

<style scoped lang="scss">
.home-card {
  width: 80%;
  border-radius: 12px;
  box-shadow: 0 8px 12px -4px rgba(0, 0, 0, 0.3) !important;
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 16px -4px rgba(0, 0, 0, 0.4) !important;
  }
}

.home-card__body {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 16px;
  align-items: start;
}

.home-card__icon {
  grid-column: 1;
  grid-row: 1;
  margin-bottom: 8px;
}

.home-card__text {
  display: contents;
}

.home-card__title {
  grid-column: 2;
  grid-row: 1;
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary, #0d47a1);
  line-height: 1.35;
}

.home-card__subtitle {
  grid-column: 1 / -1;
  grid-row: 2;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #616161;
}

.home-card__body:not(:has(.home-card__icon)) {
  grid-template-columns: 1fr;
}

.home-card__body:not(:has(.home-card__icon)) .home-card__title {
  grid-column: 1;
}

@media (max-width: 1023px) {
  .home-card {
    width: 100%;
    padding: 0 !important;
    border: 1px solid rgba(13, 71, 161, 0.1);
    border-radius: 14px;
    box-shadow: none !important;
    background: #fff;

    &:hover {
      transform: none;
      box-shadow: none !important;
    }
  }

  .home-card__body {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 14px;
    padding: 16px !important;
  }

  .home-card__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .home-card__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    margin: 0;
    border-radius: 14px;
    background: rgba(13, 71, 161, 0.08);
  }

  .home-card__title {
    grid-column: auto;
    grid-row: auto;
    font-size: 1rem;
    margin-bottom: 4px;
  }

  .home-card__subtitle {
    grid-column: auto;
    grid-row: auto;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #546e7a;
  }
}
</style>
