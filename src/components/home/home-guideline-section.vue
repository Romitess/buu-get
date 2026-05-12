<template>
  <div class="guideline-section">
    <div class="row q-col-gutter-md">
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
  { icon: 'badge', text: t('home.examRules.items.rule2') },
  { icon: 'airline_seat_recline_extra', text: t('home.examRules.items.rule3') },
  { icon: 'logout', text: t('home.examRules.items.rule4') },
  { icon: 'dry_cleaning', text: t('home.examRules.items.rule5') },
  { icon: 'security', text: t('home.examRules.items.rule6') },
  { icon: 'edit', text: t('home.examRules.items.rule7') },
  { icon: 'block', text: t('home.examRules.items.rule8') },
]);
</script>
