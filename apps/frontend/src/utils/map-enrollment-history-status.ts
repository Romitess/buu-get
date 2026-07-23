import {
  ENROLLMENT_STATUS,
  PAYMENT_DURATION_SECONDS_DEFAULT,
  ReceiptStatus,
  SESSION_STATUS_COMPLETED,
  TRANSACTION_MATCH_STATUS,
  TRANSACTION_PAYMENT_STATUS,
} from 'src/constants/exam';
import type {
  ExamEnrollment,
  ExamHistoryCategory,
  ExamHistoryItem,
  StatusBadgeView,
} from 'src/types/exam';

export type CancellationReason = 'manual' | 'paymentTimeout';

export interface MapEnrollmentHistoryContext {
  formattedDate: string;
  formattedTime: string;
  locationText: string;
  title: string;
  fee: number;
  getCancellationReason: (enrollmentId: number) => CancellationReason | null;
}

function getPaymentDeadline(createdAt: string): Date {
  return new Date(new Date(createdAt).getTime() + PAYMENT_DURATION_SECONDS_DEFAULT * 1000);
}

function isPaymentTimeoutCancellation(
  enrollment: Pick<ExamEnrollment, 'ERM_ID' | 'CREATED_AT' | 'UPDATED_AT'>,
  getCancellationReason: (enrollmentId: number) => CancellationReason | null,
): boolean {
  const reason = getCancellationReason(enrollment.ERM_ID);
  if (reason) return reason === 'paymentTimeout';
  if (!enrollment.CREATED_AT || !enrollment.UPDATED_AT) return false;
  return new Date(enrollment.UPDATED_AT).getTime() >= getPaymentDeadline(enrollment.CREATED_AT).getTime();
}

function hasMatchedPayment(enrollment: ExamEnrollment): boolean {
  return enrollment.TRANSACTION?.TRANX_MATCH_STATUS === TRANSACTION_MATCH_STATUS.MATCH;
}

function hasDownloadableReceipt(enrollment: ExamEnrollment): boolean {
  const paymentStatus = enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS;
  if (
    paymentStatus === TRANSACTION_PAYMENT_STATUS.REFUND ||
    paymentStatus === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED
  ) {
    return false;
  }
  const receipts = enrollment.TRANSACTION?.RECEIPTS ?? [];
  const hasVoided = receipts.some((receipt) => receipt.RC_STATUS === ReceiptStatus.VOIDED);
  if (hasVoided) return false;
  return hasMatchedPayment(enrollment);
}

function buildBadge(label: string, type: StatusBadgeView['type']): StatusBadgeView {
  return { label, type };
}

function buildBaseItem(
  enrollment: ExamEnrollment,
  context: MapEnrollmentHistoryContext,
): Omit<ExamHistoryItem, 'status' | 'statusType' | 'category' | 'registrationStatus'> {
  return {
    id: enrollment.ERM_ID,
    title: context.title,
    date: context.formattedDate,
    time: context.formattedTime,
    location: context.locationText,
    fee: context.fee,
    rawEnrollment: enrollment,
  };
}

/**
 * แปลง enrollment จาก backend เป็น ExamHistoryItem พร้อมแยกสถานะการลงทะเบียน/การสอบ
 */
