/** สถานะทางกายภาพ/ข้อมูลผู้สมัคร — เก็บใน ERM_PHYSICAL_STATUS เป็น tinyint 1–5 */
export enum UserPhysicalStatus {
  /** code 1 */
  MONK = 'พระภิกษุ / นักบวช',
  /** code 2 */
  DISABLED = 'บุคคลทุพพลภาพ',
  /** code 3 */
  PREGNANT = 'ผู้ตั้งครรภ์',
  /** code 4 — จำแนกจากเลือก "ทั่วไป" + มี passport */
  FOREIGNER = 'ชาวต่างชาติ',
  /** code 5 — จำแนกจากเลือก "ทั่วไป" + ไม่มี passport */
  THAI = 'ชาวไทย',
}
