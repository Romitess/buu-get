import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useExamStore } from 'src/stores/exam.store';
import { useUserStore } from 'src/stores/user.store';
import { ROLES } from 'src/constants/roles';
import {
  ENROLLMENT_STATUS,
  TRANSACTION_PAYMENT_STATUS,
} from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';

export type CandidateActivityKind = 'unpaid' | 'paymentCancelled' | 'upcoming' | 'seatReady';

export interface CandidateHomeActivity {
  id: number;
  kind: CandidateActivityKind;
  title: string;
  date: string;
  time: string;
  location: string;
  fee?: number;
  /** Exam pay-by date (EXAM_PAY_END_DATE) for unpaid cards before QR session */
  payByDate?: string;
  /** QR session expiry — when set, unpaid card shows countdown */
  deadline?: string;
  seatLabel?: string;
  /** Sort key: unpaid first, then payment cancelled, then nearest exam date */
  sortKey: number;
  examDateMs: number;
  ctaRoute: string;
  ctaLabelKey: string;
  badgeLabelKey: string;
  badgeType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  imageKey: CandidateActivityKind;
}

const EXAM_HISTORY_PATH = '/user/exam-history' as const;
const EXAM_SCHEDULE_PATH = '/user/exam-schedule' as const;
const MAX_DISPLAY_ACTIVITIES = 4 as const;

const UPCOMING_STATUSES = new Set<number>([
  ENROLLMENT_STATUS.PAID,
  ENROLLMENT_STATUS.SEAT_ASSIGNED,
  ENROLLMENT_STATUS.SEAT_PUBLISHED,
]);

function startOfTodayMs(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function getExamDateMs(item: ExamHistoryItem): number {
  const rawDate = item.rawEnrollment?.SESSION?.EXAM?.EXAM_DATE;
  if (!rawDate) return Number.POSITIVE_INFINITY;
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime();
}

function hasVoucher(item: ExamHistoryItem): boolean {
  const vouchers = item.rawEnrollment?.VOUCHERS;
  return Array.isArray(vouchers) && vouchers.length > 0;
}

function isPaymentTimeoutCancellation(item: ExamHistoryItem): boolean {
  const enrollment = item.rawEnrollment;
  if (!enrollment || enrollment.ERM_STATUS !== ENROLLMENT_STATUS.CANCELLED) {
    return false;
  }

  if (item.customStatus?.label === 'exam.status.paymentTimeout') {
    return true;
  }

  if (item.status === 'exam.status.paymentTimeout') {
    return true;
  }

  return enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS === TRANSACTION_PAYMENT_STATUS.EXPIRED;
}

function toUnpaidActivity(item: ExamHistoryItem): CandidateHomeActivity {
  const activity: CandidateHomeActivity = {
    id: item.id,
    kind: 'unpaid',
    title: item.title,
    date: item.date,
    time: item.time,
    location: item.location,
    sortKey: 0,
    examDateMs: getExamDateMs(item),
    ctaRoute: EXAM_HISTORY_PATH,
    ctaLabelKey: 'home.candidateActivity.payNow',
    badgeLabelKey: 'home.candidateActivity.badges.unpaid',
    badgeType: 'warning',
    imageKey: 'unpaid',
  };

  if (item.fee !== undefined) {
    activity.fee = item.fee;
  }
  if (item.payByDate) {
    activity.payByDate = item.payByDate;
  }
  if (item.deadline) {
    activity.deadline = item.deadline;
  }

  return activity;
}

function toPaymentCancelledActivity(item: ExamHistoryItem): CandidateHomeActivity | null {
  if (!isPaymentTimeoutCancellation(item)) return null;

  const examDateMs = getExamDateMs(item);
  // Only surface when the exam day is still relevant for re-registration.
  if (examDateMs < startOfTodayMs()) return null;

  const activity: CandidateHomeActivity = {
    id: item.id,
    kind: 'paymentCancelled',
    title: item.title,
    date: item.date,
    time: item.time,
    location: item.location,
    sortKey: 1,
    examDateMs,
    ctaRoute: EXAM_SCHEDULE_PATH,
    ctaLabelKey: 'home.candidateActivity.registerAgain',
    badgeLabelKey: 'home.candidateActivity.badges.paymentCancelled',
    badgeType: 'error',
    imageKey: 'paymentCancelled',
  };

  if (item.fee !== undefined) {
    activity.fee = item.fee;
  }

  return activity;
}

function toUpcomingOrSeatReady(item: ExamHistoryItem): CandidateHomeActivity | null {
  const status = item.rawEnrollment?.ERM_STATUS;
  if (status === undefined || !UPCOMING_STATUSES.has(status)) return null;

  const examDateMs = getExamDateMs(item);
  if (examDateMs < startOfTodayMs()) return null;

  const seatReady = status === ENROLLMENT_STATUS.SEAT_PUBLISHED && hasVoucher(item);
  const kind: CandidateActivityKind = seatReady ? 'seatReady' : 'upcoming';
  const seatLabel = item.rawEnrollment?.ERM_SEAT_LABEL;

  const activity: CandidateHomeActivity = {
    id: item.id,
    kind,
    title: item.title,
    date: item.date,
    time: item.time,
    location: item.location,
    sortKey: 2,
    examDateMs,
    ctaRoute: EXAM_HISTORY_PATH,
    ctaLabelKey: seatReady
      ? 'home.candidateActivity.viewCandidateCard'
      : 'home.candidateActivity.viewDetails',
    badgeLabelKey: seatReady
      ? 'home.candidateActivity.badges.seatReady'
      : 'home.candidateActivity.badges.upcoming',
    badgeType: seatReady ? 'success' : 'info',
    imageKey: kind,
  };

  if (item.fee !== undefined) {
    activity.fee = item.fee;
  }
  if (seatLabel) {
    activity.seatLabel = seatLabel;
  }

  return activity;
}

function deriveActivities(
  pending: ExamHistoryItem[],
  history: ExamHistoryItem[],
): CandidateHomeActivity[] {
  const unpaid = pending.map(toUnpaidActivity);
  const paymentCancelled = history
    .map(toPaymentCancelledActivity)
    .filter((item): item is CandidateHomeActivity => item !== null);
  const upcoming = history
    .map(toUpcomingOrSeatReady)
    .filter((item): item is CandidateHomeActivity => item !== null);

  return [...unpaid, ...paymentCancelled, ...upcoming]
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.examDateMs - b.examDateMs;
    })
    .slice(0, MAX_DISPLAY_ACTIVITIES);
}

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
    return deriveActivities(pendingRegistrations.value, historyRecords.value);
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
    viewAllRoute: EXAM_HISTORY_PATH,
  };
}
