<template>
    <div v-if="props.loading" class="home-main-content q-pb-xl q-pt-none">
      <CardGridSkeleton />
    </div>

    <div v-else class="home-main-content q-pb-xl q-pt-none">
      <!-- Section 1: Test Format -->
      <div class="home-section q-mb-xl">
        <div class="home-section__intro">
          <ScrollReveal :disabled="revealDisabled">
            <HomeSectionHeader
              icon="bookmark"
              :title="formatSection?.title ? getLocalizedText(formatSection.title) : $t('home.testFormat.title')"
              :stacked-on-mobile="false"
            />
          </ScrollReveal>
          <q-separator color="grey-6" class="home-section-separator" />
        </div>

        <div v-if="activeFormats.length > 0" class="home-section__body format-cards row q-col-gutter-lg">
          <div
            v-for="(card, index) in activeFormats"
            :key="index"
            class="col-12 col-md-4 format-cards__item"
          >
            <ScrollReveal :delay="index * STAGGER_DELAY" :disabled="revealDisabled">
              <HomeCard
                :icon="('icon' in card ? card.icon : undefined) || getFormatDefaultIcon(index) || ''"
                :title="getLocalizedText(card.title)"
                :subtitle="getBoxContentText(card)"
              />
            </ScrollReveal>
          </div>
        </div>

        <div v-else class="home-section__body format-cards row q-col-gutter-lg">
          <div
            v-for="(fallbackCard, index) in fallbackFormatCards"
            :key="fallbackCard.key"
            class="col-12 col-md-4 format-cards__item"
          >
            <ScrollReveal :delay="index * STAGGER_DELAY" :disabled="revealDisabled">
              <HomeCard
                :icon="fallbackCard.icon"
                :title="$t(fallbackCard.titleKey)"
                :subtitle="$t(fallbackCard.subtitleKey)"
              />
            </ScrollReveal>
          </div>
        </div>
      </div>

      <!-- Section 2: Registration Steps -->
      <div class="home-section q-mb-xl">
        <div class="home-section__intro">
          <ScrollReveal :disabled="revealDisabled">
            <HomeSectionHeader
              icon="fact_check"
              :title="stepSection?.title ? getLocalizedText(stepSection.title) : $t('home.registrationSteps.title')"
              :stacked-on-mobile="false"
            />
          </ScrollReveal>
          <q-separator color="grey-6" class="home-section-separator" />
        </div>

        <div v-if="activeSteps.length > 0" class="home-section__body steps-grid row q-col-gutter-lg">
          <div
            v-for="(step, index) in activeSteps"
            :key="index"
            class="col-12 col-sm-6 col-md-3 steps-grid__item"
          >
            <ScrollReveal :delay="index * STAGGER_DELAY" :disabled="revealDisabled">
              <HomeStep
                :number="formatStepNumber(index + 1)"
                :is-last="index === activeSteps.length - 1"
                :title="getLocalizedText(step.title)"
                :description="getBoxContentText(step)"
              />
            </ScrollReveal>
          </div>
        </div>

        <div v-else class="home-section__body steps-grid row q-col-gutter-lg">
          <div
            v-for="(fallbackStep, index) in fallbackSteps"
            :key="fallbackStep.key"
            class="col-12 col-sm-6 col-md-3 steps-grid__item"
          >
            <ScrollReveal :delay="index * STAGGER_DELAY" :disabled="revealDisabled">
              <HomeStep
                :number="fallbackStep.number"
                :is-last="'isLast' in fallbackStep && fallbackStep.isLast"
                :title="$t(fallbackStep.titleKey)"
                :description="$t(fallbackStep.descriptionKey)"
              />
            </ScrollReveal>
          </div>
        </div>
      </div>

      <!-- Section 3: Exam Rules -->
      <div class="home-section q-mb-xl">
        <div class="home-section__intro">
          <ScrollReveal :disabled="revealDisabled">
            <HomeSectionHeader
              icon="gavel"
              :title="$t('home.examRules.title')"
              :stacked-on-mobile="false"
            />
          </ScrollReveal>
          <q-separator color="grey-6" class="home-section-separator" />
        </div>
        <div class="home-section__body">
          <HomeGuidelineSection
            :rule-paper-section="rulePaperSection || null"
            :rule-computer-section="ruleComputerSection || null"
            :preview-mode="previewMode"
          />
          <HomeVoucherError :preview-mode="previewMode" />
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import HomeCard from './home-card.vue';
import HomeStep from './home-step.vue';
import HomeGuidelineSection from './home-guideline-section.vue';
import HomeVoucherError from './home-voucher-error.vue';
import HomeSectionHeader from './home-section-header.vue';
import ScrollReveal from 'src/components/base/scroll-reveal.vue';
import { CardGridSkeleton } from 'src/components/base/skeleton';
import type {
  PageSectionType,
  CardBoxContent,
  StepBoxContent,
  LocalizedText,
  ContentBoxContent,
  ExamRuleBoxContent,
} from 'src/types/page-builder.types';

