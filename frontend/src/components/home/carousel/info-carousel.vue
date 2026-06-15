<template>
  <div class="row items-center no-wrap q-gutter-x-md carousel-wrapper q-mx-auto">
    <!-- Left Navigation Button -->
    <q-btn
      flat
      round
      dense
      icon="chevron_left"
      size="xl"
      color="grey-6"
      @click="carouselRef?.previous()"
    />

    <!-- Main Carousel Card -->
    <q-card flat bordered class="info-carousel overflow-hidden border-radius-lg shadow-1 col">
      <q-carousel
        ref="carouselRef"
        v-model="slide"
        animated
        transition-prev="slide-right"
        transition-next="slide-left"
        height="auto"
        class="bg-transparent"
        autoplay
        infinite
        swipeable
      >
        <!-- Dynamic Slides 1-4 -->
        <q-carousel-slide
          v-for="page in carouselPages"
          :key="page.id"
          :name="page.id"
          class="q-pa-none"
        >
          <div class="row items-stretch">
            <!-- Left Section -->
            <div class="col-12 col-md-6 bg-white column justify-center min-height-350">
              <CarouselContentLeft v-bind="page.branding" />
            </div>

            <!-- Right Section -->
            <q-card-section
              class="col-12 col-md-6 bg-grey-1 q-pt-lg q-px-lg q-pb-md column justify-center items-center"
            >
              <div class="full-width max-width-80">
                <div class="row q-col-gutter-y-lg">
                  <div class="col-6" v-for="(stat, index) in page.stats" :key="index">
                    <CarouselStatItem v-bind="stat" />
                  </div>
                </div>
              </div>
            </q-card-section>
          </div>
        </q-carousel-slide>
      </q-carousel>
    </q-card>

    <!-- Right Navigation Button -->
    <q-btn
      flat
      round
      dense
      icon="chevron_right"
      size="xl"
      color="grey-6"
      @click="carouselRef?.next()"
    />
  </div>

  <!-- External Navigation Dots -->
  <div class="row justify-center q-mt-md q-gutter-x-sm">
    <div
      v-for="n in carouselPages.length"
      :key="n"
      class="nav-dot cursor-pointer"
      :class="{ active: slide === n }"
      @click="slide = n"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QCarousel } from 'quasar';
import CarouselContentLeft from './carousel-content-left.vue';
import CarouselStatItem from './carousel-stat-item.vue';

const i18n = useI18n();

const carouselRef = ref<QCarousel | null>(null);
const slide = ref(1);

// Interfaces for type safety
interface CarouselStat {
  label: string;
  value: string;
  description: string;
}

interface CarouselBranding {
  overline: string;
  title: string;
  subtitle: string;
  description1: string;
  description2: string;
  info1: string;
  info1Icon: string;
  info2: string;
  info2Icon: string;
}

interface CarouselPageData extends CarouselBranding {
  stats: CarouselStat[];
}

interface CarouselPage {
  id: number;
  branding: CarouselBranding;
  stats: CarouselStat[];
}

// Map i18n data to our local structure
const carouselPages = computed<CarouselPage[]>(() => {
  const allData: Record<string, CarouselPageData> = i18n.tm('carousel');
  return Object.entries(allData)
    .filter(([key]: [string, CarouselPageData]) => key.startsWith('page'))
    .map(([, pageData]: [string, CarouselPageData], index: number) => {
      return {
        id: index + 1,
        branding: {
          overline: pageData.overline,
          title: pageData.title,
          subtitle: pageData.subtitle,
          description1: pageData.description1,
          description2: pageData.description2,
          info1: pageData.info1,
          info1Icon: pageData.info1Icon,
          info2: pageData.info2,
          info2Icon: pageData.info2Icon,
        },
        stats: pageData.stats,
      };
    });
});
</script>

<style scoped lang="scss">
.carousel-wrapper {
  max-width: 1500px;
  width: 100%;
}

.min-height-300 {
  min-height: 300px;
}

.max-width-80 {
  max-width: 80%;
}

.info-carousel {
  border: 2px solid rgba($primary, 0.8) !important;
  border-radius: 12px;
  box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.3) !important;
}

/* Custom Navigation Dots (External) */
.nav-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #e0e0e0;
  opacity: 0.5;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
  }

  &.active {
    background-color: $primary;
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
