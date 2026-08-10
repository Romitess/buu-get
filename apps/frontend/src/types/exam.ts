import type { BackendUser } from './enrollment.types';

export type ExamType = 'กสพ' | 'ความถนัด' | 'ภาษา' | 'สมรรถนะ' | 'อื่นๆ';

export interface ExamRegistration {
  startDate: string;
  endDate: string;
}

export interface ExamSchedule {
  examDate: string;
  startTime: string;
  endTime: string;
  venue: string;
}

export interface ExamPayment {
  deadline: string;
  amount: number;
}

export interface Exam {
  id: number;
  name: string;
  type: ExamType;
  fee: number;
  totalSeats: number;
  availableSeats: number;
  registration: ExamRegistration;
  schedule: ExamSchedule;
  payment: ExamPayment;
  isRegistrationOpen: boolean;
}

export interface ExamRound {
  id: number;
  timeRange: string;
  title: string;
  roundTypeLabel: string;
  availableSeats: number;
  totalSeats: number;
  regStartDate?: string | undefined;
  regEndDate: string;
  examDate: string;
}

export interface ExamInfo {
  badgeText: string;
  title: string;
  subtitle: string;
  locationText: string;
  feeText: string;
  formatText?: string | undefined;
}

/** Pass/fail outcome of an exam, used to render a composed result label */
export type ExamResult = 'passed' | 'failed';

/** หมวดหมู่สำหรับกรองประวัติการสอบ/การลงทะเบียน */
export type ExamHistoryCategory = 'pending' | 'registration' | 'exam' | 'completed' | 'cancelled';

export type StatusBadgeType = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface StatusBadgeView {
  /** i18n key */
  label: string;
  type: StatusBadgeType;
}

export interface CustomStatus {
  /** i18n key, used as-is when `result` is not set */
  label: string;
  type: 'success' | 'error' | 'warning';
  icon: string;
  /**
   * When set, the UI renders a composed label "<statusLabel> : <result>"
   * instead of translating `label` directly.
   */
  result?: ExamResult;
}

export interface ExamHistoryItem {
  id: number;
  title: string;
  /** i18n key — สถานะหลักที่แสดง (backward compatible) */
  status: string;
  statusType: StatusBadgeType;
  /** หมวดหมู่สำหรับกรองรายการ */
  category: ExamHistoryCategory;
  /** สถานะการลงทะเบียน */
  registrationStatus: StatusBadgeView;
  /** สถานะการสอบ (ถ้ามี) */
  examStatus?: StatusBadgeView;
  date: string;
  time: string;
  location: string;
  fee?: number;
  /** QR session expiry (TRANX_EXPIRES_AT) — drives MM:SS countdown when set */
  deadline?: string;
  /** Exam pay-by date (EXAM_PAY_END_DATE) — static display before QR session starts */
  payByDate?: string;
  seatLabel?: string;
  customStatus?: CustomStatus;
  actions?: string[];
  rawEnrollment?: ExamEnrollment;
}

export interface DayData {
  examId?: number;
  rounds: ExamRound[];
  location: string;
  fee: string;
  title: string;
  subtitle: string;
  formatText?: string | undefined;
}

export interface RoundExamProps {
  title: string;
  timeRange: string;
  availableSeats: number;
  totalSeats: number;
  roundTypeLabel?: string | undefined;
  regStartDate?: string | undefined;
  regEndDate?: string | undefined;
  examDate?: string | undefined;
  fullStatusText?: string | undefined;
  availableStatusTextPrefix?: string | undefined;
  availableStatusTextSuffix?: string | undefined;
  fullBtnText?: string | undefined;
  registerBtnText?: string | undefined;
  isRegistered?: boolean | undefined;
  registeredBtnText?: string | undefined;
}

export interface ExamClockProps {
  timeRange: string;
}

export interface DialogConfirmProps {
  modelValue: boolean;
  examDate: string;
  examTime: string;
  title?: string;
  subtitle?: string;
  cancelBtnText?: string;
  confirmBtnText?: string;
}

export interface DialogCancelProps {
  modelValue: boolean;
  examDate: string;
  examTime: string;
  title?: string;
  subtitle?: string;
  cancelBtnText?: string;
  confirmBtnText?: string;
}

