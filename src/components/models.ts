export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

// ================== Exam Types ==================
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

export interface User {
  // USER
  id?: number;
  nationalId: string;
  passportNo: string;
  email: string;
  password?: string;
  status: string;

  // USER_PROFILE
  profileId?: number;
  titleTH: string;
  fullNameTH: string;
  titleEN: string;
  fullNameEN: string;
  birthdate: string;
  phone: string;
  educationLevel: string;
  country: string;
  province: string;
  address: string;
  zipCode?: string;
  faculty?: string;
  institution?: string;
  taxId: string;
  thaidSynced: boolean;

  // ROLES
  role?: string;
}

export interface VoucherData {
  id: number;
  fullName: string;
  studentId: string;
  examName: string;
  examDate: string;
  examTime: string;
  examType: string;
  location: string;
  seatNo: string;
  voucherNo: string;
}

export interface CertificateData {
  id: number;
  fullName: string;
  englishName: string;
  studentId: string;
  examName: string;
  examDate: string;
  examType: string;
  score: number;
  maxScore: number;
  grade: string;
  certificateNo: string;
  issuedDate: string;
  institution: string;
  faculty: string;
}

// ================== Exam Schedule Page Types ==================
// ใช้สำหรับหน้ารายการสอบ (ExamSchedulePage) — แสดงปฏิทิน + รอบสอบ

/** ข้อมูลรอบสอบแต่ละช่วงเวลา (ใช้กับ RoundExam component) */
export interface ExamRound {
  /** รหัสรอบสอบ */
  id: number;
  /** ช่วงเวลาสอบ เช่น '08:00 - 10:00' */
  timeRange: string;
  /** ชื่อการสอบ เช่น 'BUU - GET (General)' */
  title: string;
  /** ประเภทรอบสอบ เช่น 'รอบทั่วไป' */
  roundTypeLabel: string;
  /** จำนวนที่นั่งว่าง */
  availableSeats: number;
  /** จำนวนที่นั่งทั้งหมด */
  totalSeats: number;
}

/** ข้อมูลรายละเอียดหลักของการสอบ (ใช้กับ ExamDetail component ส่วนบนของหน้า) */
export interface ExamInfo {
  /** ข้อความ badge เช่น 'รอบทั่วไป' */
  badgeText: string;
  /** ชื่อหัวข้อการสอบ */
  title: string;
  /** คำอธิบายเพิ่มเติม */
  subtitle: string;
  /** สถานที่สอบ เช่น 'Computer Center , BUU (201)' */
  locationText: string;
  /** ค่าธรรมเนียม เช่น 'Fee : 500 ฿' */
  feeText: string;
}
export interface ReceiptData {
  receiptNo: string;
  transactionDate: string;
  fullName: string;
  nationalId: string;
  address?: string;
  examName: string;
  examDate: string;
  location: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}
