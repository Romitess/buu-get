/**
 * สีพื้นหลังตามประเภทผู้เข้าสอบ
 * DB codes: 1 พระภิกษุ/นักบวช, 2 ทุพพลภาพ, 3 ตั้งครรภ์, 4 ชาวต่างชาติ, 5 ชาวไทย
 * ชาวไทย และชาวต่างชาติใช้สีน้ำเงินเดียวกัน
 */
export const PHYSICAL_STATUS_BG_COLORS = {
  MONK: '#F57C00',
  /** ม่วง — แยกจากน้ำเงินของชาวไทย/ชาวต่างชาติให้ชัด */
  DISABLED: '#7B1FA2',
  PREGNANT: '#C2185B',
  /** ทั่วไป / ชาวไทย / ชาวต่างชาติ */
  GENERAL: '#1E89E5',
} as const;

export const DEFAULT_PHYSICAL_STATUS_BG_COLOR = PHYSICAL_STATUS_BG_COLORS.GENERAL;

const COLOR_BY_CODE: Record<number, string> = {
  /** legacy pre-remap */
  0: PHYSICAL_STATUS_BG_COLORS.MONK,
  1: PHYSICAL_STATUS_BG_COLORS.MONK,
  2: PHYSICAL_STATUS_BG_COLORS.DISABLED,
  3: PHYSICAL_STATUS_BG_COLORS.PREGNANT,
  4: PHYSICAL_STATUS_BG_COLORS.GENERAL,
  5: PHYSICAL_STATUS_BG_COLORS.GENERAL,
};

const COLOR_BY_REMARK: Record<string, string> = {
  'พระภิกษุ / นักบวช': PHYSICAL_STATUS_BG_COLORS.MONK,
  'พระภิกษุ/นักบวช': PHYSICAL_STATUS_BG_COLORS.MONK,
  // legacy labels
  'พระภิกษุ / สามเณร': PHYSICAL_STATUS_BG_COLORS.MONK,
  'นักบวช / ศาสนบุคคล': PHYSICAL_STATUS_BG_COLORS.MONK,
  บุคคลทุพพลภาพ: PHYSICAL_STATUS_BG_COLORS.DISABLED,
  ผู้ตั้งครรภ์: PHYSICAL_STATUS_BG_COLORS.PREGNANT,
  ผู้พิการรณ์: PHYSICAL_STATUS_BG_COLORS.DISABLED,
  ทั่วไป: PHYSICAL_STATUS_BG_COLORS.GENERAL,
  ชาวไทย: PHYSICAL_STATUS_BG_COLORS.GENERAL,
  ชาวต่างชาติ: PHYSICAL_STATUS_BG_COLORS.GENERAL,
};

/** คืนสีพื้นหลังจากรหัสสถานะ หรือข้อความหมายเหตุ */
export function getPhysicalStatusBgColor(remarkOrCode?: string | number | null): string {
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
