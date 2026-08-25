/**
 * Minimal single-page PDF builder (no external PDF library).
 * Uses Helvetica — ASCII renders reliably; non-Latin labels are stored as
 * UTF-16BE so Thai text remains in the file even when glyphs are missing.
 */

export interface ReceiptPdfContent {
  organizationNameTh: string;
  organizationNameEn: string;
  receiptNo: string;
  issuedAt: string;
  payerName: string;
  taxId: string | null;
  amount: string;
  description: string;
  examRound: string | null;
  examDate: string | null;
  verifyCode: string;
}

function escapePdfLiteral(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Prefer literal () for ASCII-only; otherwise UTF-16BE hex with BOM. */
function pdfTextOperand(text: string): string {
  const isAscii = /^[\x20-\x7E]*$/.test(text);
  if (isAscii) {
    return `(${escapePdfLiteral(text)})`;
  }
  const units: number[] = [0xfeff];
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (cp > 0xffff) {
      const offset = cp - 0x10000;
      units.push(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    } else {
      units.push(cp);
    }
  }
  const hex = units.map((u) => u.toString(16).padStart(4, '0')).join('');
  return `<${hex}>`;
}

interface ReceiptPdfRow {
  label: string;
  value: string;
}

/**
 * Build a valid PDF 1.4 buffer for an issued receipt.
 */
export function buildReceiptPdf(content: ReceiptPdfContent): Buffer {
  const headerLines: string[] = [
    content.organizationNameTh,
    content.organizationNameEn,
    'ใบเสร็จรับเงิน / Receipt',
  ];

  const rows: ReceiptPdfRow[] = [
    { label: 'เลขที่ใบเสร็จ / Receipt No', value: content.receiptNo },
    { label: 'วันที่ออก / Issued At', value: content.issuedAt },
    { label: 'ชื่อผู้ชำระ / Payer', value: content.payerName || '-' },
    {
      label: 'เลขประจำตัวผู้เสียภาษี / Tax ID',
      value: content.taxId || '-',
    },
    { label: 'จำนวนเงิน / Amount', value: content.amount },
    { label: 'รายการ / Description', value: content.description },
    { label: 'รอบสอบ / Exam Round', value: content.examRound || '-' },
    { label: 'วันสอบ / Exam Date', value: content.examDate || '-' },
    { label: 'รหัสตรวจสอบ / Verify Code', value: content.verifyCode },
  ];

  const contentLines: string[] = ['BT', '/F1 11 Tf', '50 780 Td', '16 TL'];
  let first = true;

  const writeLine = (parts: string[]): void => {
    if (!first) {
      contentLines.push('T*');
    }
    first = false;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === undefined) continue;
      if (i > 0) {
        contentLines.push(`${pdfTextOperand(' ')} Tj`);
      }
      contentLines.push(`${pdfTextOperand(part)} Tj`);
    }
  };

  for (const line of headerLines) {
    writeLine([line]);
  }
  writeLine(['']);
  for (const row of rows) {
    writeLine([`${row.label}:`, row.value]);
  }

  contentLines.push('ET');
  const stream = contentLines.join('\n');
  const streamLength = Buffer.byteLength(stream, 'utf8');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}
