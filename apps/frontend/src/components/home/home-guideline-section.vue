<template>
  <div class="guideline-section">
    <ScrollReveal :disabled="revealDisabled">
      <div
        v-if="showModeToggle"
        class="guideline-mode-toggle q-mb-md"
        :aria-label="t('home.examRules.modeToggleAria')"
      >
        <q-btn-toggle
          v-model="selectedMode"
          dense
          unelevated
          no-caps
          toggle-color="primary"
          toggle-text-color="white"
          color="grey-3"
          text-color="dark"
          :options="modeToggleOptions"
          class="guideline-mode-toggle__control"
        />
      </div>
    </ScrollReveal>

    <ScrollReveal :disabled="revealDisabled">
      <div
        class="guideline-carousel-wrap"
        @pointerenter="isHovering = true"
        @pointerleave="isHovering = false"
      >
        <q-btn
          v-if="totalSlides > 1"
          round
          unelevated
          icon="chevron_left"
          color="white"
          text-color="primary"
          class="guideline-carousel-nav"
          aria-label="Previous"
          @click="carouselRef?.previous()"
        />

        <div class="guideline-carousel-stage">
          <q-carousel
            ref="carouselRef"
            v-model="slide"
            animated
            swipeable
            :infinite="totalSlides > 1"
            :autoplay="carouselAutoplay"
            transition-prev="slide-right"
            transition-next="slide-left"
            height="auto"
            class="guideline-carousel bg-transparent"
            :aria-label="activeListAriaLabel"
          >
            <q-carousel-slide
              v-for="(page, pageIndex) in slides"
              :key="`${activeListKey}-page-${pageIndex}`"
              :name="pageIndex"
              class="guideline-carousel-slide q-pa-none"
            >
              <div class="row q-col-gutter-md" role="list">
                <div
                  v-for="(rule, cardIndex) in page"
                  :key="`${activeListKey}-${pageIndex}-${cardIndex}`"
                  class="col-6 col-md-3"
                >
                  <HomeGuidelineCard
                    :index="pageIndex * CARDS_PER_SLIDE + cardIndex"
                    :icon="rule.icon"
                    :text="rule.text"
                  />
                </div>
              </div>
            </q-carousel-slide>
          </q-carousel>
        </div>

        <q-btn
          v-if="totalSlides > 1"
          round
          unelevated
          icon="chevron_right"
          color="white"
          text-color="primary"
          class="guideline-carousel-nav"
          aria-label="Next"
          @click="carouselRef?.next()"
        />
      </div>

      <div v-if="totalSlides > 1" class="guideline-dots row justify-center q-mt-md q-gutter-x-sm">
        <button
          v-for="n in totalSlides"
          :key="n"
          type="button"
          class="guideline-dot"
          :class="{ 'guideline-dot--active': slide === n - 1 }"
          :aria-label="`Slide ${n}`"
          :aria-current="slide === n - 1 ? 'true' : undefined"
          @click="slide = n - 1"
        />
      </div>
    </ScrollReveal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { QCarousel } from 'quasar';
import HomeGuidelineCard from './home-guideline-card.vue';
import ScrollReveal from 'src/components/base/scroll-reveal.vue';
import type {
  PageSectionType,
  ExamRuleBoxContent,
  LocalizedText,
} from 'src/types/page-builder.types';

const CARDS_PER_SLIDE = 4;
const AUTOPLAY_MS = 12_000;

type ExamMode = 'paper' | 'computer';

interface GuidelineRule {
  icon: string;
  text: string;
}

interface SectionData<T> {
  type: PageSectionType;
  title?: LocalizedText;
  active: boolean;
  boxes: T[];
}

interface Props {
  rulePaperSection?: SectionData<ExamRuleBoxContent> | null;
  ruleComputerSection?: SectionData<ExamRuleBoxContent> | null;
  previewMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  previewMode: false,
});

const revealDisabled = computed(() => props.previewMode);

