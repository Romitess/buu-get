import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  buildReceiptPdf,
  type ReceiptPdfContent,
} from './build-receipt-pdf.util';

export interface ReceiptPdfWithSignatureContent extends ReceiptPdfContent {
  collectorName: string;
  /** data URL หรือ raw base64 ของรูปลายเซ็น */
  signatureBase64: string;
}

function decodeSignatureBytes(signatureBase64: string): Uint8Array {
  const match = /^data:image\/[\w.+-]+;base64,(.+)$/s.exec(signatureBase64);
  const b64 = (match?.[1] ?? signatureBase64).replace(/\s/g, '');
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

/**
 * สร้างใบเสร็จด้วย format เดิม แล้วแปะรูปลายเซ็น e-sign ลงท้ายหน้า
 */
export async function buildReceiptPdfWithSignature(
  content: ReceiptPdfWithSignatureContent,
): Promise<Buffer> {
  const basePdf = buildReceiptPdf({
    organizationNameTh: content.organizationNameTh,
    organizationNameEn: content.organizationNameEn,
    receiptNo: content.receiptNo,
    issuedAt: content.issuedAt,
    payerName: content.payerName,
    taxId: content.taxId,
    amount: content.amount,
    description: content.description,
    examRound: content.examRound,
    examDate: content.examDate,
    verifyCode: content.verifyCode,
  });

  const pdfDoc = await PDFDocument.load(basePdf);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  if (!page) {
    return basePdf;
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const left = 50;
  let y = 220;

  page.drawText('Collector / Receiver', {
    x: left,
    y,
    size: 11,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 16;

  const collectorLabel = `( ${content.collectorName || '-'} )`;
  // Helvetica ไม่รองรับไทย — ชื่อผู้รับเงินอาจเป็น ASCII จาก e-sign
  const safeCollector = collectorLabel.replace(/[^\x20-\x7E]/g, '?');
  page.drawText(safeCollector, {
    x: left,
    y,
    size: 10,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 12;

  try {
    const bytes = decodeSignatureBytes(content.signatureBase64);
    const image = isJpeg(bytes)
      ? await pdfDoc.embedJpg(bytes)
      : await pdfDoc.embedPng(bytes);
    const maxW = 160;
    const maxH = 70;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const sigW = image.width * scale;
    const sigH = image.height * scale;
    y -= sigH + 4;
    page.drawImage(image, {
      x: left,
      y: Math.max(40, y),
      width: sigW,
      height: sigH,
    });
  } catch {
    page.drawText('[signature image unavailable]', {
      x: left,
      y: Math.max(40, y - 14),
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
