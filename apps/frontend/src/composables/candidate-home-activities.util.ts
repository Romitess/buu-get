import { ENROLLMENT_STATUS } from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';
import { parseExamStartDateTime } from 'src/utils/exam-registration';
import { isPaymentTimeoutHistoryItem } from 'src/utils/map-enrollment-history-status';
import type {
  CandidateActivityKind,
  CandidateHomeActivity,
} from './use-candidate-home-activities.types';

export type { CandidateActivityKind, CandidateHomeActivity };

const EXAM_HISTORY_PATH = '/user/exam-history' as const;
const EXAM_SCHEDULE_PATH = '/user/exam-schedule' as const;
export const MAX_DISPLAY_ACTIVITIES = 4 as const;

/** ใกล้วันสอบ / พร้อมเข้าสอบ: ต้องจ่ายแล้วและมีที่นั่งแล้วเท่านั้น */
const UPCOMING_STATUSES = new Set<number>([
  ENROLLMENT_STATUS.SEAT_ASSIGNED,
  ENROLLMENT_STATUS.SEAT_PUBLISHED,
]);

function getExamDateMs(item: ExamHistoryItem): number {
  const rawDate = item.rawEnrollment?.SESSION?.EXAM?.EXAM_DATE;
  if (!rawDate) return Number.POSITIVE_INFINITY;
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime();
}

/** Instant เวลาเริ่มสอบ (EXAM_DATE + SS_START_TIME, Bangkok) */
export function getExamStartMs(item: ExamHistoryItem): number | null {
  const examDate = item.rawEnrollment?.SESSION?.EXAM?.EXAM_DATE;
  const startTime = item.rawEnrollment?.SESSION?.SS_START_TIME;
  if (!examDate || !startTime) return null;

  const start = parseExamStartDateTime(examDate, startTime);
  return start ? start.getTime() : null;
}

function hasVoucher(item: ExamHistoryItem): boolean {
  const vouchers = item.rawEnrollment?.VOUCHERS;
  return Array.isArray(vouchers) && vouchers.length > 0;
}

/** Group key: same exam round should surface at most one home activity card */
export function getExamActivityGroupKey(item: ExamHistoryItem): string {
  const examId = item.rawEnrollment?.SESSION?.EXAM?.EXAM_ID;
  if (examId !== undefined && examId !== null) {
    return `exam:${examId}`;
  }
  const sessionId = item.rawEnrollment?.SESSION_ID ?? item.rawEnrollment?.SESSION?.SS_ID;
  if (sessionId !== undefined && sessionId !== null) {
    return `session:${sessionId}`;
  }
  return `title:${item.title}|${item.date}|${item.time}`;
}

export function toUnpaidActivity(item: ExamHistoryItem): CandidateHomeActivity {
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

export function toPaymentCancelledActivity(
  item: ExamHistoryItem,
  now: Date = new Date(),
): CandidateHomeActivity | null {
  if (!isPaymentTimeoutHistoryItem(item)) return null;

  const examStartMs = getExamStartMs(item);
  if (examStartMs === null || now.getTime() >= examStartMs) {
    return null;
  }

  const activity: CandidateHomeActivity = {
    id: item.id,
    kind: 'paymentCancelled',
    title: item.title,
    date: item.date,
    time: item.time,
    location: item.location,
    sortKey: 1,
    examDateMs: examStartMs,
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

export function toUpcomingOrSeatReady(
  item: ExamHistoryItem,
  now: Date = new Date(),
): CandidateHomeActivity | null {
  if (item.category === 'cancelled' || item.category === 'pending') {
    return null;
  }

  const status = Number(item.rawEnrollment?.ERM_STATUS);
  if (
    Number.isNaN(status) ||
    status === ENROLLMENT_STATUS.CANCELLED ||
    !UPCOMING_STATUSES.has(status)
  ) {
    return null;
  }

  const examStartMs = getExamStartMs(item);
  if (examStartMs === null || now.getTime() >= examStartMs) {
    return null;
  }

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
    examDateMs: examStartMs,
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

/**
 * One card per exam round.
 * Keep the activity from the newest enrollment (highest id) so a later
 * successful re-registration wins over an older payment timeout, while
 * duplicate timeout cards collapse to one.
 */
export function collapseActivitiesByExam(
  activities: CandidateHomeActivity[],
  groupKeyByActivityId: Map<number, string>,
): CandidateHomeActivity[] {
  const byGroup = new Map<string, CandidateHomeActivity>();

  for (const activity of activities) {
    const groupKey = groupKeyByActivityId.get(activity.id) ?? `id:${activity.id}`;
    const existing = byGroup.get(groupKey);
    if (!existing || activity.id > existing.id) {
      byGroup.set(groupKey, activity);
    }
  }

  return Array.from(byGroup.values());
}

export function deriveCandidateHomeActivities(
  pending: ExamHistoryItem[],
  history: ExamHistoryItem[],
  now: Date = new Date(),
): CandidateHomeActivity[] {
  const groupKeyByActivityId = new Map<number, string>();

  const unpaid = pending.map((item) => {
    groupKeyByActivityId.set(item.id, getExamActivityGroupKey(item));
    return toUnpaidActivity(item);
  });

  const paymentCancelled = history
    .map((item) => {
      const activity = toPaymentCancelledActivity(item, now);
      if (activity) {
        groupKeyByActivityId.set(item.id, getExamActivityGroupKey(item));
      }
      return activity;
    })
    .filter((item): item is CandidateHomeActivity => item !== null);

  const upcoming = history
    .map((item) => {
      const activity = toUpcomingOrSeatReady(item, now);
      if (activity) {
        groupKeyByActivityId.set(item.id, getExamActivityGroupKey(item));
      }
      return activity;
    })
    .filter((item): item is CandidateHomeActivity => item !== null);

  const collapsed = collapseActivitiesByExam(
    [...unpaid, ...paymentCancelled, ...upcoming],
    groupKeyByActivityId,
  );

  return collapsed
    .sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.examDateMs - b.examDateMs;
    })
    .slice(0, MAX_DISPLAY_ACTIVITIES);
}

export const CANDIDATE_HOME_EXAM_HISTORY_PATH = EXAM_HISTORY_PATH;
