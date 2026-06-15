<template>
  <div class="guideline-section">
    <div class="row q-col-gutter-x-lg q-col-gutter-y-xl justify-center">
      <div v-for="(rule, index) in rules" :key="index" class="col-12 col-md-6">
        <HomeGuidelineCard :icon="rule.icon" :text="rule.text" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import HomeGuidelineCard from './home-guideline-card.vue';

const { t } = useI18n();

const rules = computed(() => [
  { icon: 'history', text: t('home.examRules.items.rule1') },
  { icon: 'contacts', text: t('home.examRules.items.rule2') },
  { icon: 'event_seat', text: t('home.examRules.items.rule3') },
  { icon: 'logout', text: t('home.examRules.items.rule4') },
  { icon: 'checkroom', text: t('home.examRules.items.rule5') },
  { icon: 'local_police', text: t('home.examRules.items.rule6') },
  { icon: 'edit', text: t('home.examRules.items.rule7') },
  { icon: 'block', text: t('home.examRules.items.rule8') },
]);
</script>

<style scoped>
.guideline-section {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