export interface ExamDetailProps {
  badgeText?: string;
  title: string;
  subtitle?: string;
  locationText?: string;
  feeText?: string;
  formatText?: string | undefined;
}
export interface BackendEnrollment {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  SL_ID?: number | null;
  ERM_STATUS: number;
  ERM_VERIFY_STATUS: number;
  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT: string | null;
  ERM_PHYSICAL_STATUS?: string | null;
}

export interface BackendScore {
  SCORES_ID: number;
  ERM_ID: number;
  SC_LANG_USE_SCORE?: number;
  SC_READING_SCORE?: number;
  SC_TOTAL_SCORE?: number;
  SC_BAND_LEVEL?: string | null;
  CERTIFICATES?: {
    CERT_ID: number;
    SCORES_ID: number;
    CERT_CODE: string;
    CERT_ISSUED_AT: string;
    CERT_EXPIRES_AT?: string | null;
  }[];
}

export interface ExamEnrollment {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  SL_ID?: number | null;
  LS_ID: number | null;
  ERM_SEAT_LABEL?: string | null;
  ERM_SORT_ORDER?: number | null;
  ERM_STATUS: number;
  ERM_VERIFY_STATUS: number;
  ERM_TEST_TAKER?: string | null;
  ERM_PHYSICAL_STATUS?: string | null;
  CREATED_AT: string;
  UPDATED_AT?: string;
  SESSION?: BackendSession;
  USER?: BackendUser;
  TRANSACTION?: {
    TRANX_ID: number;
    TRANX_MATCH_STATUS?: number;
    TRANX_PAYMENT_STATUS?: number;
    TRANX_PAID_AT?: string | Date;
    TRANX_CREATED_AT?: string | Date;
    TRANX_EXPIRES_AT?: string | Date | null;
    TRANX_AMOUNT?: number;
    TRANX_CHANNEL?: number;
    RECEIPTS?: {
      RC_ID: number;
      RC_NO?: string | null;
      RC_VERIFY_CODE?: string;
      RC_NAME?: string | null;
      RC_TAX_ID?: number | null;
      RC_PHONE?: string | null;
      RC_ADDRESS?: string | null;
      RC_STATUS: number;
    }[];
    BANK_RECONCILES?: { BR_ID: number; TRANX_ID: number | null }[];
  };
  VOUCHERS?: {
    VC_ID: number;
    ERM_ID: number;
    VC_CODE: string;
    CREATED_AT: string;
  }[];
  SCORE?: BackendScore;
  LOCATION_SEAT?: {
    LS_ID: number;
    LS_SEAT_LABEL: string | null;
    LS_ROW_NO?: number;
    LS_COL_NO?: number;
  } | null;
  SESSION_LOCATION?: {
    SL_ID: number;
    LOCATION_ID: number;
    LOCATION?: BackendLocation;
  } | null;
}

export interface BackendLocation {
  LOCATION_ID: number;
  LOCATION_NAME: string;
  LOCATION_ROOM_NO: string;
  LOCATION_FLOOR_NO?: number | null;
  LOCATION_TOTAL_ROWS?: number;
  LOCATION_TOTAL_COLS?: number;
  LOCATION_SEAT_DIRECTION?: 'HORIZONTAL' | 'VERTICAL';
  LOCATION_AISLE_AFTER_COL?: Array<{ type: 'row' | 'column'; index: number } | number> | null;
  SEAT_DIRECTION?: 'HORIZONTAL' | 'VERTICAL';
  AISLE_AFTER_COLS?: number[] | null;
  AISLE_AFTER_ROWS?: number[] | null;
  LOCATION_SEAT_CAPACITY?: number;
  SEATS?: {
    LS_ID: number;
    LS_ROW_NO: number;
    LS_COL_NO: number;
    LS_SEAT_LABEL: string | null;
    LS_SEAT_STATUS: number;
    LS_SORT_ORDER?: number | null;
  }[];
}

