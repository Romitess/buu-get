import { describe, expect, it } from 'vitest';
import {
  ENROLLMENT_STATUS,
  TRANSACTION_MATCH_STATUS,
  TRANSACTION_PAYMENT_STATUS,
} from 'src/constants/exam';
import type { ExamHistoryItem } from 'src/types/exam';
import {
  deriveCandidateHomeActivities,
  toPaymentCancelledActivity,
  toUpcomingOrSeatReady,
} from './candidate-home-activities.util';

function futureExamDateOnly(daysAhead = 14): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function baseExam(examId: number, examDate: string) {
  return {
    EXAM_ID: examId,
    EXAM_NAME: 'BUU-GET',
    EXAM_TYPE: 'GENERAL',
    EXAM_FORMAT: 'CBT',
    EXAM_FEE: 500,
    EXAM_DATE: examDate,
    EXAM_REG_START_DATE: '',
    EXAM_REG_END_DATE: '',
    EXAM_PAY_START_DATE: '',
    EXAM_PAY_END_DATE: '',
    EXAM_PUBLISHED: true,
    FUND_SOURCE_ID: 1,
  };
}

function cancelledTimeoutItem(
  id: number,
  examId: number,
  examDate: string,
): ExamHistoryItem {
  return {
    id,
    title: 'BUU-GET 3/2026',
    status: 'exam.status.paymentTimeout',
    statusType: 'error',
    category: 'cancelled',
    registrationStatus: { label: 'exam.status.paymentTimeout', type: 'error' },
    customStatus: {
      label: 'exam.status.paymentTimeout',
      type: 'error',
      icon: 'warning_amber',
    },
    date: '10 สิงหาคม 2569',
    time: '10:00 - 12:00',
    location: 'TBA',
    rawEnrollment: {
      ERM_ID: id,
      USER_ID: 10,
      SESSION_ID: 5,
      LS_ID: null,
      ERM_STATUS: ENROLLMENT_STATUS.CANCELLED,
      ERM_VERIFY_STATUS: 0,
      CREATED_AT: '2026-08-01T00:00:00.000Z',
      TRANSACTION: {
        TRANX_ID: id,
        TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.EXPIRED,
      },
      SESSION: {
        SS_ID: 5,
        SS_START_TIME: '10:00:00',
        SS_END_TIME: '12:00:00',
        SS_CAPACITY: 40,
        EXAM: baseExam(examId, examDate),
      },
    },
  };
}

function seatAssignedItem(
  id: number,
  examId: number,
  examDate: string,
  startTime = '10:00:00',
): ExamHistoryItem {
  return {
    id,
    title: 'BUU-GET 3/2026',
    status: 'exam.status.seatAssigned',
    statusType: 'success',
    category: 'registration',
    registrationStatus: { label: 'exam.status.seatAssigned', type: 'success' },
    date: '10 สิงหาคม 2569',
    time: '10:00 - 12:00',
    location: 'TBA',
    rawEnrollment: {
      ERM_ID: id,
      USER_ID: 10,
      SESSION_ID: 5,
      LS_ID: null,
      ERM_STATUS: ENROLLMENT_STATUS.SEAT_ASSIGNED,
      ERM_VERIFY_STATUS: 0,
      ERM_SEAT_LABEL: 'A1',
      CREATED_AT: '2026-08-03T00:00:00.000Z',
      TRANSACTION: {
        TRANX_ID: id,
        TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.PAID,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
      },
      SESSION: {
        SS_ID: 5,
        SS_START_TIME: startTime,
        SS_END_TIME: '12:00:00',
        SS_CAPACITY: 40,
        EXAM: baseExam(examId, examDate),
      },
    },
  };
}