const { locale, t } = useI18n();

const selectedMode = ref<ExamMode>('paper');
const slide = ref(0);
const isHovering = ref(false);
const prefersReducedMotion = ref(false);
const carouselRef = ref<QCarousel | null>(null);

let motionMedia: MediaQueryList | null = null;

const onMotionChange = (event: MediaQueryListEvent) => {
  prefersReducedMotion.value = event.matches;
};

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion.value = motionMedia.matches;
  motionMedia.addEventListener('change', onMotionChange);
});

onUnmounted(() => {
  motionMedia?.removeEventListener('change', onMotionChange);
  motionMedia = null;
});

const getLocalizedText = (textObj: LocalizedText | undefined) => {
  if (!textObj) return '';
  const currentLang = locale.value.startsWith('en') ? 'en' : 'th';
  return textObj[currentLang] || textObj.th || textObj.en || '';
};

const fallbackIcons = [
  'history',
  'event_seat',
  'checkroom',
  'edit',
  'contacts',
  'logout',
  'local_police',
  'block',
];

const mapCmsBoxes = (
  section: SectionData<ExamRuleBoxContent> | null | undefined,
): GuidelineRule[] => {
  if (!section || section.active === false || !section.boxes) return [];
  return section.boxes
    .filter((box) => box.active !== false && (box.text?.th || box.text?.en))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((box, index) => ({
      icon: box.icon || fallbackIcons[index % fallbackIcons.length] || 'circle',
      text: getLocalizedText(box.text),
    }));
};

const fallbackPaperRules = computed((): GuidelineRule[] =>
  fallbackIcons.map((icon, i) => ({
    icon,
    text: t(`home.examRules.paperBased.items.rule${i + 1}`),
  })),
);

const fallbackComputerRules = computed((): GuidelineRule[] =>
  fallbackIcons.map((icon, i) => ({
    icon,
    text: t(`home.examRules.computerBased.items.rule${i + 1}`),
  })),
);

const paperRulesList = computed((): GuidelineRule[] => {
  const cms = mapCmsBoxes(props.rulePaperSection);
  return cms.length > 0 ? cms : fallbackPaperRules.value;
});

const computerRulesList = computed((): GuidelineRule[] => {
  const cms = mapCmsBoxes(props.ruleComputerSection);
  return cms.length > 0 ? cms : fallbackComputerRules.value;
});

const hasPaperRules = computed(() => paperRulesList.value.length > 0);
const hasComputerRules = computed(() => computerRulesList.value.length > 0);

const showModeToggle = computed(() => hasPaperRules.value && hasComputerRules.value);

const modeToggleOptions = computed(() => {
  const options: { label: string; value: ExamMode }[] = [];
  if (hasPaperRules.value) {
    options.push({
      label: props.rulePaperSection?.title
        ? getLocalizedText(props.rulePaperSection.title)
        : t('home.examRules.paperBased.label'),
      value: 'paper',
    });
  }
  if (hasComputerRules.value) {
    options.push({
      label: props.ruleComputerSection?.title
        ? getLocalizedText(props.ruleComputerSection.title)
        : t('home.examRules.computerBased.label'),
      value: 'computer',
    });
  }
  return options;
});

const activeRulesList = computed(() => {
  if (showModeToggle.value) {
    return selectedMode.value === 'computer' ? computerRulesList.value : paperRulesList.value;
  }
  if (hasPaperRules.value) return paperRulesList.value;
  return computerRulesList.value;
});

const activeListKey = computed(() =>
  showModeToggle.value ? selectedMode.value : hasPaperRules.value ? 'paper' : 'computer',
);

const activeListAriaLabel = computed(() => {
  if (showModeToggle.value) {
    return selectedMode.value === 'computer'
      ? t('home.examRules.computerBased.label')
      : t('home.examRules.paperBased.label');
  }
  return t('home.examRules.title');
});

