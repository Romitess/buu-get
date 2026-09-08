/**
 * Whitelist ของ system settings ที่อนุญาตให้อ่าน/เขียนผ่าน API
 * เพิ่ม key ใหม่ = เพิ่ม entry ที่นี่ + seed ใน migration
 */

export type SystemSettingType = 'number' | 'string' | 'integer' | 'boolean';

export type SystemSettingGroup =
  | 'exam'
  | 'payment'
  | 'certificate'
  | 'org'
  | 'email';

export interface SystemSettingDefinition {
  key: string;
  group: SystemSettingGroup;
  type: SystemSettingType;
  /** ค่าเริ่มต้นที่ seed / fallback เมื่อยังไม่มีแถวใน DB */
  defaultValue: string;
  /** staff ที่สร้างรอบสอบอ่านได้ (ไม่ใช่แค่ admin) */
  readableByStaff: boolean;
  min?: number;
  max?: number;
  /** ความยาวสูงสุดสำหรับ string */
  maxLength?: number;
  descriptionTh: string;
}

export const SYSTEM_SETTING_KEYS = {
  EXAM_DEFAULT_FEE_THB: 'exam.defaultFeeThb',
  EXAM_DEFAULT_NAME: 'exam.defaultName',
  EXAM_DEFAULT_TYPE: 'exam.defaultType',
  EXAM_DEFAULT_FORMAT: 'exam.defaultFormat',
  EXAM_DEFAULT_SESSION_START: 'exam.defaultSessionStart',
  EXAM_DEFAULT_SESSION_END: 'exam.defaultSessionEnd',
  EXAM_PASSCODE_LENGTH: 'exam.passcodeLength',
  PAYMENT_SESSION_TTL_MINUTES: 'payment.sessionTtlMinutes',
  PAYMENT_DEFAULT_PC_ID: 'payment.defaultPcId',
  CERTIFICATE_VALIDITY_YEARS: 'certificate.validityYears',
  ORG_NAME_TH: 'org.nameTh',
  ORG_NAME_EN: 'org.nameEn',
  ORG_TAX_ID: 'org.taxId',
  ORG_ADDRESS_TH: 'org.addressTh',
  ORG_ADDRESS_EN: 'org.addressEn',
  ORG_SUPPORT_EMAIL: 'org.supportEmail',
  EMAIL_SENDER_NAME: 'email.senderName',
} as const;

export type SystemSettingKey =
  (typeof SYSTEM_SETTING_KEYS)[keyof typeof SYSTEM_SETTING_KEYS];

