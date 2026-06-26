<template>
  <div class="guideline-section">
    <!-- Centered vertical divider (desktop only) -->
    <div class="guideline-divider gt-sm" :style="dividerStyle" />
    <div class="row q-col-gutter-x-xl">
      <!-- Side: Paper-based -->
      <div class="col-12 col-md-6">
        <div class="side-label text-weight-bold text-primary">
          {{ rulePaperSection?.title ? getLocalizedText(rulePaperSection.title) : t('home.examRules.paperBased.label') }}
        </div>
        <div class="column guideline-list">
          <HomeGuidelineCard
            v-for="(rule, index) in paperRulesList"
            :key="`paper-${index}`"
            :icon="rule.icon"
            :text="rule.text"
          />
        </div>
      </div>

      <!-- Side: Computer-based -->
      <div class="col-12 col-md-6 side-computer">
        <div class="side-label text-weight-bold text-primary">
          {{ ruleComputerSection?.title ? getLocalizedText(ruleComputerSection.title) : t('home.examRules.computerBased.label') }}
        </div>
        <div class="column guideline-list">
          <HomeGuidelineCard
            v-for="(rule, index) in computerRulesList"
            :key="`computer-${index}`"
            :icon="rule.icon"
            :text="rule.text"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import HomeGuidelineCard from './home-guideline-card.vue';
import type {
  PageSectionType,
  ExamRuleBoxContent,
  LocalizedText,
} from 'src/types/page-builder.types';

interface SectionData<T> {
  type: PageSectionType;
  title?: LocalizedText;
  active: boolean;
  boxes: T[];
}

interface Props {
  rulePaperSection?: SectionData<ExamRuleBoxContent> | null;
  ruleComputerSection?: SectionData<ExamRuleBoxContent> | null;
}

const props = defineProps<Props>();

const { locale, t } = useI18n();

const getLocalizedText = (textObj: LocalizedText | undefined) => {
  if (!textObj) return '';
  const currentLang = locale.value.startsWith('en') ? 'en' : 'th';
  return textObj[currentLang] || textObj.th || textObj.en || '';
};

const icons = [
  'history',
  'event_seat',
  'checkroom',
  'edit',
  'contacts',
  'logout',
  'local_police',
  'block',
];

const paperRules = computed(() =>
  icons.map((icon, i) => ({
    icon,
    text: t(`home.examRules.paperBased.items.rule${i + 1}`),
  })),
);

const computerRules = computed(() =>
  icons.map((icon, i) => ({
    icon,
    text: t(`home.examRules.computerBased.items.rule${i + 1}`),
  })),
);

const activePaperRules = computed(() => {
  const section = props.rulePaperSection;
  if (!section || section.active === false || !section.boxes) return [];
  return section.boxes
    .filter((box) => box.active !== false && (box.text?.th || box.text?.en))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((box) => ({
      icon: box.icon || 'circle',
      text: getLocalizedText(box.text),
    }));
});

const activeComputerRules = computed(() => {
  const section = props.ruleComputerSection;
  if (!section || section.active === false || !section.boxes) return [];
  return section.boxes
    .filter((box) => box.active !== false && (box.text?.th || box.text?.en))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((box) => ({
      icon: box.icon || 'circle',
      text: getLocalizedText(box.text),
    }));
});

const paperRulesList = computed(() => {
  if (activePaperRules.value.length > 0) return activePaperRules.value;
  return paperRules.value;
});

const computerRulesList = computed(() => {
  if (activeComputerRules.value.length > 0) return activeComputerRules.value;
  return computerRules.value;
});

const dividerStyle = computed(() => {
  const count = Math.max(paperRulesList.value.length, computerRulesList.value.length);
  if (count <= 0) return { display: 'none' };
  const height = 66 * count + 15 * (count - 1);
  return {
    height: `${height}px`,
  };
});
</script>

<style scoped>
.guideline-section {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
}
/* Side heading — fixed height so the divider can align exactly with the
   top edge of the first card (offset = label height + margin-bottom). */
.side-label {
  font-size: 22px;
  line-height: 30px;
  height: 30px;
  margin-bottom: 16px;
}
/* Equal vertical gap (15px) between cards, matching Figma */
.guideline-list {
  gap: 15px;
}
/* When the two sides stack on small screens, add spacing between them. */
@media (max-width: 1023px) {
  .side-computer {
    margin-top: 32px;
  }
}
/* Centered vertical divider between the two sides (desktop).
   top = .side-label height (30px) + margin-bottom (16px) = 46px,
   so its top edge lines up with the first card.
   height is set dynamically in script. */
.guideline-divider {
  position: absolute;
  top: 46px;
  left: 50%;
  width: 1px;
  background: #bcbbbb;
  transform: translateX(-50%);
}
</style>
