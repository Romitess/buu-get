/**
 * สีพื้นหลังตามประเภทผู้เข้าสอบ (สถานะทางกายภาพ / หมายเหตุ)
 * ชาวไทย และชาวต่างชาติใช้สีน้ำเงินเดียวกัน
 * บุคคลทุพพลภาพใช้ม่วง เพื่อแยกจากน้ำเงินของชาวไทย/ชาวต่างชาติให้ชัด
 */
export const PHYSICAL_STATUS_BG_COLORS = {
  MONK: '#F57C00',
  /** ม่วง — แยกจาก GENERAL (#1E89E5) ให้มองเห็นชัด */
  DISABLED: '#7B1FA2',
  PREGNANT: '#C2185B',
  DISABLED_TYPO: '#388E3C',
  /** ทั่วไป / ชาวไทย / ชาวต่างชาติ */
  GENERAL: '#1E89E5',
} as const;

export const DEFAULT_PHYSICAL_STATUS_BG_COLOR = PHYSICAL_STATUS_BG_COLORS.GENERAL;

const COLOR_BY_CODE: Record<number, string> = {
  0: PHYSICAL_STATUS_BG_COLORS.MONK,
  /** legacy code 1 (นักบวช) — รวมเป็นพระภิกษุ/นักบวช */
  1: PHYSICAL_STATUS_BG_COLORS.MONK,
  2: PHYSICAL_STATUS_BG_COLORS.DISABLED,
  3: PHYSICAL_STATUS_BG_COLORS.PREGNANT,
  4: PHYSICAL_STATUS_BG_COLORS.DISABLED_TYPO,
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
  ผู้พิการรณ์: PHYSICAL_STATUS_BG_COLORS.DISABLED_TYPO,
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
