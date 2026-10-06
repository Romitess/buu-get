import { readFileSync } from 'fs';
import { join } from 'path';
import { PDFDocument, PDFFont, PDFPage, RGB, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import QRCode from 'qrcode';

export interface CertificateScoreLinePdf {
  nameEn: string;
  score: number;
  maxScore: number;
}

export interface CertificateBandRulePdf {
  band: string;
  minScore: number;
  maxScore: number;
  cefr: string;
  descriptor: string;
}

export interface CertificatePdfContent {
  fullName: string;
  testTakerId: string;
  nationalId: string;
  testSession: string;
  testDate: string;
  scoreLines: CertificateScoreLinePdf[];
  totalScore: string;
  bandLevel: string;
  reportIssueDate: string;
  scoreValidUntil: string;
  certificateCode: string;
  verifyUrl: string;
  photoBytes?: Uint8Array | null;
  bandRules: CertificateBandRulePdf[];
}

const NAVY = rgb(16 / 255, 74 / 255, 142 / 255);
const MUTED = rgb(0.44, 0.44, 0.44);
const INK = rgb(0.12, 0.14, 0.16);
const LINE = rgb(0.8, 0.84, 0.88);
const CARD = rgb(0.973, 0.976, 0.98);

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

let regularBytes: Uint8Array | null = null;
let boldBytes: Uint8Array | null = null;

function fontBytes(fileName: string): Uint8Array {
  const filePath = join(__dirname, '../../assets/fonts', fileName);
  return new Uint8Array(readFileSync(filePath));
}

function regularFontBytes(): Uint8Array {
  regularBytes ??= fontBytes('Sarabun-Regular.ttf');
  return regularBytes;
}

function boldFontBytes(): Uint8Array {
  boldBytes ??= fontBytes('Sarabun-Bold.ttf');
  return boldBytes;
}

export function buildCertificateVerifyUrl(
  baseUrl: string,
  code: string,
): string {
  const base = (baseUrl.trim() || 'http://localhost:9000').replace(/\/$/, '');
  return `${base}/#/v/c/${encodeURIComponent(code)}`;
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const source = text.replace(/\s+/g, ' ').trim();
  if (!source) {
    return [''];
  }
  const words = source.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      continue;
    }
    let chunk = '';
    for (const char of word) {
      const trial = chunk + char;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        chunk = trial;
      } else {
        if (chunk) {
          lines.push(chunk);
        }
        chunk = char;
      }
    }
    current = chunk;
  }
  if (current) {
    lines.push(current);
  }
  return lines.length > 0 ? lines : [''];
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
): void {
  page.drawText(text, { x, y, size, font, color });
}

export async function buildCertificatePdf(
  content: CertificatePdfContent,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const regular = await pdfDoc.embedFont(regularFontBytes(), { subset: true });
  const bold = await pdfDoc.embedFont(boldFontBytes(), { subset: true });
  const qrPng = await QRCode.toBuffer(content.verifyUrl, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 180,
  });
  const qrImage = await pdfDoc.embedPng(qrPng);

  await drawFrontPage(pdfDoc, content, regular, bold, qrImage);
  drawBackPage(pdfDoc, content, regular, bold);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

async function drawFrontPage(
  pdfDoc: PDFDocument,
  content: CertificatePdfContent,
  regular: PDFFont,
  bold: PDFFont,
  qrImage: Awaited<ReturnType<PDFDocument['embedPng']>>,
): Promise<void> {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const margin = 36;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: PAGE_WIDTH - margin * 2,
    height: PAGE_HEIGHT - margin * 2,
    borderColor: LINE,
    borderWidth: 1.2,
    color: CARD,
  });

  let y = PAGE_HEIGHT - 78;
  drawText(
    page,
    "BUU-GET: Burapha University's Graduate English Test",
    margin + 24,
    y,
    13,
    bold,
    NAVY,
  );
  y -= 18;
  drawText(page, 'Test Taker Score Report', margin + 24, y, 11, regular, MUTED);

  y -= 28;
  page.drawLine({
    start: { x: margin + 16, y },
    end: { x: PAGE_WIDTH - margin - 16, y },
    thickness: 1,
    color: LINE,
  });

  y -= 36;
  const photoSize = 92;
  const photoX = margin + 28;
  const photoY = y - photoSize;
  page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoSize,
    height: photoSize,
    borderColor: LINE,
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  if (content.photoBytes && content.photoBytes.length > 0) {
    await embedPhoto(
      pdfDoc,
      page,
      content.photoBytes,
      photoX,
      photoY,
      photoSize,
    );
  }

  const infoX = photoX + photoSize + 24;
  const rows: Array<[string, string]> = [
    ['Test Taker ID', content.testTakerId || '-'],
    ['Citizen ID', content.nationalId || '-'],
    ['Test Session', content.testSession || '-'],
    ['Test Date', content.testDate || '-'],
  ];
  let infoY = y - 4;
  for (const [label, value] of rows) {
    drawText(page, label, infoX, infoY, 9, regular, MUTED);
    drawText(page, value, infoX + 110, infoY, 11, bold, INK);
    infoY -= 22;
  }

  const nameLines = wrapText(content.fullName || '-', bold, 11, photoSize + 8);
  let nameY = photoY - 16;
  for (const line of nameLines.slice(0, 3)) {
    drawText(page, line, photoX, nameY, 11, bold, INK);
    nameY -= 14;
  }

  y = Math.min(photoY, nameY) - 28;
  drawText(page, 'Score', margin + 28, y, 12, bold, NAVY);
  y -= 8;
  page.drawLine({
    start: { x: margin + 24, y },
    end: { x: PAGE_WIDTH - margin - 24, y },
    thickness: 0.6,
    color: LINE,
  });
  y -= 20;

  const lines =
    content.scoreLines.length > 0
      ? content.scoreLines
      : [{ nameEn: 'Score', score: 0, maxScore: 0 }];
  lines.forEach((line, index) => {
    const label = `${index + 1}. ${line.nameEn}`;
    drawText(page, label, margin + 28, y, 11, regular, INK);
    drawText(
      page,
      `${formatScore(line.score)}/${formatScore(line.maxScore)}`,
      PAGE_WIDTH - margin - 90,
      y,
      11,
      regular,
      INK,
    );
    y -= 18;
  });

  drawText(page, 'Overall BUU-GET Score', margin + 28, y, 11, bold, INK);
  drawText(
    page,
    content.totalScore || '-',
    PAGE_WIDTH - margin - 90,
    y,
    11,
    bold,
    INK,
  );
  y -= 16;
  page.drawLine({
    start: { x: margin + 24, y },
    end: { x: PAGE_WIDTH - margin - 24, y },
    thickness: 0.6,
    color: LINE,
  });
  y -= 20;
  drawText(page, 'Level', margin + 28, y, 11, regular, INK);
  drawText(page, 'Band', margin + 160, y, 11, regular, INK);
  drawText(page, content.bandLevel || '-', margin + 250, y, 12, bold, INK);

  const footerY = margin + 48;
  drawText(
    page,
    'Report Issue Date',
    margin + 28,
    footerY + 16,
    9,
    regular,
    MUTED,
  );
  drawText(
    page,
    content.reportIssueDate || '-',
    margin + 28,
    footerY,
    11,
    bold,
    INK,
  );
  drawText(
    page,
    'Score Valid Until',
    margin + 190,
    footerY + 16,
    9,
    regular,
    MUTED,
  );
  drawText(
    page,
    content.scoreValidUntil || '-',
    margin + 190,
    footerY,
    11,
    bold,
    INK,
  );

  const qrSize = 72;
  page.drawImage(qrImage, {
    x: PAGE_WIDTH - margin - qrSize - 20,
    y: margin + 36,
    width: qrSize,
    height: qrSize,
  });
  const code = content.certificateCode || '';
  const codeWidth = regular.widthOfTextAtSize(code, 8);
  drawText(
    page,
    code,
    PAGE_WIDTH - margin - 20 - qrSize + (qrSize - codeWidth) / 2,
    margin + 22,
    8,
    regular,
    MUTED,
  );
}