const STAGGER_DELAY = 50;

interface SectionData<T> {
  type: PageSectionType;
  title?: LocalizedText;
  active: boolean;
  boxes: T[];
}

interface Props {
  formatSection?: SectionData<CardBoxContent | ContentBoxContent> | null;
  stepSection?: SectionData<StepBoxContent | ContentBoxContent> | null;
  rulePaperSection?: SectionData<ExamRuleBoxContent> | null;
  ruleComputerSection?: SectionData<ExamRuleBoxContent> | null;
  loading?: boolean;
  previewMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  previewMode: false,
});

const revealDisabled = computed(() => props.previewMode);

const FORMAT_DEFAULT_ICONS = ['schedule', 'spellcheck', 'menu_book'] as const;
const FORMAT_FALLBACK_ICON = 'article';

const fallbackFormatCards = [
  {
    key: 'time',
    icon: FORMAT_DEFAULT_ICONS[0],
    titleKey: 'home.testFormat.cards.time.title',
    subtitleKey: 'home.testFormat.cards.time.subtitle',
  },
  {
    key: 'part1',
    icon: FORMAT_DEFAULT_ICONS[1],
    titleKey: 'home.testFormat.cards.part1.title',
    subtitleKey: 'home.testFormat.cards.part1.subtitle',
  },
  {
    key: 'part2',
    icon: FORMAT_DEFAULT_ICONS[2],
    titleKey: 'home.testFormat.cards.part2.title',
    subtitleKey: 'home.testFormat.cards.part2.subtitle',
  },
] as const;

const fallbackSteps = [
  {
    key: 's1',
    number: '01',
    titleKey: 'home.registrationSteps.steps.s1.title',
    descriptionKey: 'home.registrationSteps.steps.s1.description',
  },
  {
    key: 's2',
    number: '02',
    titleKey: 'home.registrationSteps.steps.s2.title',
    descriptionKey: 'home.registrationSteps.steps.s2.description',
  },
  {
    key: 's3',
    number: '03',
    titleKey: 'home.registrationSteps.steps.s3.title',
    descriptionKey: 'home.registrationSteps.steps.s3.description',
  },
  {
    key: 's4',
    number: '04',
    isLast: true,
    titleKey: 'home.registrationSteps.steps.s4.title',
    descriptionKey: 'home.registrationSteps.steps.s4.description',
  },
] as const;

const { locale } = useI18n();

const getLocalizedText = (textObj: LocalizedText | undefined) => {
  if (!textObj) return '';
  const currentLang = locale.value.startsWith('en') ? 'en' : 'th';
  return textObj[currentLang] || textObj.th || textObj.en || '';
};

const getBoxContentText = (box: CardBoxContent | StepBoxContent | ContentBoxContent) => {
  const content = 'content' in box ? box.content : undefined;
  const subtitle = 'subtitle' in box ? box.subtitle : undefined;
  const description = 'description' in box ? box.description : undefined;

  if (content && (content.th || content.en)) {
    return getLocalizedText(content);
  }
  if (subtitle && (subtitle.th || subtitle.en)) {
    return getLocalizedText(subtitle);
  }
  if (description && (description.th || description.en)) {
    return getLocalizedText(description);
  }
  return '';
};

const getFormatDefaultIcon = (index: number) => {
  return FORMAT_DEFAULT_ICONS[index] ?? FORMAT_FALLBACK_ICON;
};

const formatStepNumber = (num: number) => {
  return num < 10 ? `0${num}` : `${num}`;
};

const activeFormats = computed<Array<CardBoxContent | ContentBoxContent>>(() => {
  const section = props.formatSection;
  if (!section || section.active === false || !section.boxes) return [];
  return section.boxes
    .filter((box) => box.active !== false && (box.title?.th || box.title?.en))
    .sort((a, b) => a.sortOrder - b.sortOrder);
});

const activeSteps = computed<Array<StepBoxContent | ContentBoxContent>>(() => {
  const section = props.stepSection;
  if (!section || section.active === false || !section.boxes) return [];
  return section.boxes
    .filter((box) => box.active !== false && (box.title?.th || box.title?.en))
    .sort((a, b) => a.sortOrder - b.sortOrder);
});
</script>

<style scoped lang="scss">
.format-cards {
  @media (max-width: 1023px) {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.format-cards__item {
  @media (max-width: 1023px) {
    padding: 0 !important;
    width: 100%;
    max-width: none;
  }
}

.steps-grid {
  @media (max-width: 1023px) {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}

.steps-grid__item {
  @media (max-width: 1023px) {
    padding: 0 !important;
    width: 100%;
    max-width: none;
  }
}
</style>
