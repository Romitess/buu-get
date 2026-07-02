<template>
  <div class="home-main-content q-pb-xl q-pt-none">
    <div v-if="props.loading" class="column flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else>
      <!-- Section 1: Test Format -->
      <div class="q-mb-xl">
        <div class="row items-center q-mb-md">
          <div class="section-icon q-mr-sm">
            <q-icon name="bookmark" color="white" size="18px" />
          </div>
          <div class="text-h6 text-weight-bolder text-dark">
            {{ formatSection?.title ? getLocalizedText(formatSection.title) : $t('home.testFormat.title') }}
          </div>
        </div>
        <q-separator color="grey-6" class="q-mb-md" />

        <!-- Dynamic Cards -->
        <div v-if="activeFormats.length > 0" class="row q-col-gutter-lg">
          <div
            v-for="(card, index) in activeFormats"
            :key="index"
            class="col-12 col-md-4"
          >
            <HomeCard
              :icon="('icon' in card ? card.icon : undefined) || getFormatDefaultIcon(index) || ''"
              :title="getLocalizedText(card.title)"
              :subtitle="getBoxContentText(card)"
            />
          </div>
        </div>

        <!-- Mock Fallback Cards -->
        <div v-else class="row q-col-gutter-lg">
          <div class="col-12 col-md-4">
            <HomeCard
              icon="schedule"
              :title="$t('home.testFormat.cards.time.title')"
              :subtitle="$t('home.testFormat.cards.time.subtitle')"
            />
          </div>
          <div class="col-12 col-md-4">
            <HomeCard
              :title="$t('home.testFormat.cards.part1.title')"
              :subtitle="$t('home.testFormat.cards.part1.subtitle')"
            />
          </div>
          <div class="col-12 col-md-4">
            <HomeCard
              :title="$t('home.testFormat.cards.part2.title')"
              :subtitle="$t('home.testFormat.cards.part2.subtitle')"
            />
          </div>
        </div>
      </div>

      <!-- Section 2: Registration Steps -->
      <div class="q-mb-xl">
        <div class="row items-center q-mb-md">
          <div class="section-icon q-mr-sm">
            <q-icon name="fact_check" color="white" size="18px" />
          </div>
          <div class="text-h6 text-weight-bolder text-dark">
            {{ stepSection?.title ? getLocalizedText(stepSection.title) : $t('home.registrationSteps.title') }}
          </div>
        </div>
        <q-separator color="grey-6" class="q-mb-md" />

        <!-- Dynamic Steps -->
        <div v-if="activeSteps.length > 0" class="row q-col-gutter-lg">
          <div
            v-for="(step, index) in activeSteps"
            :key="index"
            class="col-12 col-sm-6 col-md-3"
          >
            <HomeStep
              :number="formatStepNumber(index + 1)"
              :is-last="index === activeSteps.length - 1"
              :title="getLocalizedText(step.title)"
              :description="getBoxContentText(step)"
            />
          </div>
        </div>

        <!-- Mock Fallback Steps -->
        <div v-else class="row q-col-gutter-lg">
          <div class="col-12 col-sm-6 col-md-3">
            <HomeStep
              number="01"
              :title="$t('home.registrationSteps.steps.s1.title')"
              :description="$t('home.registrationSteps.steps.s1.description')"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <HomeStep
              number="02"
              :title="$t('home.registrationSteps.steps.s2.title')"
              :description="$t('home.registrationSteps.steps.s2.description')"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <HomeStep
              number="03"
              :title="$t('home.registrationSteps.steps.s3.title')"
              :description="$t('home.registrationSteps.steps.s3.description')"
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <HomeStep
              number="04"
              :is-last="true"
              :title="$t('home.registrationSteps.steps.s4.title')"
              :description="$t('home.registrationSteps.steps.s4.description')"
            />
          </div>
        </div>
      </div>

      <!-- Section 3: Exam Rules -->
      <div class="q-mb-xl">
        <div class="row items-center q-mb-md">
          <div class="section-icon q-mr-sm">
            <q-icon name="gavel" color="white" size="18px" />
          </div>
          <div class="text-h6 text-weight-bolder text-dark">
            {{ $t('home.examRules.title') }}
          </div>
        </div>
        <q-separator color="grey-6" class="q-mb-md" />
        <HomeGuidelineSection
          :rule-paper-section="rulePaperSection || null"
          :rule-computer-section="ruleComputerSection || null"
        />
        <HomeVoucherError />
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
import type {
  PageSectionType,
  CardBoxContent,
  StepBoxContent,
  LocalizedText,
  ContentBoxContent,
  ExamRuleBoxContent,
} from 'src/types/page-builder.types';

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
  return index === 0 ? 'schedule' : undefined;
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

<style scoped>
.home-main-content {
  max-width: 1300px;
  margin: 15px auto 0;
  padding: 0 10px;
}
.section-icon {
  background: var(--q-primary);
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
