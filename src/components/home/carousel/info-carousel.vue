<template>
  <q-card flat class="info-carousel overflow-hidden border-radius-lg shadow-2">
    <div class="row">
      <!-- Left Section -->
      <div class="col-12 col-md-7">
        <CarouselContentLeft />
      </div>

      <!-- Right Section -->
      <q-card-section class="col-12 col-md-5 bg-grey-1 q-pa-xl column justify-center">
        <div class="row q-col-gutter-y-xl">
          <div class="col-6" v-for="(stat, index) in stats" :key="index">
            <CarouselStatItem v-bind="stat" />
          </div>
        </div>
      </q-card-section>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CarouselContentLeft from './carousel-content-left.vue';
import CarouselStatItem from './carousel-stat-item.vue';

const { t } = useI18n();

const stats = computed(() => [
  {
    label: t('carousel.stats.duration.label'),
    value: t('carousel.stats.duration.value'),
    description: t('carousel.stats.duration.description'),
  },
  {
    label: t('carousel.stats.questions.label'),
    value: t('carousel.stats.questions.value'),
    description: t('carousel.stats.questions.description'),
  },
  {
    label: t('carousel.stats.score.label'),
    value: t('carousel.stats.score.value'),
    description: t('carousel.stats.score.description'),
  },
  {
    label: t('carousel.stats.frequency.label'),
    value: t('carousel.stats.frequency.value'),
    description: t('carousel.stats.frequency.description'),
  },
]);
</script>

<style scoped>
.carousel-container {
  border-radius: 16px;
  min-height: 400px;
}
</style>
