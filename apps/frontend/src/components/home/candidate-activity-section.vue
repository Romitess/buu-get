<template>
  <div v-if="shouldShowSection" class="home-section home-section--lead">
    <div class="home-section__intro">
      <HomeSectionHeader
        icon="assignment"
        :title="$t('home.candidateActivity.title')"
        :action-label="showContent ? $t('home.candidateActivity.viewAll') : ''"
        action-icon-right="chevron_right"
        @action="goViewAll"
      />
      <q-separator color="grey-6" class="home-section-separator" />
    </div>

    <div class="home-section__body">
    <div v-if="isLoading && !showContent" class="activity-grid">
      <q-skeleton
        v-for="n in 2"
        :key="`skeleton-${n}`"
        type="rect"
        class="activity-skeleton"
        height="180px"
      />
    </div>

    <div v-else-if="showContent" class="activity-grid">
      <CandidateActivityCard
        v-for="(activity, index) in activities"
        :key="activity.id"
        :activity="activity"
        :style="{ '--stagger-index': index }"
        class="activity-card-enter"
        @action="handleAction"
        @timeout="handleTimeout"
      />
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import CandidateActivityCard from 'src/components/home/candidate-activity-card.vue';
import HomeSectionHeader from 'src/components/home/home-section-header.vue';
import {
  useCandidateHomeActivities,
  type CandidateHomeActivity,
} from 'src/composables/use-candidate-home-activities';

const router = useRouter();
const { activities, isLoading, shouldShowSection, showContent, viewAllRoute, loadActivities } =
  useCandidateHomeActivities();

const goViewAll = async (): Promise<void> => {
  await router.push(viewAllRoute);
};

const handleAction = async (activity: CandidateHomeActivity): Promise<void> => {
  await router.push(activity.ctaRoute);
};

const handleTimeout = (): void => {
  void loadActivities(true);
};
</script>

<style scoped lang="scss">
.activity-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.activity-skeleton {
  border-radius: 12px;
}

.activity-card-enter {
  animation: activity-fade-up 420ms cubic-bezier(0.23, 1, 0.32, 1) both;
  animation-delay: calc(var(--stagger-index, 0) * 40ms);
}

@keyframes activity-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 900px) {
  .activity-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
