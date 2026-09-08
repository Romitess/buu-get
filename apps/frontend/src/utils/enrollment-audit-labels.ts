import { EnrollmentStatus } from 'src/types/enrollment.types';
import { TRANSACTION_PAYMENT_STATUS } from 'src/constants/exam';
import type {
  EnrollmentAuditEvent,
  EnrollmentAuditPayment,
} from 'src/types/enrollment-audit.types';

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

export interface AuditDetailLine {
  label: string;
  value: string;
}

const ENROLLMENT_STATUS_I18N: Record<number, string> = {
  [EnrollmentStatus.UNPAID]: 'admin.applicantAudit.status.unpaid',
  [EnrollmentStatus.PAID]: 'admin.applicantAudit.status.paid',
  [EnrollmentStatus.SEAT_ASSIGNED]: 'admin.applicantAudit.status.seatAssigned',
  [EnrollmentStatus.SEAT_PUBLISHED]: 'admin.applicantAudit.status.seatPublished',
  [EnrollmentStatus.ATTENDED]: 'admin.applicantAudit.status.attended',
  [EnrollmentStatus.CANCELLED]: 'admin.applicantAudit.status.cancelled',
  [EnrollmentStatus.MISSING]: 'admin.applicantAudit.status.missing',
};

const PAYMENT_STATUS_I18N: Record<number, string> = {
  [TRANSACTION_PAYMENT_STATUS.PENDING]: 'admin.applicantAudit.paymentStatus.pending',
  [TRANSACTION_PAYMENT_STATUS.APPROVED]: 'admin.applicantAudit.paymentStatus.approved',
  [TRANSACTION_PAYMENT_STATUS.REJECTED]: 'admin.applicantAudit.paymentStatus.rejected',
  [TRANSACTION_PAYMENT_STATUS.PAID]: 'admin.applicantAudit.paymentStatus.paid',
  [TRANSACTION_PAYMENT_STATUS.PAYMENT_FAILED]:
    'admin.applicantAudit.paymentStatus.paymentFailed',
  [TRANSACTION_PAYMENT_STATUS.EXPIRED]: 'admin.applicantAudit.paymentStatus.expired',
  [TRANSACTION_PAYMENT_STATUS.REVERSED]: 'admin.applicantAudit.paymentStatus.reversed',
  [TRANSACTION_PAYMENT_STATUS.REFUND]: 'admin.applicantAudit.paymentStatus.refund',
  [TRANSACTION_PAYMENT_STATUS.RECEIPT_VOIDED]:
    'admin.applicantAudit.paymentStatus.receiptVoided',
};

