/**
 * รวมครั้งที่จัดสอบ + ปีงบประมาณ สำหรับแสดงผล
 * เช่น "1/2569" หรือคืนค่าที่มีอย่างใดอย่างหนึ่ง
 */
export function formatExamInstanceLabel(
  examRound?: string | null,
  fiscalYear?: string | null,
): string {
  const round = examRound?.trim() ?? '';
  const year = fiscalYear?.trim() ?? '';

  if (round && year) return `${round}/${year}`;
  return round || year;
}

/**
 * ชื่อการสอบพร้อมครั้งที่/ปีงบประมาณ สำหรับหัวข้อตารางและรายการ
 */
export function formatExamDisplayTitle(
  examName?: string | null,
  examRound?: string | null,
  fiscalYear?: string | null,
): string {
  const name = examName?.trim() ?? '';
  const instance = formatExamInstanceLabel(examRound, fiscalYear);
  if (name && instance) return `${name} ${instance}`;
  return name || instance;
}
