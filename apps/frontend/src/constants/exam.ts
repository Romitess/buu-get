/** ค่าธรรมเนียมเริ่มต้นของรอบสอบทั่วไป (THB) — ใช้ prefills ฟอร์มสร้างและ fallback แสดงผล */
export const DEFAULT_EXAM_FEE_THB = 500;

/** ระยะเวลานับถอยหลังการชำระเงิน (รูปแบบ MM:SS) */
export const PAYMENT_COUNTDOWN_DEFAULT = '29:30';

/** ระยะเวลานับถอยหลังในหน้าประวัติการสอบ (สำหรับแสดงผลใน Dialog) */
export const PAYMENT_DIALOG_COUNTDOWN_DEFAULT = '29 : 50';

/** ระยะเวลาชำระเงินเริ่มต้นในหน่วยวินาที (29 นาที 50 วินาที) */
export const PAYMENT_DURATION_SECONDS_DEFAULT = 1790;

/** ส่วนต่างปี พ.ศ. และ ค.ศ. */
export const BUDDHIST_YEAR_OFFSET = 543;

/**
 * ปีงบประมาณต้องเป็นปี ค.ศ. 4 หลัก (ช่วง 1900–2199)
 * ใช้รูปแบบเดียวกันทั้ง frontend validation และ backend DTO
 */
export const EXAM_FISCAL_YEAR_AD_REGEX = /^(19|20|21)\d{2}$/;

/**
 * ปีงบประมาณไทย (ค.ศ.) ตามวันที่อ้างอิง
 * — เริ่ม 1 ต.ค. สิ้นสุด 30 ก.ย. ของปีถัดไป และใช้ปีที่สิ้นสุดเป็นชื่อปีงบประมาณ
 */
export const getCurrentThaiFiscalYearAd = (date: Date = new Date()): string => {
  const calendarYear = date.getFullYear();
  const month = date.getMonth(); // 0–11
  const fiscalYear = month >= 9 ? calendarYear + 1 : calendarYear;
  return String(fiscalYear);
};

/** ประเภทการสอบ */
export const EXAM_TYPE_GENERAL = 'รอบทั่วไป';
export const EXAM_TYPE_SPECIAL = 'รอบพิเศษ';

/** Shared special-exam passcode: exactly 6 alphanumeric characters */
export const PASSCODE_LENGTH = 6;
export const PASSCODE_PATTERN = /^[A-Za-z0-9]{6}$/;
export const PASSCODE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function normalizeExamPasscode(passcode: string): string {
  return passcode.trim().toUpperCase();
}

export function generateRandomAlphanumericPasscode(
  length: number = PASSCODE_LENGTH,
): string {
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * PASSCODE_CHARSET.length);
    result += PASSCODE_CHARSET[index];
  }
  return result;
}

/** รูปแบบการสอบ */
export const EXAM_FORMAT_COMPUTER = 'คอมพิวเตอร์';
export const EXAM_FORMAT_PAPER = 'กระดาษ';

/** ค่าเริ่มต้นของข้อมูลการสอบ */
export const DEFAULT_EXAM_INFO = {
  badgeText: '',
  title: '',
  subtitle: '',
  locationText: '',
  feeText: '',
  formatText: '',
};

/** สถานะตั้งต้นของ Session (1 = OPEN) */
export const SESSION_STATUS_OPEN = 1;
export const SESSION_STATUS_COMPLETED = 4;

/** จำนวนรอบสอบสูงสุดและต่ำสุดที่อนุญาต */
export const MAX_EXAM_SESSIONS = 4;
export const MIN_EXAM_SESSIONS = 1;

/** ข้อความแสดงผลเมื่อไม่พบข้อมูลสถานที่ */
export const DEFAULT_LOCATION_TEXT = 'TBA';

/** ชื่อการสอบเริ่มต้น (fallback สำหรับแสดงผล) */
export const DEFAULT_EXAM_TITLE = 'BUU - GET';

/** ค่าเริ่มต้นของช่องชื่อการสอบในฟอร์มสร้างรอบสอบ */
export const DEFAULT_EXAM_NAME = 'BUU-GET';

