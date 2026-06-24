<template>
  <div class="guideline-section">
    <!-- Centered vertical divider (desktop only) -->
    <div class="guideline-divider gt-sm" />
    <div class="row q-col-gutter-x-xl">
      <!-- Side: Paper-based -->
      <div class="col-12 col-md-6">
        <div class="side-label text-weight-bold text-primary">
          {{ t('home.examRules.paperBased.label') }}
        </div>
        <div class="column guideline-list">
          <HomeGuidelineCard
            v-for="(rule, index) in paperRules"
            :key="`paper-${index}`"
            :icon="rule.icon"
            :text="rule.text"
          />
        </div>
      </div>

      <!-- Side: Computer-based -->
      <div class="col-12 col-md-6 side-computer">
        <div class="side-label text-weight-bold text-primary">
          {{ t('home.examRules.computerBased.label') }}
        </div>
        <div class="column guideline-list">
          <HomeGuidelineCard
            v-for="(rule, index) in computerRules"
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

const { t } = useI18n();

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
   height = 8 cards (66px each) + 7 gaps (15px each), so its bottom edge
   lines up exactly with the last card. */
.guideline-divider {
  position: absolute;
  top: 46px;
  left: 50%;
  width: 1px;
  height: calc(66px * 8 + 15px * 7);
  background: #bcbbbb;
  transform: translateX(-50%);
}
</style>