const slides = computed(() => {
  const rules = activeRulesList.value;
  const pages: GuidelineRule[][] = [];
  for (let i = 0; i < rules.length; i += CARDS_PER_SLIDE) {
    pages.push(rules.slice(i, i + CARDS_PER_SLIDE));
  }
  return pages;
});

const totalSlides = computed(() => slides.value.length);

const carouselAutoplay = computed(() => {
  if (totalSlides.value <= 1) return false;
  if (prefersReducedMotion.value) return false;
  if (isHovering.value) return false;
  return AUTOPLAY_MS;
});

watch(activeListKey, () => {
  slide.value = 0;
});

watch(
  [hasPaperRules, hasComputerRules],
  () => {
    if (hasPaperRules.value && !hasComputerRules.value) {
      selectedMode.value = 'paper';
      return;
    }
    if (!hasPaperRules.value && hasComputerRules.value) {
      selectedMode.value = 'computer';
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.guideline-section {
  position: relative;
  width: 100%;
  max-width: none;
  margin: 0;
}
.guideline-mode-toggle {
  display: flex;
  justify-content: flex-start;
}
.guideline-mode-toggle__control {
  border-radius: 8px;
  overflow: hidden;
}
.guideline-mode-toggle__control :deep(.q-btn) {
  min-height: 36px;
  padding: 0 16px;
  font-weight: 500;
  transition:
    background-color 160ms cubic-bezier(0.23, 1, 0.32, 1),
    color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.guideline-mode-toggle__control :deep(.q-btn:active) {
  transform: scale(0.97);
}
.guideline-carousel-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}
.guideline-carousel-stage {
  flex: 1 1 auto;
  min-width: 0;
}
.guideline-carousel {
  width: 100%;
  overflow: hidden;
}
.guideline-carousel :deep(.q-carousel__slides-container),
.guideline-carousel :deep(.q-carousel__slide),
.guideline-carousel :deep(.q-panel),
.guideline-carousel :deep(.q-panel-parent),
.guideline-carousel-slide {
  height: auto !important;
  min-height: 0;
  overflow: hidden !important;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.guideline-carousel :deep(.q-carousel__slides-container)::-webkit-scrollbar,
.guideline-carousel :deep(.q-carousel__slide)::-webkit-scrollbar,
.guideline-carousel :deep(.q-panel)::-webkit-scrollbar,
.guideline-carousel :deep(.q-panel-parent)::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
.guideline-carousel-nav {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  min-height: 40px;
  border: 1px solid rgba(13, 71, 161, 0.12);
  box-shadow: var(--shadow-sm);
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1),
    border-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.guideline-carousel-nav:active {
  transform: scale(0.97);
}
@media (hover: hover) and (pointer: fine) {
  .guideline-carousel-nav:hover {
    box-shadow: var(--shadow-md);
    border-color: rgba(13, 71, 161, 0.28);
  }
}
.guideline-dot {
  width: 10px;
  height: 10px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: #e0e0e0;
  opacity: 0.5;
  cursor: pointer;
  transition:
    opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.guideline-dot:hover {
  opacity: 0.8;
}
.guideline-dot--active {
  background-color: var(--q-primary);
  opacity: 1;
  transform: scale(1.2);
}
@media (max-width: 599px) {
  .guideline-carousel-wrap {
    gap: 4px;
  }
  .guideline-carousel-nav {
    width: 36px;
    height: 36px;
    min-height: 36px;
  }
  .guideline-mode-toggle__control {
    width: 100%;
  }
  .guideline-mode-toggle__control :deep(.q-btn) {
    flex: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .guideline-mode-toggle__control :deep(.q-btn:active) {
    transform: none;
  }
  .guideline-carousel-nav,
  .guideline-carousel-nav:active,
  .guideline-carousel-nav:hover {
    transition: none;
    transform: none;
  }
  .guideline-dot,
  .guideline-dot--active {
    transition: none;
  }
}
</style>
