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

// ================== Exam Schedule Page Types ==================
// ใช้สำหรับหน้ารายการสอบ — แสดงปฏิทิน + รอบสอบ

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

// ================== Exam History Types ==================
// ใช้สำหรับหน้าประวัติการสอบ — แสดงรายการสอบที่ลงทะเบียนแล้ว

/** สถานะเพิ่มเติม เช่น ผ่าน/ไม่ผ่าน หรือ หมดเวลาชำระเงิน */
export interface CustomStatus {
  /** ข้อความแสดงสถานะ */
  label: string;
  /** ประเภทสถานะ (กำหนดสี) */
  type: 'success' | 'error';
  /** ชื่อ icon (Material Icons) */
  icon: string;
}

/** รายการสอบแต่ละรายการในประวัติการสอบ */
export interface ExamHistoryItem {
  /** รหัสรายการ */
  id: number;
  /** ชื่อการสอบ */
  title: string;
  /** ข้อความสถานะหลัก เช่น 'รอชำระเงิน', 'ชำระเงินแล้ว' */
  status: string;
  /** ประเภทสถานะ (กำหนด badge สี) */
  statusType: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** วันที่สอบ (แสดงในรูปแบบไทย) */
  date: string;
  /** ช่วงเวลาสอบ */
  time: string;
  /** สถานที่สอบ */
  location: string;
  /** ค่าธรรมเนียม */
  fee?: number;
  /** เวลาที่เหลือในการชำระเงิน */
  deadline?: string;
  /** สถานะเพิ่มเติม (เช่น ผ่าน/ไม่ผ่าน) */
  customStatus?: CustomStatus;
  /** ปุ่ม action ที่แสดง */
  actions?: string[];
}

// ================== Exam Schedule Data Types ==================

/** ข้อมูลรอบสอบรายวัน (ใช้ใน ExamSchedulePage) */
export interface DayData {
  /** รอบสอบทั้งหมดของวัน */
  rounds: ExamRound[];
  /** สถานที่สอบ */
  location: string;
  /** ค่าธรรมเนียม (เช่น 'Fee : 500 ฿') */
  fee: string;
}