const parseStatusCode = (value: string | null | undefined): number | null => {
  if (value == null || String(value).trim() === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const translateOrFallback = (t: TranslateFn, key: string, fallback: string): string => {
  const translated = t(key);
  return translated === key ? fallback : translated;
};

/** Map raw status code to a human-readable label for enrollment or payment events. */
export const formatAuditStatusLabel = (
  raw: string | null | undefined,
  category: string,
  t: TranslateFn,
): string => {
  if (raw == null || String(raw).trim() === '') return '';

  const code = parseStatusCode(raw);
  if (code == null) return String(raw);

  const isPayment = category === 'payment';
  const key = isPayment ? PAYMENT_STATUS_I18N[code] : ENROLLMENT_STATUS_I18N[code];
  if (!key) return String(raw);

  return translateOrFallback(t, key, String(raw));
};

/** e.g. "เปลี่ยนเป็น รอชำระเงิน" or "จาก รอชำระเงิน เป็น ชำระเงินแล้ว" */
export const formatAuditStatusTransition = (
  event: Pick<EnrollmentAuditEvent, 'fromStatus' | 'toStatus' | 'category'>,
  t: TranslateFn,
): string => {
  const fromLabel = formatAuditStatusLabel(event.fromStatus, event.category, t);
  const toLabel = formatAuditStatusLabel(event.toStatus, event.category, t);

  if (fromLabel && toLabel) {
    return t('admin.applicantAudit.statusTransition.fromTo', {
      from: fromLabel,
      to: toLabel,
    });
  }
  if (toLabel) {
    return t('admin.applicantAudit.statusTransition.toOnly', { status: toLabel });
  }
  if (fromLabel) {
    return fromLabel;
  }
  return '';
};

/** Format amount as Thai Baht for audit timeline detail lines. */
export const formatAuditAmount = (amount: number | null | undefined): string => {
  if (amount == null || !Number.isFinite(Number(amount))) return '';
  return `${Number(amount).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} THB`;
};

const pushLine = (
  lines: AuditDetailLine[],
  label: string,
  value: string | null | undefined,
): void => {
  if (value == null) return;
  const trimmed = String(value).trim();
  if (!trimmed) return;
  lines.push({ label, value: trimmed });
};

const formatSessionRange = (
  start: string | null | undefined,
  end: string | null | undefined,
): string => {
  if (start && end) return `${start}–${end}`;
  return start || end || '';
};

const truncateQr = (qr: string): string =>
  qr.length > 24 ? `${qr.slice(0, 12)}…${qr.slice(-8)}` : qr;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const stringifyProfileValue = (value: unknown): string => {
  if (value == null) return '—';
  if (typeof value === 'string') return value || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/** Build label:value detail lines from context, payment, and known payload fields. */
export const buildAuditEventDetailLines = (
  event: EnrollmentAuditEvent,
  t: TranslateFn,
  options?: { formatDateTime?: (iso: string) => string },
): AuditDetailLine[] => {
  const lines: AuditDetailLine[] = [];
  const formatDateTime = options?.formatDateTime ?? ((iso: string) => iso);
  const ctx = event.context;
  const payment: EnrollmentAuditPayment | null | undefined = event.payment;
  const payload = event.payload ?? {};

  pushLine(lines, t('admin.applicantAudit.detail.examName'), ctx?.examName);
  pushLine(lines, t('admin.applicantAudit.detail.examRound'), ctx?.examRound);
  pushLine(lines, t('admin.applicantAudit.detail.examDate'), ctx?.examDate);
  pushLine(
    lines,
    t('admin.applicantAudit.detail.sessionTime'),
    formatSessionRange(ctx?.sessionStart, ctx?.sessionEnd),
  );

  const amount =
    payment?.amount ??
    (typeof payload.amount === 'number'
      ? payload.amount
      : typeof payload.amount === 'string'
        ? Number(payload.amount)
        : null);
  pushLine(lines, t('admin.applicantAudit.detail.amount'), formatAuditAmount(amount));

  if (payment) {
    pushLine(lines, t('admin.applicantAudit.detail.tranxId'), String(payment.tranxId));
    if (payment.qrCode) {
      pushLine(lines, t('admin.applicantAudit.detail.qrCode'), truncateQr(payment.qrCode));
    }
    if (payment.expiresAt) {
      pushLine(
        lines,
        t('admin.applicantAudit.detail.expiresAt'),
        formatDateTime(payment.expiresAt),
      );
    }
    if (payment.paidAt) {
      pushLine(lines, t('admin.applicantAudit.detail.paidAt'), formatDateTime(payment.paidAt));
    }
    pushLine(lines, t('admin.applicantAudit.detail.receiptNo'), payment.receiptNo);
  }

  if (typeof payload.reason === 'string' && payload.reason.trim()) {
    pushLine(lines, t('admin.applicantAudit.detail.reason'), payload.reason);
  }

  if (event.source === 'profile' || event.category === 'profile') {
    const oldValues = asRecord(payload.oldValues);
    const newValues = asRecord(payload.newValues);
    const keys = new Set([
      ...Object.keys(oldValues ?? {}),
      ...Object.keys(newValues ?? {}),
    ]);
    for (const key of keys) {
      const from = stringifyProfileValue(oldValues?.[key]);
      const to = stringifyProfileValue(newValues?.[key]);
      if (from === to && from === '—') continue;
      lines.push({
        label: key,
        value: t('admin.applicantAudit.detail.profileChange', { from, to }),
      });
    }
  }

  return lines;
};
