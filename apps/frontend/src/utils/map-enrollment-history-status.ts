import {
  ENROLLMENT_STATUS,
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

type EnrollmentCancelProbe = Pick<ExamEnrollment, 'ERM_ID' | 'ERM_STATUS' | 'TRANSACTION'>;

/**
 * ตรวจว่า enrollment ที่ CANCELLED ควรจัดเป็นหมดเวลา/ล้มเหลวการชำระ (ให้ลงทะเบียนใหม่ได้)
 * ไม่รวม manual cancel และ refund / receipt voided
 */
export function isPaymentTimeoutCancellation(
  enrollment: EnrollmentCancelProbe,
  getCancellationReason: (enrollmentId: number) => CancellationReason | null = () => null,
): boolean {
  if (Number(enrollment.ERM_STATUS) !== ENROLLMENT_STATUS.CANCELLED) {
    return false;
  }

  const paymentStatus = enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS;
  const statusNum =
    paymentStatus === undefined || paymentStatus === null ? null : Number(paymentStatus);

  if (
    statusNum === TRANSACTION_PAYMENT_STATUS.REFUND ||
    statusNum === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED
  ) {
    return false;
  }

  const reason = getCancellationReason(enrollment.ERM_ID);
  if (reason === 'manual') {
    return false;
  }
  if (reason === 'paymentTimeout') {
    return true;
  }

  if (statusNum === TRANSACTION_PAYMENT_STATUS.EXPIRED) {
    return true;
  }

  if (statusNum === TRANSACTION_PAYMENT_STATUS.PAID) {
    return false;
  }

  // เคยเปิด QR session (มี TRANX_EXPIRES_AT)
  if (enrollment.TRANSACTION?.TRANX_EXPIRES_AT) {
    return true;
  }

  // ยกเลิกตอนยังไม่เคยชำระสำเร็จ (เช่น cron เลยวันปิดชำระ โดยไม่มี EXPIRED)
  return statusNum === null || statusNum === TRANSACTION_PAYMENT_STATUS.PENDING;
}

/** ใช้กับ ExamHistoryItem จาก store / home activities — เชื่อสถานะที่ mapper จัดแล้ว */
export function isPaymentTimeoutHistoryItem(item: ExamHistoryItem): boolean {
  return (
    item.customStatus?.label === 'exam.status.paymentTimeout' ||
    item.status === 'exam.status.paymentTimeout'
  );
}

function hasMatchedPayment(enrollment: ExamEnrollment): boolean {
  return (
    Number(enrollment.TRANSACTION?.TRANX_MATCH_STATUS) === TRANSACTION_MATCH_STATUS.MATCH
  );
}

export function hasDownloadableReceipt(enrollment: ExamEnrollment): boolean {
  const paymentStatus = Number(enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS);
  if (
    paymentStatus === TRANSACTION_PAYMENT_STATUS.REFUND ||
    paymentStatus === TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED
  ) {
    return false;
  }
  const receipts = enrollment.TRANSACTION?.RECEIPTS ?? [];
  const hasVoided = receipts.some((receipt) => receipt.RC_STATUS === ReceiptStatus.VOIDED);
  if (hasVoided) return false;

  const primaryReceipt = receipts[0];
  const hasValidReceipt = Boolean(
    primaryReceipt?.RC_VERIFY_CODE &&
      Number(primaryReceipt?.RC_STATUS) === ReceiptStatus.ISSUED,
  );
  if (!hasValidReceipt) return false;

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
  const isPaymentVerified = hasMatchedPayment(enrollment);
  const canDownloadReceipt = hasDownloadableReceipt(enrollment);
  const seatLabel = enrollment.ERM_SEAT_LABEL?.trim() || undefined;

  if (Number(enrollment.ERM_STATUS) === ENROLLMENT_STATUS.UNPAID) {
    const registrationStatus = buildBadge('exam.status.pending', 'warning');
    const item: ExamHistoryItem = {
      ...base,
      category: 'pending',
      registrationStatus,
      status: registrationStatus.label,
      statusType: registrationStatus.type,
      actions: ['cancel', 'pay'],
    };
    const payEndDate = enrollment.SESSION?.EXAM?.EXAM_PAY_END_DATE;
    if (payEndDate) {
      item.payByDate =
        typeof payEndDate === 'string' ? payEndDate : new Date(payEndDate).toISOString();
    }

    const sessionExpiresAt = enrollment.TRANSACTION?.TRANX_EXPIRES_AT;
    const paymentStatus = enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS;
    if (
      sessionExpiresAt &&
      Number(paymentStatus) === TRANSACTION_PAYMENT_STATUS.PENDING &&
      new Date(sessionExpiresAt).getTime() > Date.now()
    ) {
      item.deadline =
        typeof sessionExpiresAt === 'string'
          ? sessionExpiresAt
          : new Date(sessionExpiresAt).toISOString();
    }
    return item;
  }

  if (enrollment.ERM_STATUS === ENROLLMENT_STATUS.PAID) {
    const registrationStatus = buildBadge(
      isPaymentVerified ? 'exam.status.verified' : 'exam.status.verifying',
      isPaymentVerified ? 'success' : 'info',
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

  if (Number(enrollment.ERM_STATUS) === ENROLLMENT_STATUS.CANCELLED) {
    const paymentStatus = Number(enrollment.TRANSACTION?.TRANX_PAYMENT_STATUS);
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

    const isPaymentTimeout = isPaymentTimeoutCancellation(
      enrollment,
      context.getCancellationReason,
    );
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
