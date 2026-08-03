/**
 * สีพื้นหลังตามประเภทผู้เข้าสอบ (สถานะทางกายภาพ / หมายเหตุ)
 * ชาวไทย และชาวต่างชาติใช้สีน้ำเงินเดียวกัน
 */
export const PHYSICAL_STATUS_BG_COLORS = {
  MONK: '#F57C00',
  RELIGIOUS: '#7B1FA2',
  DISABLED: '#0288D1',
  PREGNANT: '#C2185B',
  DISABLED_TYPO: '#388E3C',
  /** ทั่วไป / ชาวไทย / ชาวต่างชาติ */
  GENERAL: '#1E89E5',
} as const;

export const DEFAULT_PHYSICAL_STATUS_BG_COLOR = PHYSICAL_STATUS_BG_COLORS.GENERAL;

const COLOR_BY_CODE: Record<number, string> = {
  0: PHYSICAL_STATUS_BG_COLORS.MONK,
  1: PHYSICAL_STATUS_BG_COLORS.RELIGIOUS,
  2: PHYSICAL_STATUS_BG_COLORS.DISABLED,
  3: PHYSICAL_STATUS_BG_COLORS.PREGNANT,
  4: PHYSICAL_STATUS_BG_COLORS.DISABLED_TYPO,
  5: PHYSICAL_STATUS_BG_COLORS.GENERAL,
};

const COLOR_BY_REMARK: Record<string, string> = {
  'พระภิกษุ / สามเณร': PHYSICAL_STATUS_BG_COLORS.MONK,
  'นักบวช / ศาสนบุคคล': PHYSICAL_STATUS_BG_COLORS.RELIGIOUS,
  บุคคลทุพพลภาพ: PHYSICAL_STATUS_BG_COLORS.DISABLED,
  ผู้ตั้งครรภ์: PHYSICAL_STATUS_BG_COLORS.PREGNANT,
  ผู้พิการรณ์: PHYSICAL_STATUS_BG_COLORS.DISABLED_TYPO,
  ทั่วไป: PHYSICAL_STATUS_BG_COLORS.GENERAL,
  ชาวไทย: PHYSICAL_STATUS_BG_COLORS.GENERAL,
  ชาวต่างชาติ: PHYSICAL_STATUS_BG_COLORS.GENERAL,
};

/** คืนสีพื้นหลังจากรหัสสถานะ หรือข้อความหมายเหตุ */
export function getPhysicalStatusBgColor(
  remarkOrCode?: string | number | null,
): string {
  if (remarkOrCode === null || remarkOrCode === undefined || remarkOrCode === '') {
    return DEFAULT_PHYSICAL_STATUS_BG_COLOR;
  }

  if (typeof remarkOrCode === 'number') {
    return COLOR_BY_CODE[remarkOrCode] ?? DEFAULT_PHYSICAL_STATUS_BG_COLOR;
  }

  const trimmed = String(remarkOrCode).trim();
  if (/^\d+$/.test(trimmed)) {
    return COLOR_BY_CODE[Number(trimmed)] ?? DEFAULT_PHYSICAL_STATUS_BG_COLOR;
  }

  return COLOR_BY_REMARK[trimmed] ?? DEFAULT_PHYSICAL_STATUS_BG_COLOR;
}
