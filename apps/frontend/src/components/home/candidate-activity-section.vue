<template>
  <div v-if="shouldShowSection" class="candidate-activity-section q-mt-lg q-mb-lg">
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <div class="section-icon q-mr-sm">
          <q-icon name="assignment" color="white" size="18px" />
        </div>
        <div class="text-h6 text-weight-bolder text-dark">
          {{ $t('home.candidateActivity.title') }}
        </div>
      </div>

      <q-btn
        v-if="showContent"
        flat
        dense
        color="primary"
        class="text-weight-bold"
        :label="$t('home.candidateActivity.viewAll')"
        icon-right="chevron_right"
        @click="goViewAll"
      />
    </div>
    <q-separator color="grey-6" class="q-mb-md" />

    <!-- Loading skeletons -->
    <div v-if="isLoading && !showContent" class="activity-grid">
      <q-skeleton
        v-for="n in 2"
        :key="`skeleton-${n}`"
        type="rect"
        class="activity-skeleton"
        height="148px"
      />
    </div>

    <!-- Activity cards -->
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
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import CandidateActivityCard from 'src/components/home/candidate-activity-card.vue';
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
.candidate-activity-section {
  max-width: 1300px;
  margin-left: auto;
  margin-right: auto;
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
  animation-delay: calc(var(--stagger-index, 0) * 80ms);
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