export const SYSTEM_SETTINGS_CATALOG: readonly SystemSettingDefinition[] = [
  {
    key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FEE_THB,
    group: 'exam',
    type: 'number',
    defaultValue: '500',
    readableByStaff: true,
    min: 0,
    max: 1_000_000,
    descriptionTh: 'ค่าธรรมเนียมเริ่มต้นตอนสร้างรอบสอบ (บาท)',
  },
  {
    key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_NAME,
    group: 'exam',
    type: 'string',
    defaultValue: 'BUU-GET',
    readableByStaff: true,
    maxLength: 255,
    descriptionTh: 'ชื่อการสอบเริ่มต้น',
  },
  {
    key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_TYPE,
    group: 'exam',
    type: 'string',
    defaultValue: 'รอบทั่วไป',
    readableByStaff: true,
    maxLength: 50,
    descriptionTh: 'ประเภทการสอบเริ่มต้น',
  },
  {
    key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_FORMAT,
    group: 'exam',
    type: 'string',
    defaultValue: 'คอมพิวเตอร์',
    readableByStaff: true,
    maxLength: 50,
    descriptionTh: 'รูปแบบการสอบเริ่มต้น',
  },
  {
    key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_SESSION_START,
    group: 'exam',
    type: 'string',
    defaultValue: '08:00',
    readableByStaff: true,
    maxLength: 5,
    descriptionTh: 'เวลาเริ่มสอบเริ่มต้น (HH:mm)',
  },
  {
    key: SYSTEM_SETTING_KEYS.EXAM_DEFAULT_SESSION_END,
    group: 'exam',
    type: 'string',
    defaultValue: '10:00',
    readableByStaff: true,
    maxLength: 5,
    descriptionTh: 'เวลาสิ้นสุดสอบเริ่มต้น (HH:mm)',
  },
  {
    key: SYSTEM_SETTING_KEYS.EXAM_PASSCODE_LENGTH,
    group: 'exam',
    type: 'integer',
    defaultValue: '6',
    readableByStaff: true,
    min: 4,
    max: 16,
    descriptionTh: 'ความยาวรหัสผ่านรอบพิเศษ',
  },
  {
    key: SYSTEM_SETTING_KEYS.PAYMENT_SESSION_TTL_MINUTES,
    group: 'payment',
    type: 'integer',
    defaultValue: '30',
    readableByStaff: true,
    min: 1,
    max: 120,
    descriptionTh: 'ระยะเวลาเซสชัน QR ชำระเงิน (นาที)',
  },
  {
    key: SYSTEM_SETTING_KEYS.PAYMENT_DEFAULT_PC_ID,
    group: 'payment',
    type: 'integer',
    defaultValue: '1',
    readableByStaff: true,
    min: 1,
    descriptionTh: 'รหัส Payment Config เริ่มต้นตอนสร้างรายการชำระเงิน',
  },
  {
    key: SYSTEM_SETTING_KEYS.CERTIFICATE_VALIDITY_YEARS,
    group: 'certificate',
    type: 'integer',
    defaultValue: '2',
    readableByStaff: true,
    min: 1,
    max: 20,
    descriptionTh: 'อายุผลสอบเริ่มต้น (ปี) เมื่อออกใบรับรอง',
  },
  {
    key: SYSTEM_SETTING_KEYS.ORG_NAME_TH,
    group: 'org',
    type: 'string',
    defaultValue: 'มหาวิทยาลัยบูรพา',
    readableByStaff: true,
    maxLength: 255,
    descriptionTh: 'ชื่อองค์กร (ไทย) บนเอกสาร',
  },
  {
    key: SYSTEM_SETTING_KEYS.ORG_NAME_EN,
    group: 'org',
    type: 'string',
    defaultValue: 'BURAPHA UNIVERSITY',
    readableByStaff: true,
    maxLength: 255,
    descriptionTh: 'ชื่อองค์กร (อังกฤษ) บนเอกสาร',
  },
  {
    key: SYSTEM_SETTING_KEYS.ORG_TAX_ID,
    group: 'org',
    type: 'string',
    defaultValue: '0994000033100',
    readableByStaff: true,
    maxLength: 20,
    descriptionTh: 'เลขประจำตัวผู้เสียภาษีอากร',
  },
  {
    key: SYSTEM_SETTING_KEYS.ORG_ADDRESS_TH,
    group: 'org',
    type: 'string',
    defaultValue:
      '169 ถนนลงหาดบางแสน ตำบลแสนสุข อำเภอเมือง จังหวัดชลบุรี 20131',
    readableByStaff: true,
    maxLength: 500,
    descriptionTh: 'ที่อยู่ (ไทย) บนเอกสาร',
  },
  {
    key: SYSTEM_SETTING_KEYS.ORG_ADDRESS_EN,
    group: 'org',
    type: 'string',
    defaultValue: '169 Longhad Bangsaen Road, Saensuk mueang, ChonBuri 20130',
    readableByStaff: true,
    maxLength: 500,
    descriptionTh: 'ที่อยู่ (อังกฤษ) บนเอกสาร',
  },
  {
    key: SYSTEM_SETTING_KEYS.ORG_SUPPORT_EMAIL,
    group: 'org',
    type: 'string',
    defaultValue: 'li@go.buu.ac.th',
    readableByStaff: true,
    maxLength: 255,
    descriptionTh: 'อีเมลติดต่อสนับสนุน',
  },
  {
    key: SYSTEM_SETTING_KEYS.EMAIL_SENDER_NAME,
    group: 'email',
    type: 'string',
    defaultValue: 'BUU-GET',
    readableByStaff: false,
    maxLength: 100,
    descriptionTh: 'ชื่อผู้ส่งอีเมลผ่าน platform gateway',
  },
] as const;

const CATALOG_BY_KEY = new Map(
  SYSTEM_SETTINGS_CATALOG.map((def) => [def.key, def]),
);

export function getSettingDefinition(
  key: string,
): SystemSettingDefinition | undefined {
  return CATALOG_BY_KEY.get(key);
}

export function isKnownSettingKey(key: string): key is SystemSettingKey {
  return CATALOG_BY_KEY.has(key);
}