async function embedPhoto(
  pdfDoc: PDFDocument,
  page: PDFPage,
  bytes: Uint8Array,
  x: number,
  y: number,
  size: number,
): Promise<void> {
  try {
    const image = isJpeg(bytes)
      ? await pdfDoc.embedJpg(bytes)
      : await pdfDoc.embedPng(bytes);
    page.drawImage(image, { x, y, width: size, height: size });
  } catch {
    // รูปโปรไฟล์ที่อ่านไม่ได้ไม่ทำให้ทั้งใบประกาศล้ม
  }
}

function drawBackPage(
  pdfDoc: PDFDocument,
  content: CertificatePdfContent,
  regular: PDFFont,
  bold: PDFFont,
): void {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const margin = 36;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: PAGE_WIDTH - margin * 2,
    height: PAGE_HEIGHT - margin * 2,
    borderColor: LINE,
    borderWidth: 1.2,
    color: CARD,
  });

  let y = PAGE_HEIGHT - 78;
  const title = 'BUU GET Band Description';
  const titleWidth = bold.widthOfTextAtSize(title, 14);
  drawText(page, title, (PAGE_WIDTH - titleWidth) / 2, y, 14, bold, INK);

  y -= 28;
  const columns = [
    { label: 'Band', x: margin + 24, width: 40 },
    { label: 'Score', x: margin + 70, width: 70 },
    { label: 'CEFR', x: margin + 150, width: 50 },
    { label: 'Performance Descriptor', x: margin + 210, width: 300 },
  ];
  for (const column of columns) {
    drawText(page, column.label, column.x, y, 10, bold, NAVY);
  }
  y -= 8;
  page.drawLine({
    start: { x: margin + 20, y },
    end: { x: PAGE_WIDTH - margin - 20, y },
    thickness: 0.8,
    color: LINE,
  });
  y -= 18;

  const rules = content.bandRules;
  if (rules.length === 0) {
    drawText(
      page,
      'No band descriptions defined',
      margin + 24,
      y,
      11,
      regular,
      MUTED,
    );
  }

  for (const rule of rules) {
    if (y < margin + 70) {
      break;
    }
    const descriptorLines = wrapText(
      rule.descriptor || '-',
      regular,
      9,
      columns[3].width,
    ).slice(0, 4);
    drawText(page, rule.band || '-', columns[0].x, y, 10, bold, INK);
    drawText(
      page,
      `${formatScore(rule.minScore)}-${formatScore(rule.maxScore)}`,
      columns[1].x,
      y,
      10,
      regular,
      INK,
    );
    drawText(page, rule.cefr || '-', columns[2].x, y, 10, regular, INK);
    descriptorLines.forEach((line, index) => {
      drawText(page, line, columns[3].x, y - index * 12, 9, regular, INK);
    });
    y -= Math.max(18, descriptorLines.length * 12 + 6);
  }

  const note =
    'The performance descriptor is taken from CEFR Overall Reading Comprehension Scale';
  const noteLines = wrapText(note, regular, 9, PAGE_WIDTH - margin * 2 - 48);
  let noteY = margin + 28;
  for (const line of noteLines) {
    drawText(page, line, margin + 24, noteY, 9, regular, MUTED);
    noteY -= 12;
  }
}

function formatScore(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  return Number.isInteger(value) ? String(value) : String(value);
}
