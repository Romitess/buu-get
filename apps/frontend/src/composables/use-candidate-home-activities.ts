import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import {
  CANDIDATE_HOME_EXAM_HISTORY_PATH,
  deriveCandidateHomeActivities,
} from './candidate-home-activities.util';
import type { CandidateHomeActivity } from './use-candidate-home-activities.types';

export type { CandidateActivityKind, CandidateHomeActivity } from './use-candidate-home-activities.types';

export function useCandidateHomeActivities() {
  const userStore = useUserStore();
  const examStore = useExamStore();
  const { pendingRegistrations, historyRecords } = storeToRefs(examStore);

  const isLoading = ref(false);
  const hasFetched = ref(false);

  const isEligibleCandidate = computed(
    () => userStore.isLoggedIn && userStore.userRoles.includes(ROLES.CANDIDATE),
  );

  const activities = computed((): CandidateHomeActivity[] => {
    if (!isEligibleCandidate.value) return [];
    return deriveCandidateHomeActivities(pendingRegistrations.value, historyRecords.value);
  });

  /** Show while loading or when there is at least one actionable activity. */
  const shouldShowSection = computed(
    () =>
      isEligibleCandidate.value &&
      (!hasFetched.value || isLoading.value || activities.value.length > 0),
  );

  const showContent = computed(() => isEligibleCandidate.value && activities.value.length > 0);

  async function loadActivities(force = false): Promise<void> {
    if (!isEligibleCandidate.value) {
      hasFetched.value = true;
      return;
    }

    isLoading.value = true;
    try {
      await examStore.fetchHistory(force);
    } finally {
      isLoading.value = false;
      hasFetched.value = true;
    }
  }

  onMounted(() => {
    void loadActivities();
  });

  watch(isEligibleCandidate, (eligible) => {
    if (eligible) {
      void loadActivities();
    } else {
      hasFetched.value = true;
    }
  });

  return {
    isEligibleCandidate,
    isLoading,
    hasFetched,
    activities,
    shouldShowSection,
    showContent,
    loadActivities,
    viewAllRoute: CANDIDATE_HOME_EXAM_HISTORY_PATH,
  };
}
