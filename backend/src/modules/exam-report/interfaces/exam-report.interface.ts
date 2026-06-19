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

export interface ExamReportSummary {
  stats: ExamReportStats;
  attendanceByYear: ExamAttendanceByYear[];
  registrationTrend: ExamRegistrationTrendByYear[];
  rounds: ExamReportRound[];
  scoreSummaryByYear: ExamScoreSummary;
}
