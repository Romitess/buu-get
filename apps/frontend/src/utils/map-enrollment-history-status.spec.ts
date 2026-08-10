import { describe, expect, it } from 'vitest';
import {
  ENROLLMENT_STATUS,
  TRANSACTION_PAYMENT_STATUS,
} from 'src/constants/exam';
import type { ExamEnrollment, ExamHistoryItem } from 'src/types/exam';
import {
  isPaymentTimeoutCancellation,
  isPaymentTimeoutHistoryItem,
} from './map-enrollment-history-status';

function enrollment(
  overrides: Partial<ExamEnrollment> & {
    TRANSACTION?: ExamEnrollment['TRANSACTION'];
  } = {},
): ExamEnrollment {
  return {
    ERM_ID: 1,
    USER_ID: 10,
    SESSION_ID: 5,
    LS_ID: null,
    ERM_STATUS: ENROLLMENT_STATUS.CANCELLED,
    ERM_VERIFY_STATUS: 0,
    CREATED_AT: '2026-08-01T00:00:00.000Z',
    ...overrides,
  } as ExamEnrollment;
}

describe('isPaymentTimeoutCancellation', () => {
  it('returns true for EXPIRED transaction', () => {
    expect(
      isPaymentTimeoutCancellation(
        enrollment({
          TRANSACTION: {
            TRANX_ID: 1,
            TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.EXPIRED,
          },
        }),
        () => null,
      ),
    ).toBe(true);
  });

  it('returns true when TRANX_EXPIRES_AT was set (QR session started)', () => {
    expect(
      isPaymentTimeoutCancellation(
        enrollment({
          TRANSACTION: {
            TRANX_ID: 1,
            TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.PENDING,
            TRANX_EXPIRES_AT: '2026-08-01T01:00:00.000Z',
          },
        }),
        () => null,
      ),
    ).toBe(true);
  });

  it('returns true for unpaid cancel without txn (pay-end cron)', () => {
    expect(
      isPaymentTimeoutCancellation(enrollment({ TRANSACTION: undefined }), () => null),
    ).toBe(true);
  });

  it('returns true for PENDING txn cancel without manual reason', () => {
    expect(
      isPaymentTimeoutCancellation(
        enrollment({
          TRANSACTION: {
            TRANX_ID: 1,
            TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.PENDING,
          },
        }),
        () => null,
      ),
    ).toBe(true);
  });

  it('returns false for explicit manual cancel', () => {
    expect(
      isPaymentTimeoutCancellation(enrollment(), () => 'manual'),
    ).toBe(false);
  });

  it('returns true for explicit paymentTimeout reason', () => {
    expect(
      isPaymentTimeoutCancellation(enrollment(), () => 'paymentTimeout'),
    ).toBe(true);
  });

  it('returns false for refund / receipt voided', () => {
    expect(
      isPaymentTimeoutCancellation(
        enrollment({
          TRANSACTION: {
            TRANX_ID: 1,
            TRANX_PAYMENT_STATUS: TRANSACTION_PAYMENT_STATUS.REFUND,
          },
        }),
        () => null,
      ),
    ).toBe(false);
  });

  it('coerces string status codes from API', () => {
    expect(
      isPaymentTimeoutCancellation(
        enrollment({
          ERM_STATUS: '5' as unknown as number,
          TRANSACTION: {
            TRANX_ID: 1,
            TRANX_PAYMENT_STATUS: '5' as unknown as number,
          },
        }),
        () => null,
      ),
    ).toBe(true);
  });
});

describe('isPaymentTimeoutHistoryItem', () => {
  it('trusts mapped paymentTimeout status', () => {
    const item = {
      id: 1,
      title: 'Exam',
      status: 'exam.status.paymentTimeout',
      statusType: 'error',
      category: 'cancelled',
      registrationStatus: { label: 'exam.status.paymentTimeout', type: 'error' },
      date: '1 Aug 2569',
      time: '09:00 - 12:00',
      location: 'Room A',
    } as ExamHistoryItem;

    expect(isPaymentTimeoutHistoryItem(item)).toBe(true);
  });

  it('returns false for registrationCancelled (manual)', () => {
    const item = {
      id: 1,
      title: 'Exam',
      status: 'exam.status.registrationCancelled',
      statusType: 'warning',
      category: 'cancelled',
      registrationStatus: {
        label: 'exam.status.registrationCancelled',
        type: 'warning',
      },
      date: '1 Aug 2569',
      time: '09:00 - 12:00',
      location: 'Room A',
    } as ExamHistoryItem;

    expect(isPaymentTimeoutHistoryItem(item)).toBe(false);
  });
});