export interface BackendBlockedSeat {
  BLOCK_ID: number;
  LS_ID: number;
  SS_ID: number;
  BLOCK_STATUS: number;
  LOCATION_SEAT?: {
    LS_ID: number;
    LOCATION_ID: number;
    LS_SEAT_LABEL: string | null;
    LS_SEAT_STATUS: number;
  } | null;
}

export interface BackendSession {
  SS_ID: number;
  SS_START_TIME: string;
  SS_END_TIME: string;
  SS_CAPACITY: number;
  SS_SESSION_STATUS?: number;
  LOCATION_ID?: number | null;
  LOCATION?: BackendLocation;
  SESSION_LOCATIONS?: {
    SL_ID: number;
    LOCATION_ID: number;
    SS_ID: number;
    SS_NAME: string | null;
    TOTAL_ROWS?: number | null;
    TOTAL_COLS?: number | null;
    AISLE_AFTER?: { after_cols: number[]; after_rows: number[] } | null;
    LOCATION_SEAT_DIRECTION?: 'HORIZONTAL' | 'VERTICAL';
    LOCATION_SEAT_CAPACITY?: number | null;
    SEATS_SNAPSHOT?:
      | {
          label: string | null;
          status: 'AVAILABLE' | 'BROKEN' | 'BLOCKED';
          sortorder: number | null;
        }[]
      | null;
    LOCATION: BackendLocation;
  }[];
  /** @deprecated Prefer ACTIVE_ENROLLMENT_COUNT — list/detail ไม่โหลด ENROLLMENTS ทั้งก้อนแล้ว */
  ENROLLMENTS?: BackendEnrollment[];
  /** จำนวนผู้สมัครที่ยังไม่ยกเลิก (จาก aggregate) */
  ACTIVE_ENROLLMENT_COUNT?: number;
  /** นับผู้สมัครต่อ SL_ID (key เป็น string ของ SL_ID หรือ "null") */
  ENROLLMENT_SL_COUNTS?: Record<string, number>;
  EXAM_ID?: number;
  EXAM?: BackendExam;
}

export interface BackendExam {
  EXAM_ID: number;
  EXAM_NAME: string;
  EXAM_ROUND?: string | null;
  EXAM_FISCAL_YEAR?: string | null;
  EXAM_TYPE: string;
  EXAM_FORMAT: string;
  EXAM_FEE: number;
  EXAM_DATE: string;
  EXAM_REG_START_DATE: string;
  EXAM_REG_END_DATE: string;
  EXAM_PAY_START_DATE: string;
  EXAM_PAY_END_DATE: string;
  EXAM_PUBLISHED: boolean;
  FUND_SOURCE_ID: number;
  SRB_ID?: number | null;
  FUND_SOURCE?: {
    FS_ID: number;
    FS_NAME: string;
    FS_ACCOUNT_CODE: string;
  };
  SCORE_RUBRIC?: {
    SRB_ID: number;
    SRB_NAME_TH: string;
    SRB_NAME_EN: string;
    SRB_IS_DEFAULT: boolean;
    ITEMS?: Array<{
      SRBI_ID: number;
      SRBI_NAME_TH: string;
      SRBI_NAME_EN: string;
      SRBI_CODE: string | null;
      SRBI_MAX_SCORE: number | string;
      SRBI_SORT_ORDER: number;
      DELETED_AT?: string | null;
    }>;
  };
  SESSIONS: BackendSession[];
  PASSCODES?: BackendPasscode[];
}

export interface BackendPasscode {
  PASSCODE_ID: number;
  EXAM_ID: number;
  NATIONAL_ID: string;
  FULL_NAME: string;
  PASSCODE: string;
}

export interface ExamManagementItem {
  id: string | number;
  examName: string;
  examType: 'general' | 'special';
  examDate: Date | string;
  examLocation: string;
  registeredCount: number;
  capacity: number;
  status: 'published' | 'unpublished';
}
export interface AdmissionVoucherData {
  profileImage?: string;
  testTakerId: string;
  nameSurname: string;
  citizenId: string;
  testSession: string;
  testDate: string;
  timeRange: string;
  venue: string;
  seatNumber: string;
  barcodeValue: string;
}

/** Passcode generation mode: single shared or individual per candidate */
export type PasscodeType = 'single' | 'individual';
