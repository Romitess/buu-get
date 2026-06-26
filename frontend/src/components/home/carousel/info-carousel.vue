<template>
  <div class="carousel-wrapper q-mx-auto">
    <!-- Left Navigation Button -->
    <q-btn
      flat
      round
      dense
      icon="chevron_left"
      size="xl"
      color="grey-6"
      class="carousel-nav carousel-nav--left"
      :class="{ invisible: totalSlides <= 1 }"
      @click="carouselRef?.previous()"
    />

    <!-- Main Carousel Card -->
    <q-card
      flat
      bordered
      class="info-carousel overflow-hidden border-radius-lg shadow-1"
      :class="{ 'image-banner-aspect': banners.length > 0 }"
    >
      <div v-if="isLoading" class="full-height row flex-center bg-white">
        <q-spinner color="primary" size="40px" />
      </div>

      <q-carousel
        v-else
        ref="carouselRef"
        v-model="slide"
        animated
        transition-prev="slide-right"
        transition-next="slide-left"
        height="100%"
        class="bg-transparent full-height"
        autoplay
        infinite
        swipeable
      >
        <!-- Dynamic Image Banners -->
        <template v-if="banners.length > 0">
          <q-carousel-slide
            v-for="(banner, index) in banners"
            :key="index"
            :name="index"
            class="q-pa-none"
          >
            <q-img
              :src="getImageUrl(banner.imagePath)"
              fit="cover"
              class="full-width full-height"
              loading="eager"
            >
              <template #error>
                <div class="absolute-full flex flex-center bg-grey-2 text-grey-6">
                  <q-icon name="broken_image" size="48px" />
                </div>
              </template>
            </q-img>
          </q-carousel-slide>
        </template>

        <!-- Fallback Mock Slides -->
        <template v-else>
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
        </template>
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
      class="carousel-nav carousel-nav--right"
      :class="{ invisible: totalSlides <= 1 }"
      @click="carouselRef?.next()"
    />
  </div>

  <!-- External Navigation Dots -->
  <div v-if="totalSlides > 0" class="row justify-center q-mt-md q-gutter-x-sm">
    <div
      v-for="n in totalSlides"
      :key="n"
      class="nav-dot cursor-pointer"
      :class="{ active: isSlideActive(n) }"
      @click="setSlide(n)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QCarousel } from 'quasar';
import { getHomepage } from 'src/services/page-builder.service';
import { getImageUrl } from 'src/services/image.service';
import {
  PageSectionType,
  type BannerBoxContent,
  type PageSectionContent,
} from 'src/types/page-builder.types';
import CarouselContentLeft from './carousel-content-left.vue';
import CarouselStatItem from './carousel-stat-item.vue';

const i18n = useI18n();

const carouselRef = ref<QCarousel | null>(null);
const slide = ref(1);
const isLoading = ref(true);
const banners = ref<BannerBoxContent[]>([]);

interface Props {
  previewMode?: boolean;
  previewBanners?: BannerBoxContent[];
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false,
  previewBanners: () => [],
});

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

const totalSlides = computed((): number => {
  return banners.value.length > 0 ? banners.value.length : carouselPages.value.length;
});

const isSlideActive = (n: number): boolean => {
  if (banners.value.length > 0) {
    return slide.value === n - 1;
  }
  return slide.value === n;
};

const setSlide = (n: number): void => {
  if (banners.value.length > 0) {
    slide.value = n - 1;
  } else {
    slide.value = n;
  }
};

if (props.previewMode) {
  watch(
    () => props.previewBanners,
    (newBanners) => {
      banners.value = newBanners
        .filter((box) => box.active !== false && box.imagePath)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      slide.value = banners.value.length > 0 ? 0 : 1;
    },
    { immediate: true, deep: true },
  );
}

onMounted(async () => {
  if (props.previewMode) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    const response = await getHomepage();
    if (response?.PCF_CONTENT?.sections) {
      const bannerSection = response.PCF_CONTENT.sections.find(
        (sec: PageSectionContent) => sec.type === PageSectionType.BANNER,
      );
      if (bannerSection && bannerSection.active !== false) {
        banners.value = (bannerSection.boxes as BannerBoxContent[])
          .filter((box) => box.active !== false && box.imagePath)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      }
    }
  } catch (error) {
    console.error('Failed to load homepage banners:', error);
  } finally {
    isLoading.value = false;
    slide.value = banners.value.length > 0 ? 0 : 1;
  }
});
</script>

<style scoped lang="scss">
/* Match the width/padding of the exam-rounds table below so both blocks align */
.carousel-wrapper {
  position: relative;
  max-width: 1300px;
  width: 100%;
  padding: 0 10px;
}

/* Navigation buttons overlay the card edges so they don't widen the block */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.carousel-nav--left {
  left: -48px;
}

.carousel-nav--right {
  right: -48px;
}

@media (max-width: 1023px) {
  .carousel-nav--left {
    left: -4px;
  }

  .carousel-nav--right {
    right: -4px;
  }
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
  height: 350px;

  @media (max-width: 1023px) {
    height: 300px;
  }

  @media (max-width: 599px) {
    height: 220px;
  }
}

.image-banner-aspect {
  aspect-ratio: 5 / 1 !important;
  height: auto !important;
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
