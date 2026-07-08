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
    <q-card flat bordered class="info-carousel image-banner-aspect overflow-hidden">
      <div v-if="isLoading" class="full-height">
        <BannerSkeleton />
      </div>

      <!-- Empty State (no banners configured) -->
      <div
        v-else-if="banners.length === 0"
        class="full-height column flex-center bg-grey-2 text-grey-6"
      >
        <q-icon name="image" size="48px" />
        <div class="q-mt-sm text-body2">{{ $t('home.bannerEmpty') }}</div>
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

  <!-- External Navigation Dots — reserve space even when hidden to avoid layout shift -->
  <div class="nav-dots-row row justify-center q-mt-md q-gutter-x-sm">
    <template v-if="totalSlides > 1">
      <div
        v-for="n in totalSlides"
        :key="n"
        class="nav-dot cursor-pointer"
        :class="{ active: isSlideActive(n) }"
        @click="setSlide(n)"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { QCarousel } from 'quasar';
import { getHomepage } from 'src/services/page-builder.service';
import { getImageUrl } from 'src/services/image.service';
import {
  PageSectionType,
  type BannerBoxContent,
  type PageSectionContent,
} from 'src/types/page-builder.types';
import { BannerSkeleton } from 'src/components/base/skeleton';

const carouselRef = ref<QCarousel | null>(null);
const slide = ref(0);
const internalLoading = ref(true);
const banners = ref<BannerBoxContent[]>([]);

interface Props {
  previewMode?: boolean;
  previewBanners?: BannerBoxContent[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false,
  previewBanners: () => [],
  loading: false,
});

const isLoading = computed(() => {
  if (props.previewMode) return props.loading;
  return internalLoading.value;
});

const totalSlides = computed((): number => banners.value.length);

const isSlideActive = (n: number): boolean => slide.value === n - 1;

const setSlide = (n: number): void => {
  slide.value = n - 1;
};

if (props.previewMode) {
  watch(
    () => props.previewBanners,
    (newBanners) => {
      banners.value = newBanners
        .filter((box) => box.active !== false && box.imagePath)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      slide.value = 0;
    },
    { immediate: true, deep: true },
  );
}

onMounted(async () => {
  if (props.previewMode) {
    internalLoading.value = false;
    return;
  }

  internalLoading.value = true;
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
    internalLoading.value = false;
    slide.value = 0;
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

.info-carousel {
  border: 2px solid rgba($primary, 0.8) !important;
  border-radius: 12px;
  box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.3) !important;
}

/* Banner images keep a fixed 5:1 ratio and scale down responsively */
.image-banner-aspect {
  aspect-ratio: 5 / 1;
}

/* Reserve the dot row height so the layout doesn't shift when dots are hidden */
.nav-dots-row {
  min-height: 10px;
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
