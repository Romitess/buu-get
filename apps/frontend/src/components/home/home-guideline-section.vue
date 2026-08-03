<template>
  <div class="guideline-section">
    <ScrollReveal :disabled="revealDisabled">
      <div class="row q-col-gutter-md">
        <div v-if="hasPaperRules" class="col-12" :class="{ 'col-md-6': hasComputerRules }">
          <div class="text-subtitle1 text-weight-bold text-dark q-mb-sm">
            {{ paperColumnTitle }}
          </div>
          <ul class="guideline-list" role="list" :aria-label="paperColumnTitle">
            <li
              v-for="(rule, index) in paperRulesList"
              :key="`paper-${index}`"
              class="guideline-list__item"
            >
              <HomeGuidelineCard :index="index" :icon="rule.icon" :text="rule.text" />
            </li>
          </ul>
        </div>

        <div v-if="hasComputerRules" class="col-12" :class="{ 'col-md-6': hasPaperRules }">
          <div class="text-subtitle1 text-weight-bold text-dark q-mb-sm">
            {{ computerColumnTitle }}
          </div>
          <ul class="guideline-list" role="list" :aria-label="computerColumnTitle">
            <li
              v-for="(rule, index) in computerRulesList"
              :key="`computer-${index}`"
              class="guideline-list__item"
            >
              <HomeGuidelineCard :index="index" :icon="rule.icon" :text="rule.text" />
            </li>
          </ul>
        </div>
      </div>
    </ScrollReveal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import HomeGuidelineCard from './home-guideline-card.vue';
import ScrollReveal from 'src/components/base/scroll-reveal.vue';
import type {
  PageSectionType,
  ExamRuleBoxContent,
  LocalizedText,
} from 'src/types/page-builder.types';

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

const paperColumnTitle = computed(() =>
  props.rulePaperSection?.title
    ? getLocalizedText(props.rulePaperSection.title)
    : t('home.examRules.paperBased.label'),
);

const computerColumnTitle = computed(() =>
  props.ruleComputerSection?.title
    ? getLocalizedText(props.ruleComputerSection.title)
    : t('home.examRules.computerBased.label'),
);
</script>

<style scoped>
.guideline-section {
  position: relative;
  width: 100%;
  max-width: none;
  margin: 0;
}
.guideline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(13, 71, 161, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.guideline-list__item {
  margin: 0;
  padding: 0;
}
.guideline-list__item + .guideline-list__item {
  border-top: 1px solid rgba(13, 71, 161, 0.08);
}
</style>