export function mapEnrollmentToHistoryItem(
  enrollment: ExamEnrollment,
  context: MapEnrollmentHistoryContext,
): ExamHistoryItem | null {
  if (!enrollment.SESSION) return null;

  const base = buildBaseItem(enrollment, context);
  const canDownloadReceipt = hasDownloadableReceipt(enrollment);
  const seatLabel = enrollment.ERM_SEAT_LABEL?.trim() || undefined;

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.UNPAID) {
    const registrationStatus = buildBadge('exam.status.pending', 'warning');
    const item: ExamHistoryItem = {
      ...base,
      category: 'pending',
      registrationStatus,
      status: registrationStatus.label,
      statusType: registrationStatus.type,
      actions: ['cancel', 'pay'],
    };
    if (enrollment.CREATED_AT) {
      item.deadline = getPaymentDeadline(enrollment.CREATED_AT).toISOString();
    }
    return item;
  }

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.PAID) {
    const registrationStatus = buildBadge(
      canDownloadReceipt ? 'exam.status.verified' : 'exam.status.verifying',
      canDownloadReceipt ? 'success' : 'info',
    );
    return {
      ...base,
      category: 'registration',
      registrationStatus,
      status: registrationStatus.label,
      statusType: registrationStatus.type,
      actions: canDownloadReceipt ? ['downloadReceipt'] : [],
    };
  }

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.SEAT_ASSIGNED) {
    const registrationStatus = buildBadge('exam.status.seatAssigned', 'info');
    const examStatus = buildBadge('exam.status.awaitingSeatPublish', 'info');
    const actions: string[] = [];
    if (canDownloadReceipt) {
      actions.push('downloadReceipt');
    }
    const item: ExamHistoryItem = {
      ...base,
      category: 'registration',
      registrationStatus,
      examStatus,
      status: registrationStatus.label,
      statusType: registrationStatus.type,
      actions,
    };
    if (seatLabel) {
      item.seatLabel = seatLabel;
    }
    return item;
  }

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.SEAT_PUBLISHED) {
    const registrationStatus = buildBadge('exam.status.seatPublished', 'success');
    const examStatus = buildBadge('exam.status.awaitingExam', 'info');
    const hasVoucher = !!(enrollment.VOUCHERS && enrollment.VOUCHERS.length > 0);
    const actions: string[] = [];
    if (hasVoucher) {
      actions.push('candidateCard');
    }
    if (canDownloadReceipt) {
      actions.push('downloadReceipt');
    }
    const item: ExamHistoryItem = {
      ...base,
      category: 'registration',
      registrationStatus,
      examStatus,
      status: registrationStatus.label,
      statusType: registrationStatus.type,
      actions,
    };
    if (seatLabel) {
      item.seatLabel = seatLabel;
    }
    return item;
  }

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.ATTENDED) {
    const hasScore = !!enrollment.SCORE;
    const hasCompletedSession =
      Number(enrollment.SESSION?.SS_SESSION_STATUS) === SESSION_STATUS_COMPLETED;
    const hasCertificate = !!(
      enrollment.SCORE?.CERTIFICATES && enrollment.SCORE.CERTIFICATES.length > 0
    );
    const registrationStatus = buildBadge('exam.status.registrationComplete', 'success');
    const examStatus = buildBadge(
      hasScore ? 'exam.status.completed' : 'exam.status.evaluating',
      hasScore ? 'success' : 'info',
    );
    const actions: string[] = [];
    if (canDownloadReceipt) {
      actions.push('downloadReceipt');
    }
    if (hasCompletedSession && hasCertificate) {
      actions.push('certificate');
    }

    const item: ExamHistoryItem = {
      ...base,
      category: hasScore ? 'completed' : 'exam',
      registrationStatus,
      examStatus,
      status: examStatus.label,
      statusType: examStatus.type,
      actions,
    };

    if (seatLabel) {
      item.seatLabel = seatLabel;
    }

    if (hasScore && hasCertificate) {
      item.customStatus = {
        label: 'exam.status.completed',
        type: 'success',
        icon: 'emoji_events',
        result: 'passed',
      };
    }

    return item;
  }

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.CANCELLED) {
    const paymentStatus = enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS;
    if (paymentStatus === TRANSACTION_PAYMENT_STATUS.REFUND) {
      const registrationStatus = buildBadge('exam.status.refunded', 'warning');
      return {
        ...base,
        category: 'cancelled',
        registrationStatus,
        status: registrationStatus.label,
        statusType: registrationStatus.type,
        customStatus: {
          label: 'exam.status.refunded',
          type: 'error',
          icon: 'currency_exchange',
        },
      };
    }

    if (paymentStatus === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED) {
      const registrationStatus = buildBadge('exam.status.receiptVoided', 'warning');
      return {
        ...base,
        category: 'cancelled',
        registrationStatus,
        status: registrationStatus.label,
        statusType: registrationStatus.type,
        customStatus: {
          label: 'exam.status.receiptVoided',
          type: 'error',
          icon: 'receipt_long',
        },
      };
    }

    const isPaymentTimeout = isPaymentTimeoutCancellation(enrollment, context.getCancellationReason);
    const registrationStatus = buildBadge(
      isPaymentTimeout ? 'exam.status.paymentTimeout' : 'exam.status.registrationCancelled',
      isPaymentTimeout ? 'error' : 'warning',
    );
    const item: ExamHistoryItem = {
      ...base,
      category: 'cancelled',
      registrationStatus,
      status: registrationStatus.label,
      statusType: registrationStatus.type,
    };
    if (isPaymentTimeout) {
      item.customStatus = {
        label: 'exam.status.paymentTimeout',
        type: 'error',
        icon: 'warning_amber',
      };
    }
    return item;
  }

  return null;
}

export function isPendingHistoryItem(item: ExamHistoryItem): boolean {
  return item.category === 'pending';
}

export function matchesHistoryCategory(
  item: ExamHistoryItem,
  filter: ExamHistoryCategory | 'all',
): boolean {
  if (filter === 'all') return true;
  return item.category === filter;
}
