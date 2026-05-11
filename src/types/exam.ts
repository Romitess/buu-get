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
}

export interface ExamInfo {
  badgeText: string;
  title: string;
  subtitle: string;
  locationText: string;
  feeText: string;
}

export interface CustomStatus {
  label: string;
  type: 'success' | 'error';
  icon: string;
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
}

export interface DayData {
  rounds: ExamRound[];
  location: string;
  fee: string;
}

export interface RoundExamProps {
  title: string;
  timeRange: string;
  availableSeats: number;
  totalSeats: number;
  roundTypeLabel?: string;
  fullStatusText?: string;
  availableStatusTextPrefix?: string;
  availableStatusTextSuffix?: string;
  fullBtnText?: string;
  registerBtnText?: string;
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

export interface BackendSession {
  SS_ID: number;
  SS_START_TIME: string;
  SS_END_TIME: string;
  SS_CAPACITY: number;
  LOCATION_NAME: string;
  ENROLLMENTS?: BackendEnrollment[];
}

export interface BackendExam {
  EXAM_ID: number;
  EXAM_NAME: string;
  EXAM_TYPE: string;
  EXAM_FEE: number;
  EXAM_DATE: string;
  SESSIONS: BackendSession[];
}
