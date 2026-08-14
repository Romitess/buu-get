/**
 * โครงสร้าง response ของรายงานการสอบ (exam-report)
 * backend คืนค่าตัวเลขดิบ — ส่วน icon/สี/format ให้ frontend จัดการเอง
 */

/** ตัวเลขสถิติ 1 ค่า พร้อมการเปรียบเทียบกับปีก่อนหน้า */
export interface ExamReportStat {
  value: number;
  previousValue: number;
  changePercent: number;
}

/** สถิติคะแนนเฉลี่ย (สเกล 0-100) พร้อมแนวโน้มสำหรับ sparkline */
export interface ExamReportScoreStat extends ExamReportStat {
  trend: number[];
}

/** สถิติที่มีอัตราส่วน (donut) เช่น อัตราการเข้าสอบ/ขาดสอบ */
export interface ExamReportRateStat extends ExamReportStat {
  rate: number;
}

export interface ExamReportStats {
  applicants: ExamReportStat;
  attended: ExamReportRateStat;
  absent: ExamReportRateStat;
  averageScore: ExamReportScoreStat;
}

export interface ExamAttendanceByYear {
  year: number;
  attended: number;
  absent: number;
}

export interface ExamRegistrationTrendByYear {
  year: number;
  registered: number;
}

export interface ExamReportRound {
  round: string;
  examDate: string;
  registered: number | null;
  attended: number | null;
  absent: number | null;
}

export interface ExamScoreSummaryRow {
  year: number;
  counts: number[];
}

export interface ExamScoreSummary {
  ranges: string[];
  rows: ExamScoreSummaryRow[];
}

/** สัดส่วนผู้เข้าสอบครั้งเดียว vs ผู้เข้าสอบซ้ำ (นับจำนวนผู้ใช้ที่มีคะแนน) */
export interface ExamAttemptProportion {
  /**
   * ผู้ที่มีคะแนนในช่วงที่เลือก และไม่มี scored attempt ที่เป็น repeat
   * (ไม่มี enrollment มีคะแนนก่อนหน้า — lifetime)
   */
  firstTime: number;
  /**
   * ผู้ที่มีอย่างน้อย 1 scored attempt ในช่วงที่เลือก ที่ถือว่าสอบซ้ำ
   * (มี enrollment มีคะแนนก่อนหน้า — lifetime)
   */
  repeat: number;
}

/** แถวสรุปรายปีของตารางภาพรวม */
export interface ExamYearTableRow {
  year: number;
  registered: number;
  attended: number;
  absent: number;
  /**
   * จำนวนคน (DISTINCT) ที่มีคะแนนในปีนี้และมีคะแนนก่อนหน้า (lifetime)
   */
  repeatTakers: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

/** แถวรายละเอียดรอบสอบภายในปีที่เลือก */
export interface ExamInformationRound {
  round: string;
  applicants: number;
  attended: number;
  absent: number;
  repeatTakers: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

/** meta แบ่งหน้า + คะแนนรวมทั้งปี/รอบ (ไม่คำนวณจากหน้าปัจจุบัน) */
export interface ExamReportListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

export interface ExamReportListResponse<T> {
  data: T[];
  meta: ExamReportListMeta;
}

export type ExamCandidateAttemptStatus = 'firstAttempt' | 'repeatAttempt';

/** แถวข้อมูลผู้เข้าสอบรายบุคคลภายในรอบสอบที่เลือก */
export interface ExamCandidateInfo {
  id: string;
  examNumber: string;
  prefix: string;
  fullName: string;
  /** @deprecated ใช้ scoreLines */
  vocabularyGrammarScore: number | null;
  /** @deprecated ใช้ scoreLines */
  readingScore: number | null;
  totalScore: number | null;
  level: string | null;
  attemptStatus: ExamCandidateAttemptStatus;
  scoreLines?: ExamCandidateScoreLine[];
}

export interface ExamCandidateScoreLine {
  nameTh: string;
  nameEn: string;
  score: number | null;
  maxScore: number;
  sortOrder: number;
}

export interface ExamReportSummary {
  stats: ExamReportStats;
  attendanceByYear: ExamAttendanceByYear[];
  registrationTrend: ExamRegistrationTrendByYear[];
  rounds: ExamReportRound[];
  scoreSummaryByYear: ExamScoreSummary;
  attemptProportion: ExamAttemptProportion;
  yearTable: ExamYearTableRow[];
}

/** ตัวเลือกใน dropdown ของฟิลเตอร์ */
export interface ExamReportOption {
  label: string;
  value: string;
}

export interface ExamReportOptions {
  years: ExamReportOption[];
  months: ExamReportOption[];
  rounds: ExamReportOption[];
}
