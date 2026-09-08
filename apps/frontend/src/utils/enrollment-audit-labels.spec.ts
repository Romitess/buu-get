import { describe, expect, it } from 'vitest';
import {
  buildAuditEventDetailLines,
  formatAuditAmount,
  formatAuditStatusTransition,
} from './enrollment-audit-labels';
import type { EnrollmentAuditEvent } from 'src/types/enrollment-audit.types';

const t = (key: string, values?: Record<string, unknown>): string => {
  const map: Record<string, string> = {
    'admin.applicantAudit.status.unpaid': 'รอชำระเงิน',
    'admin.applicantAudit.status.paid': 'ชำระเงินแล้ว',
    'admin.applicantAudit.status.cancelled': 'ยกเลิก',
    'admin.applicantAudit.paymentStatus.pending': 'รอชำระ',
    'admin.applicantAudit.paymentStatus.paid': 'ชำระแล้ว',
    'admin.applicantAudit.paymentStatus.expired': 'หมดเวลาชำระ',
    'admin.applicantAudit.statusTransition.toOnly': `เปลี่ยนเป็น ${String(values?.status ?? '')}`,
    'admin.applicantAudit.statusTransition.fromTo': `จาก ${String(values?.from ?? '')} เป็น ${String(values?.to ?? '')}`,
    'admin.applicantAudit.detail.examName': 'ชื่อการสอบ',
    'admin.applicantAudit.detail.examRound': 'ครั้งที่',
    'admin.applicantAudit.detail.examDate': 'วันสอบ',
    'admin.applicantAudit.detail.sessionTime': 'เวลาสอบ',
    'admin.applicantAudit.detail.amount': 'จำนวนเงิน',
    'admin.applicantAudit.detail.tranxId': 'รหัสรายการชำระ',
    'admin.applicantAudit.detail.qrCode': 'QR',
    'admin.applicantAudit.detail.expiresAt': 'หมดอายุ',
    'admin.applicantAudit.detail.paidAt': 'ชำระเมื่อ',
    'admin.applicantAudit.detail.receiptNo': 'เลขที่ใบเสร็จ',
    'admin.applicantAudit.detail.reason': 'เหตุผล',
    'admin.applicantAudit.detail.profileChange': `${String(values?.from ?? '')} → ${String(values?.to ?? '')}`,
  };
  return map[key] ?? key;
};

describe('enrollment-audit-labels', () => {
  it('formats enrollment create as human-readable to-only status', () => {
    const event: Pick<EnrollmentAuditEvent, 'fromStatus' | 'toStatus' | 'category'> = {
      fromStatus: null,
      toStatus: '0',
      category: 'enrollment',
    };

    expect(formatAuditStatusTransition(event, t)).toBe('เปลี่ยนเป็น รอชำระเงิน');
  });

  it('formats enrollment status change from → to', () => {
    const event: Pick<EnrollmentAuditEvent, 'fromStatus' | 'toStatus' | 'category'> = {
      fromStatus: '0',
      toStatus: '1',
      category: 'enrollment',
    };

    expect(formatAuditStatusTransition(event, t)).toBe('จาก รอชำระเงิน เป็น ชำระเงินแล้ว');
  });

  it('formats payment status with payment labels', () => {
    const event: Pick<EnrollmentAuditEvent, 'fromStatus' | 'toStatus' | 'category'> = {
      fromStatus: '0',
      toStatus: '5',
      category: 'payment',
    };

    expect(formatAuditStatusTransition(event, t)).toBe('จาก รอชำระ เป็น หมดเวลาชำระ');
  });

  it('formats amount as THB', () => {
    expect(formatAuditAmount(500)).toBe('500 THB');
    expect(formatAuditAmount(null)).toBe('');
  });

  it('builds detail lines from context and payment', () => {
    const event: EnrollmentAuditEvent = {
      id: 'tsh-1',
      source: 'transaction',
      eventType: 'PAYMENT_STATUS_CHANGED',
      category: 'payment',
      occurredAt: '2026-09-08T09:00:00.000Z',
      fromStatus: '0',
      toStatus: '3',
      actor: { type: 'system', userId: null, name: null },
      message: 'Payment confirmed',
      payload: null,
      ref: { type: 'TRANX', id: 99 },
      context: {
        examId: 3,
        examName: 'BUU-GET',
        examRound: '1/2569',
        examFiscalYear: '2569',
        examDate: '2026-09-15',
        examFee: 500,
        sessionId: 7,
        sessionStart: '09:00',
        sessionEnd: '12:00',
        seatLabel: null,
        testTakerCode: null,
      },
      payment: {
        tranxId: 99,
        amount: 500,
        qrCode: 'QR',
        expiresAt: null,
        paidAt: null,
        channel: 1,
        receiptNo: 'RC-1',
        receiptStatus: 1,
      },
    };

    const lines = buildAuditEventDetailLines(event, t);
    expect(lines).toEqual(
      expect.arrayContaining([
        { label: 'ชื่อการสอบ', value: 'BUU-GET' },
        { label: 'ครั้งที่', value: '1/2569' },
        { label: 'เวลาสอบ', value: '09:00–12:00' },
        { label: 'จำนวนเงิน', value: '500 THB' },
        { label: 'รหัสรายการชำระ', value: '99' },
        { label: 'เลขที่ใบเสร็จ', value: 'RC-1' },
      ]),
    );
  });

  it('builds profile diff lines and skips empty fields', () => {
    const event: EnrollmentAuditEvent = {
      id: 'profile-1',
      source: 'profile',
      eventType: 'PROFILE_UPDATED',
      category: 'profile',
      occurredAt: '2026-09-08T07:00:00.000Z',
      fromStatus: null,
      toStatus: null,
      actor: { type: 'candidate', userId: 1, name: 'A' },
      message: 'แก้ไข',
      payload: {
        oldValues: { address: 'old' },
        newValues: { address: 'new' },
      },
      ref: null,
      context: {
        examId: null,
        examName: null,
        examRound: null,
        examFiscalYear: null,
        examDate: null,
        examFee: null,
        sessionId: null,
        sessionStart: null,
        sessionEnd: null,
        seatLabel: null,
        testTakerCode: null,
      },
    };

    const lines = buildAuditEventDetailLines(event, t);
    expect(lines).toEqual([{ label: 'address', value: 'old → new' }]);
  });
});
