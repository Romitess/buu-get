// ============================================================
// Exam Report (รายงานการสอบ) — Type Definitions
// ============================================================

/** ตัวเลือกใน dropdown (ปี / เดือน / รอบสอบ) */
export interface ExamReportOption {
  label: string;
  value: string;
}

/** ค่าฟิลเตอร์ของหน้ารายงานการสอบ (ช่วง จาก - ถึง) */
export interface ExamReportFilter {
  fromYear: string;
  fromMonth: string;
  fromRound: string;
  toYear: string;
  toMonth: string;
  toRound: string;
}

/** ทิศทางการเปลี่ยนแปลงของค่าสถิติเมื่อเทียบกับช่วงก่อนหน้า */
export type ExamReportTrend = 'up' | 'down' | 'flat';

/** รูปแบบส่วนเสริมที่แสดงในการ์ดสถิติ */
export type ExamReportStatVisual = 'none' | 'donut' | 'sparkline';

/** ข้อมูลการ์ดสถิติ 1 ใบ */
export interface ExamReportStatCard {
  key: string;
  icon: string;
  iconColorVar: string;
  iconBgVar: string;
  label: string;
  value: number;
  unit: string;
  trend: ExamReportTrend;
  changePercent: number;
  comparePrevious: string;
  visual: ExamReportStatVisual;
  /** เปอร์เซ็นต์สำหรับ donut (0-100) */
  donutPercent?: number;
  donutCaption?: string;
  /** ชุดข้อมูลสำหรับ sparkline */
  sparkline?: number[];
}

/** แถวข้อมูลในตารางรอบสอบ */
export interface ExamReportRoundRow {
  round: string;
  date: string;
  registered: number | null;
  attended: number | null;
  absent: number | null;
}

/** ข้อมูลสำหรับกราฟแท่งจำนวนผู้เข้าสอบและขาดสอบ */
export interface ExamAttendanceChartData {
  categories: string[];
  attended: number[];
  absent: number[];
}

/** ข้อมูลสำหรับกราฟเส้นแนวโน้มผู้ลงทะเบียนรายปี */
export interface ExamRegistrationTrendChartData {
  categories: string[];
  registered: number[];
}

/** ข้อมูลสำหรับกราฟสรุปคะแนนรายปี (แท่งแนวนอนซ้อนตามช่วงคะแนน) */
export interface ExamScoreSummaryChartData {
  years: string[];
  /** แต่ละ series = ช่วงคะแนน 1 ช่วง (เช่น 40-49) */
  series: ExamScoreRangeSeries[];
}

export interface ExamScoreRangeSeries {
  name: string;
  colorVar: string;
  data: number[];
}

/** โครงสร้างข้อมูลรวมทั้งหน้ารายงาน */
export interface ExamReportSummary {
  statCards: ExamReportStatCard[];
  attendanceChart: ExamAttendanceChartData;
  trendChart: ExamRegistrationTrendChartData;
  rounds: ExamReportRoundRow[];
  scoreSummaryChart: ExamScoreSummaryChartData;
}
