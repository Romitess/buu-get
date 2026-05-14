/** ค่าธรรมเนียมเริ่มต้นเมื่ออ่านจาก fee text ไม่ได้ (THB) */
export const DEFAULT_EXAM_FEE_THB = 500;

/** ระยะเวลานับถอยหลังการชำระเงิน (รูปแบบ MM:SS) */
export const PAYMENT_COUNTDOWN_DEFAULT = '29:30';

/** ระยะเวลานับถอยหลังในหน้าประวัติการสอบ (สำหรับแสดงผลใน Dialog) */
export const PAYMENT_DIALOG_COUNTDOWN_DEFAULT = '29 : 50';

/** ส่วนต่างปี พ.ศ. และ ค.ศ. */
export const BUDDHIST_YEAR_OFFSET = 543;

/** ประเภทการสอบ */
export const EXAM_TYPE_GENERAL = 'รอบทั่วไป';
export const EXAM_TYPE_SPECIAL = 'รอบพิเศษ';

/** รูปแบบการสอบ */
export const EXAM_FORMAT_COMPUTER = 'แบบคอมพิวเตอร์';
export const EXAM_FORMAT_PAPER = 'แบบกระดาษ';

/** ค่าเริ่มต้นของข้อมูลการสอบ */
export const DEFAULT_EXAM_INFO = {
  badgeText: EXAM_TYPE_GENERAL,
  title: 'การสอบวัดระบบภาษาอังกฤษ BUU-GET',
  subtitle: 'Computer Center, BUU (L201)',
  locationText: 'Computer Center, BUU (L201)',
  feeText: 'Fee : 0 ฿',
};

/** สถานะตั้งต้นของ Session (1 = OPEN) */
export const SESSION_STATUS_OPEN = 1;

/** จำนวนรอบสอบสูงสุดและต่ำสุดที่อนุญาต */
export const MAX_EXAM_SESSIONS = 4;
export const MIN_EXAM_SESSIONS = 1;

/** ข้อความแสดงผลเมื่อไม่พบข้อมูลสถานที่ */
export const DEFAULT_LOCATION_TEXT = 'TBA';