describe('candidate home activities derive', () => {
  it('maps payment-timeout cancelled enrollment to paymentCancelled, not upcoming', () => {
    const examDate = futureExamDateOnly();
    const cancelled = cancelledTimeoutItem(1, 100, examDate);

    expect(toPaymentCancelledActivity(cancelled)?.kind).toBe('paymentCancelled');
    expect(toUpcomingOrSeatReady(cancelled)).toBeNull();

    const activities = deriveCandidateHomeActivities([], [cancelled]);
    expect(activities).toHaveLength(1);
    expect(activities[0]?.kind).toBe('paymentCancelled');
  });

  it('dedupes same exam: two timeouts + unmatched PAID → one paymentCancelled', () => {
    const examDate = futureExamDateOnly();
    const cancelledA = cancelledTimeoutItem(10, 100, examDate);
    const cancelledB = cancelledTimeoutItem(11, 100, examDate);
    const unmatchedPaid: ExamHistoryItem = {
      id: 12,
      title: 'BUU-GET 3/2026',
      status: 'exam.status.verifying',
      statusType: 'info',
      category: 'registration',
      registrationStatus: { label: 'exam.status.verifying', type: 'info' },
      date: '10 สิงหาคม 2569',
      time: '10:00 - 12:00',
      location: 'TBA',
      rawEnrollment: {
        ERM_ID: 12,
        USER_ID: 10,
        SESSION_ID: 5,
        LS_ID: null,
        ERM_STATUS: ENROLLMENT_STATUS.PAID,
        ERM_VERIFY_STATUS: 0,
        CREATED_AT: '2026-08-02T00:00:00.000Z',
        TRANSACTION: {
          TRANX_ID: 12,
          TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.PAID,
          TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.UNMATCH,
        },
        SESSION: {
          SS_ID: 5,
          SS_START_TIME: '10:00:00',
          SS_END_TIME: '12:00:00',
          SS_CAPACITY: 40,
          EXAM: baseExam(100, examDate),
        },
      },
    };

    expect(toUpcomingOrSeatReady(unmatchedPaid)).toBeNull();

    const activities = deriveCandidateHomeActivities([], [
      cancelledA,
      cancelledB,
      unmatchedPaid,
    ]);

    expect(activities).toHaveLength(1);
    expect(activities[0]?.kind).toBe('paymentCancelled');
    expect(activities[0]?.id).toBe(11);
  });

  it('does not show upcoming for matched PAID without a seat', () => {
    const examDate = futureExamDateOnly();
    const matchedPaid: ExamHistoryItem = {
      id: 20,
      title: 'BUU-GET 3/2026',
      status: 'exam.status.verified',
      statusType: 'success',
      category: 'registration',
      registrationStatus: { label: 'exam.status.verified', type: 'success' },
      date: '10 สิงหาคม 2569',
      time: '10:00 - 12:00',
      location: 'TBA',
      rawEnrollment: {
        ERM_ID: 20,
        USER_ID: 10,
        SESSION_ID: 5,
        LS_ID: null,
        ERM_STATUS: ENROLLMENT_STATUS.PAID,
        ERM_VERIFY_STATUS: 0,
        CREATED_AT: '2026-08-03T00:00:00.000Z',
        TRANSACTION: {
          TRANX_ID: 20,
          TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.PAID,
          TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        },
        SESSION: {
          SS_ID: 5,
          SS_START_TIME: '10:00:00',
          SS_END_TIME: '12:00:00',
          SS_CAPACITY: 40,
          EXAM: baseExam(100, examDate),
        },
      },
    };

    expect(toUpcomingOrSeatReady(matchedPaid)).toBeNull();
    expect(deriveCandidateHomeActivities([], [matchedPaid])).toHaveLength(0);
  });

  it('shows upcoming for SEAT_ASSIGNED before exam start', () => {
    const examDate = futureExamDateOnly();
    const cancelled = cancelledTimeoutItem(10, 100, examDate);
    const withSeat = seatAssignedItem(20, 100, examDate);

    const activities = deriveCandidateHomeActivities([], [cancelled, withSeat]);
    expect(activities).toHaveLength(1);
    expect(activities[0]?.kind).toBe('upcoming');
    expect(activities[0]?.id).toBe(20);
  });

  it('hides upcoming after exam start time on exam day', () => {
    const examDate = '2026-08-10';
    const withSeat = seatAssignedItem(20, 100, examDate, '10:00:00');
    const beforeStart = new Date('2026-08-10T09:59:00+07:00');
    const afterStart = new Date('2026-08-10T10:20:00+07:00');

    expect(toUpcomingOrSeatReady(withSeat, beforeStart)?.kind).toBe('upcoming');
    expect(toUpcomingOrSeatReady(withSeat, afterStart)).toBeNull();
    expect(deriveCandidateHomeActivities([], [withSeat], afterStart)).toHaveLength(0);
  });

  it('hides paymentCancelled after exam start so สมัครใหม่ is not offered', () => {
    const examDate = '2026-08-10';
    const cancelled = cancelledTimeoutItem(1, 100, examDate);
    const beforeStart = new Date('2026-08-10T09:59:00+07:00');
    const afterStart = new Date('2026-08-10T10:20:00+07:00');

    expect(toPaymentCancelledActivity(cancelled, beforeStart)?.kind).toBe('paymentCancelled');
    expect(toPaymentCancelledActivity(cancelled, afterStart)).toBeNull();
    expect(deriveCandidateHomeActivities([], [cancelled], afterStart)).toHaveLength(0);
  });

  it('never treats cancelled category as upcoming even if status looks paid', () => {
    const examDate = futureExamDateOnly(7);
    const weird: ExamHistoryItem = {
      id: 2,
      title: 'BUU-GET',
      status: 'exam.status.verified',
      statusType: 'success',
      category: 'cancelled',
      registrationStatus: { label: 'exam.status.verified', type: 'success' },
      date: '1 Aug 2569',
      time: '09:00 - 12:00',
      location: 'Room',
      rawEnrollment: {
        ERM_ID: 2,
        USER_ID: 10,
        SESSION_ID: 6,
        LS_ID: null,
        ERM_STATUS: ENROLLMENT_STATUS.PAID,
        ERM_VERIFY_STATUS: 0,
        CREATED_AT: '2026-08-01T00:00:00.000Z',
        SESSION: {
          SS_ID: 6,
          SS_START_TIME: '09:00:00',
          SS_END_TIME: '12:00:00',
          SS_CAPACITY: 40,
          EXAM: baseExam(2, examDate),
        },
      },
    };

    expect(toUpcomingOrSeatReady(weird)).toBeNull();
  });
});