/** ข้อความแจ้งเตือนต่างๆ */
export const NOTIFY_MSG = {
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
};

/** ข้อความแจ้งเตือนเมื่อกรอกข้อมูลไม่ครบถ้วน (Validation) */
export const VALIDATION_MSG = {
  EXAM_NAME: 'กรุณากรอกชื่อการสอบ',
  EXAM_ROUND: 'กรุณากรอกครั้งที่จัดสอบ',
  EXAM_FISCAL_YEAR: 'กรุณากรอกปีงบประมาณ',
  EXAM_FISCAL_YEAR_AD_ONLY: 'ปีงบประมาณต้องเป็นปี ค.ศ. 4 หลัก (เช่น 2026)',
  EXAM_TYPE: 'กรุณาเลือกประเภทการสอบ',
  EXAM_FORMAT: 'กรุณาเลือกรูปแบบการสอบ',
  FUND_SOURCE: 'กรุณาเลือกรหัสผังแหล่งเงิน',
  SCORE_RUBRIC: 'กรุณาเลือกชุดเกณฑ์คะแนน',
  EXAM_DATE: 'กรุณาเลือกวันที่สอบ',
  START_TIME: 'กรุณากรอกเวลาเริ่ม',
  END_TIME: 'กรุณากรอกเวลาสิ้นสุด',
  LOCATION: 'กรุณาเลือกสถานที่สอบ',
  SEATS: 'กรุณากรอกจำนวนที่นั่ง',
  REG_START_DATE: 'กรุณาเลือกวันที่เริ่มต้นลงทะเบียน',
  REG_START_TIME: 'กรุณาเลือกเวลาเริ่มต้นลงทะเบียน',
  REG_END_DATE: 'กรุณาเลือกวันที่สิ้นสุดลงทะเบียน',
  REG_END_TIME: 'กรุณาเลือกเวลาสิ้นสุดลงทะเบียน',
  PAY_START_DATE: 'กรุณาเลือกวันที่เริ่มต้นชำระเงิน',
  PAY_START_TIME: 'กรุณาเลือกเวลาเริ่มต้นชำระเงิน',
  PAY_END_DATE: 'กรุณาเลือกวันที่สิ้นสุดชำระเงิน',
  PAY_END_TIME: 'กรุณาเลือกเวลาสิ้นสุดชำระเงิน',
  SHARED_PASSCODE: 'กรุณากำหนด Passcode 6 ตัวอักษรหรือตัวเลขสำหรับผู้มีสิทธิ์สอบทุกคน',
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

export const POLLING_INTERVAL_MS = 60_000;
/** อัปเดตนาฬิกาปฏิทิน — ไม่ต้องทุกวินาที (วันหมดเขตเปลี่ยนช้า) */
export const CALENDAR_CLOCK_INTERVAL_MS = 30_000;

export const NOTIFY_TIMEOUT_SHORT = 2000;
export const NOTIFY_TIMEOUT_DEFAULT = 2500;
export const NOTIFY_TIMEOUT_LONG = 3000;

export const ROUNDS_SCROLL_THRESHOLD = 3;

export const ENROLLMENT_STATUS = {
  UNPAID: 0,
  PAID: 1,
  SEAT_ASSIGNED: 2,
  SEAT_PUBLISHED: 3,
  ATTENDED: 4,
  CANCELLED: 5,
} as const;

export const VERIFY_STATUS = {
  UNCHECKED: 0,
  PASS: 1,
  WAIT_FIXED: 2,
  CANCELLED: 3,
} as const;

export const TRANSACTION_MATCH_STATUS = {
  MATCH: 1,
  UNMATCH: 0,
} as const;

export const TRANSACTION_PAYMENT_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  PAID: 3,
  PAYMENT_FAILED: 4,
  EXPIRED: 5,
  REVERSED: 6,
  REFUND: 7,
  RECEIPT_VOIDED: 8,
} as const;

export const ReceiptStatus = {
  UNISSUED: 0,
  ISSUED: 1,
  VOIDED: 2,
} as const;

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
