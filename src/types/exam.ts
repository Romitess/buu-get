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
}

/** Pass/fail outcome of an exam, used to render a composed result label */
export type ExamResult = 'passed' | 'failed';

export interface CustomStatus {
  /** i18n key, used as-is when `result` is not set */
  label: string;
  type: 'success' | 'error';
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
  status: string;
  statusType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  date: string;
  time: string;
  location: string;
  fee?: number;
  deadline?: string;
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
}
export interface BackendEnrollment {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  ERM_STATUS: number;
  ERM_VERIFY_STATUS: number;
  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT: string | null;
}

export interface BackendScore {
  SCORES_ID: number;
  ERM_ID: number;
  SC_LANG_USE_SCORE?: number;
  SC_READING_SCORE?: number;
  SC_TOTAL_SCORE?: number;
  SC_BAND_LEVEL?: number;
  CERTIFICATES?: {
    CERT_ID: number;
    SCORES_ID: number;
    CERT_CODE: string;
    CERT_ISSUED_AT: string;
  }[];
}

export interface ExamEnrollment {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  LS_ID: number | null;
  ERM_STATUS: number;
  ERM_VERIFY_STATUS: number;
  CREATED_AT: string;
  SESSION?: BackendSession;
  TRANSACTION?: {
    TRANX_ID: number;
    TRANX_MATCH_STATUS?: number;
    TRANX_REF1?: string;
    TRANX_PAID_AT?: string | Date;
    TRANX_CREATED_AT?: string | Date;
    TRANX_RECEIPT_NAME?: string;
    TRANX_TAX_ID?: string;
    TRANX_RECEIPT_ADDRESS?: string;
    TRANX_AMOUNT?: number;
    TRANX_CHANNEL?: string;
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
}

export interface BackendLocation {
  LOCATION_ID: number;
  LOCATION_NAME: string;
  LOCATION_ROOM_NO: string;
  LOCATION_TOTAL_ROWS?: number;
  LOCATION_TOTAL_COLS?: number;
  LOCATION_IS_SPLIT?: number;
  SEATS?: {
    LS_ID: number;
    LS_ROW_NO: number;
    LS_COL_NO: number;
    LS_SEAT_LABEL: string | null;
    LS_SEAT_STATUS: number;
  }[];
}

export interface BackendSession {
  SS_ID: number;
  SS_NAME: string;
  SS_START_TIME: string;
  SS_END_TIME: string;
  SS_CAPACITY: number;
  LOCATION_ID: number;
  LOCATION?: BackendLocation;
  ENROLLMENTS?: BackendEnrollment[];
  EXAM_ID?: number;
  EXAM?: BackendExam;
}

export interface BackendExam {
  EXAM_ID: number;
  EXAM_NAME: string;
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
  FUND_SOURCE?: {
    FS_ID: number;
    FS_NAME: string;
    FS_ACCOUNT_CODE: string;
  };
  SESSIONS: BackendSession[];
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
