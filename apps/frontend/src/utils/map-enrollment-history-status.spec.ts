import { describe, expect, it } from 'vitest';
import {
  ENROLLMENT_STATUS,
  ReceiptStatus,
  TRANSACTION_MATCH_STATUS,
  TRANSACTION_PAYMENT_STATUS,
} from 'src/constants/exam';
import type { ExamEnrollment, ExamHistoryItem } from 'src/types/exam';
import {
  hasDownloadableReceipt,
  isPaymentTimeoutCancellation,
  isPaymentTimeoutHistoryItem,
  mapEnrollmentToHistoryItem,
} from './map-enrollment-history-status';

function enrollment(overrides: Record<string, unknown> = {}): ExamEnrollment {
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

describe('hasDownloadableReceipt', () => {
  it('returns true when payment matches and receipt is ISSUED with RC_VERIFY_CODE', () => {
    const item = enrollment({
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.ISSUED,
            RC_VERIFY_CODE: 'VERIFY-123',
          },
        ],
      },
    });
    expect(hasDownloadableReceipt(item)).toBe(true);
  });

  it('returns false when receipt is missing RC_VERIFY_CODE', () => {
    const item = enrollment({
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.ISSUED,
          },
        ],
      },
    });
    expect(hasDownloadableReceipt(item)).toBe(false);
  });

  it('returns false when receipt is UNISSUED even with verify code', () => {
    const item = enrollment({
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.UNISSUED,
            RC_VERIFY_CODE: 'VERIFY-123',
          },
        ],
      },
    });
    expect(hasDownloadableReceipt(item)).toBe(false);
  });

  it('returns false when receipts array is empty', () => {
    const item = enrollment({
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [],
      },
    });
    expect(hasDownloadableReceipt(item)).toBe(false);
  });

  it('returns false when any receipt is VOIDED', () => {
    const item = enrollment({
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.VOIDED,
            RC_VERIFY_CODE: 'VERIFY-123',
          },
        ],
      },
    });
    expect(hasDownloadableReceipt(item)).toBe(false);
  });

  it('returns false when payment is UNMATCH', () => {
    const item = enrollment({
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.UNMATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.ISSUED,
            RC_VERIFY_CODE: 'VERIFY-123',
          },
        ],
      },
    });
    expect(hasDownloadableReceipt(item)).toBe(false);
  });
});

describe('mapEnrollmentToHistoryItem - PAID enrollment status and receipt actions', () => {
  const context = {
    formattedDate: '1 Aug 2026',
    formattedTime: '09:00 - 12:00',
    locationText: 'Room A',
    title: 'BUU-GET Exam',
    fee: 500,
    getCancellationReason: () => null,
  };

  it('shows verified status and downloadReceipt action when paid and receipt is ready', () => {
    const item = enrollment({
      ERM_STATUS: ENROLLMENT_STATUS.PAID,
      SESSION: {
        EXAM: { EXAM_NAME: 'BUU-GET' },
      } as unknown as ExamEnrollment['SESSION'],
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.ISSUED,
            RC_VERIFY_CODE: 'VERIFY-123',
          },
        ],
      },
    });

    const mapped = mapEnrollmentToHistoryItem(item, context);
    expect(mapped).not.toBeNull();
    expect(mapped?.registrationStatus.label).toBe('exam.status.verified');
    expect(mapped?.actions).toContain('downloadReceipt');
  });

  it('shows verified status but OMITS downloadReceipt action when receipt verify code is missing', () => {
    const item = enrollment({
      ERM_STATUS: ENROLLMENT_STATUS.PAID,
      SESSION: {
        EXAM: { EXAM_NAME: 'BUU-GET' },
      } as unknown as ExamEnrollment['SESSION'],
      TRANSACTION: {
        TRANX_ID: 10,
        TRANX_MATCH_STATUS: TRANSACTION_MATCH_STATUS.MATCH,
        RECEIPTS: [
          {
            RC_ID: 1,
            RC_STATUS: ReceiptStatus.UNISSUED,
          },
        ],
      },
    });

    const mapped = mapEnrollmentToHistoryItem(item, context);
    expect(mapped).not.toBeNull();
    // Payment is matched, so candidate sees payment verified
    expect(mapped?.registrationStatus.label).toBe('exam.status.verified');
    // But download button is hidden to prevent missingVerifyCode error
    expect(mapped?.actions).not.toContain('downloadReceipt');
  });
});

