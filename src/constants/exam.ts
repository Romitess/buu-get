/** ค่าธรรมเนียมเริ่มต้นเมื่ออ่านจาก fee text ไม่ได้ (THB) */
export const DEFAULT_EXAM_FEE_THB = 500;

/** ระยะเวลานับถอยหลังการชำระเงิน (รูปแบบ MM:SS) */
export const PAYMENT_COUNTDOWN_DEFAULT = '29:30';

/** ระยะเวลานับถอยหลังในหน้าประวัติการสอบ (สำหรับแสดงผลใน Dialog) */
export const PAYMENT_DIALOG_COUNTDOWN_DEFAULT = '29 : 50';

/** ระยะเวลาชำระเงินเริ่มต้นในหน่วยวินาที (29 นาที 50 วินาที) */
export const PAYMENT_DURATION_SECONDS_DEFAULT = 1790;

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

/** ชื่อการสอบเริ่มต้น */
export const DEFAULT_EXAM_TITLE = 'BUU - GET';

/** ข้อความแจ้งเตือนต่างๆ */
export const NOTIFY_MSG = {
  CONFLICT_DATE: (date: string) =>
    `ไม่สามารถจัดสอบได้ เนื่องจากวันที่ ${date} มีการจัดสอบอยู่แล้ว (1 วันสามารถจัดได้เพียง 1 วิชาเท่านั้น หากต้องการเพิ่มรอบสอบ กรุณาแก้ไขวิชาเดิมเพื่อเพิ่มเวลา)`,
  SELECT_FUND: 'กรุณาเลือกแหล่งเงิน',
  LOAD_ERROR: 'ไม่สามารถโหลดข้อมูลได้',
  MAX_SESSIONS: (max: number) => `สามารถเพิ่มรอบเวลาสอบได้สูงสุด ${max} รอบ`,
  MIN_SESSIONS: (min: number) => `ต้องมีช่วงเวลาสอบอย่างน้อย ${min} ช่วงเวลา`,
  PROVIDE_TIME: 'กรุณาระบุเวลาสอบอย่างน้อย 1 ช่วงเวลา',
  SELECT_LOCATION: 'กรุณาเลือกสถานที่สอบ',
  UPDATE_SUCCESS: 'แก้ไขรอบสอบสำเร็จ',
  CREATE_SUCCESS: 'สร้างรอบสอบสำเร็จ',
  UPDATE_ERROR: 'เกิดข้อผิดพลาดในการแก้ไขรอบสอบ',
  CREATE_ERROR: 'เกิดข้อผิดพลาดในการสร้างรอบสอบ',
  DUPLICATE_DATE: 'วันที่นี้มีการจัดสอบซ้ำซ้อน (Duplicate) กรุณาลบรายการที่ไม่ต้องการออก',
};

/** ข้อความแสดงผลเมื่อยังไม่เลือกข้อมูล */
export const EMPTY_DETAILS = {
  LOCATION: 'กรุณาเลือกวันที่เพื่อดูสถานที่สอบ',
  FEE: 'Fee : - ฿',
};

/** Labels and Units */
export const CURRENCY_SYMBOL = '฿';
export const FEE_LABEL = 'Fee :';

/** Exam Status Constants */
export const EXAM_STATUS_PUBLISHED = 'published';
export const EXAM_STATUS_UNPUBLISHED = 'unpublished';

/** Internal Exam Type mapping (English for backend/logic compatibility) */
export const INTERNAL_EXAM_TYPE_GENERAL = 'general';
export const INTERNAL_EXAM_TYPE_SPECIAL = 'special';

/** Helper to format fee string */
export const formatFee = (amount: number | string) =>
  `${FEE_LABEL} ${Number(amount).toLocaleString()} ${CURRENCY_SYMBOL}`;

export const formatLocationWithRoom = (name: string, room?: string | null) =>
  `${name}${room ? ` (${room})` : ''}`;

export const POLLING_INTERVAL_MS = 5000;

export const NOTIFY_TIMEOUT_SHORT = 2000;
export const NOTIFY_TIMEOUT_DEFAULT = 2500;
export const NOTIFY_TIMEOUT_LONG = 3000;

export const ROUNDS_SCROLL_THRESHOLD = 3;

export const ENROLLMENT_STATUS = {
  UNPAID: 0,
  PAID: 1,
  SEAT_ASSIGNED: 2,
  ATTENDED: 3,
  CANCELLED: 4,
} as const;

export const VERIFY_STATUS = {
  UNCHECKED: 0,
  PASS: 1,
  WAIT_FIXED: 2,
  CANCELLED: 3,
} as const;

export const TRANSACTION_MATCH_STATUS = {
  MATCH: 1,
} as const;

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
