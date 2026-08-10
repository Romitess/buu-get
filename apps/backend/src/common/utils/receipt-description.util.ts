/**
 * สร้างคำอธิบายรายการในใบเสร็จ
 *
 * @param round ครั้งที่สอบ (EXAM_ROUND)
 * @param fiscalYearAd ปีงบประมาณ ค.ศ. (EXAM_FISCAL_YEAR)
 * @returns คำอธิบายรายการ เช่น "ค่าสมัครทดสอบความรู้ภาษาอังกฤษ (BUU-GET) ครั้งที่ 1/2569"
 */
export function buildReceiptItemDescription(
  round: string | null | undefined,
  fiscalYearAd: string | null | undefined,
): string {
  const base = 'ค่าสมัครทดสอบความรู้ภาษาอังกฤษ (BUU-GET)';

  if (!round || !fiscalYearAd || !/^\d+$/.test(fiscalYearAd)) {
    return base;
  }

  const fiscalYearBe = parseInt(fiscalYearAd, 10) + 543;
  return `${base} ครั้งที่ ${round}/${fiscalYearBe}`;
}
