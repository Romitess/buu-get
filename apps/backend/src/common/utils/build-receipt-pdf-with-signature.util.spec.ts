import { buildReceiptPdf } from './build-receipt-pdf.util';
import { buildReceiptPdfWithSignature } from './build-receipt-pdf-with-signature.util';

/** 1x1 transparent PNG */
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const baseContent = {
  organizationNameTh: 'มหาวิทยาลัยบูรพา',
  organizationNameEn: 'BURAPHA UNIVERSITY',
  receiptNo: '256900001',
  issuedAt: '2026-07-15T10:00:00.000Z',
  payerName: 'Somchai Test',
  taxId: '1234567890123',
  amount: '500.00',
  description: 'BUU-GET exam fee',
  examRound: '1',
  examDate: '2026-08-01',
  verifyCode: 'ABCDEFGH12345678',
};

describe('buildReceiptPdfWithSignature', () => {
  it('should reuse original receipt body and embed signature image', async () => {
    const basePdf = buildReceiptPdf(baseContent);
    const pdf = await buildReceiptPdfWithSignature({
      ...baseContent,
      collectorName: 'Finance Officer',
      signatureBase64: TINY_PNG_DATA_URL,
    });

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(basePdf.byteLength);

    const asLatin1 = pdf.toString('latin1');
    // เนื้อหา format เดิมยังอยู่
    expect(asLatin1).toContain('BURAPHA UNIVERSITY');
    expect(asLatin1).toContain('256900001');
    // ฝังภาพลายเซ็นแล้ว
    expect(asLatin1).toContain('/Subtype /Image');
  });
});
