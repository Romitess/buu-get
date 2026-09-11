/**
 * รหัสสมาชิก / รหัสรอบสอบ สำหรับ REF1–REF2 (Bill Payment)
 *
 * USER_CODE (REF1): {ปีงบ พ.ศ. 4}{1 ไทย|2 ต่างชาติ}{รัน 5 หลัก} เช่น 2569200001
 * SESSION_CODE (REF2): {1 ทั่วไป|2 พิเศษ}{ปีงบ ค.ศ. 4}{รัน 3 หลัก} เช่น 22026001
 */

import { EXAM_TYPE } from '../../modules/exam/constants/exam.constants';

export type PersonTypeCode = '1' | '2';
export type ExamTypeCode = '1' | '2';

const BE_OFFSET = 543;

/** ปีงบไทย: 1 ต.ค. – 30 ก.ย. → คืนปี ค.ศ. ของปีงบ */
export function getThaiFiscalYearAd(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based; Oct = 9
  return month >= 9 ? year + 1 : year;
}

/** ปีงบ พ.ศ. 4 หลัก */
export function getThaiFiscalYearBe(date: Date = new Date()): number {
  return getThaiFiscalYearAd(date) + BE_OFFSET;
}

/** 1 = ไทย (มีบัตรประชาชน), 2 = ต่างชาติ */
export function resolvePersonTypeCode(
  nationalId: string | null | undefined,
  passportNo: string | null | undefined,
): PersonTypeCode {
  if (nationalId && nationalId.trim() !== '') {
    return '1';
  }
  if (passportNo && passportNo.trim() !== '') {
    return '2';
  }
  // fallback: ไม่มีทั้งคู่ ถือเป็นต่างชาติ (ไม่บังคับบัตร)
  return '2';
}

/** 1 = รอบทั่วไป, 2 = รอบพิเศษ */
export function resolveExamTypeCode(
  examType: string | null | undefined,
): ExamTypeCode {
  const normalized = (examType ?? '').trim();
  if (
    normalized === EXAM_TYPE.SPECIAL ||
    normalized === '2' ||
    /พิเศษ/i.test(normalized)
  ) {
    return '2';
  }
  return '1';
}

/**
 * แปลงปีงบจาก EXAM_FISCAL_YEAR → ค.ศ. 4 หลัก
 * รองรับค่าที่เก็บเป็น ค.ศ. (2026) หรือ พ.ศ. (2569)
 */
export function normalizeFiscalYearAd(
  fiscalYear: string | null | undefined,
  fallbackDate: Date = new Date(),
): string {
  const raw = (fiscalYear ?? '').trim();
  if (/^\d{4}$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n >= 2400) {
      return String(n - BE_OFFSET);
    }
    return raw;
  }
  return String(getThaiFiscalYearAd(fallbackDate));
}

export function formatUserCode(
  fiscalYearBe: string | number,
  personType: PersonTypeCode,
  runningNo: number,
): string {
  if (runningNo < 1 || runningNo > 99999) {
    throw new Error('USER_CODE running number must be 1..99999');
  }
  return `${fiscalYearBe}${personType}${String(runningNo).padStart(5, '0')}`;
}

export function formatSessionCode(
  examType: ExamTypeCode,
  fiscalYearAd: string | number,
  runningNo: number,
): string {
  if (runningNo < 1 || runningNo > 999) {
    throw new Error('SESSION_CODE running number must be 1..999');
  }
  return `${examType}${fiscalYearAd}${String(runningNo).padStart(3, '0')}`;
}
