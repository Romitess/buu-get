import type {
  ExamReportFilter,
  ExamReportOption,
  ExamReportSummary,
} from 'src/types/exam-report.types';

// ============================================================
// Exam Report Service
// หมายเหตุ: ตอนนี้คืนค่าเป็น mock data ก่อน (รอเชื่อม API จริงภายหลัง)
// โครงสร้างฟังก์ชันออกแบบให้สลับไปเรียก api.get ได้โดยไม่กระทบ caller
// ============================================================

/** จำลองดีเลย์ของเครือข่ายเพื่อให้สถานะ loading ทำงานเหมือนจริง */
const simulateNetwork = <T>(data: T, delayMs = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delayMs));

/** ตัวเลือกปีสำหรับ dropdown */
export const fetchYearOptions = (): Promise<ExamReportOption[]> =>
  simulateNetwork([
    { label: '2569', value: '2569' },
    { label: '2568', value: '2568' },
    { label: '2567', value: '2567' },
    { label: '2566', value: '2566' },
    { label: '2565', value: '2565' },
  ]);

/** ตัวเลือกเดือนสำหรับ dropdown */
export const fetchMonthOptions = (): Promise<ExamReportOption[]> =>
  simulateNetwork([
    { label: 'มกราคม', value: '01' },
    { label: 'กุมภาพันธ์', value: '02' },
    { label: 'มีนาคม', value: '03' },
    { label: 'เมษายน', value: '04' },
    { label: 'พฤษภาคม', value: '05' },
    { label: 'มิถุนายน', value: '06' },
    { label: 'กรกฎาคม', value: '07' },
    { label: 'สิงหาคม', value: '08' },
    { label: 'กันยายน', value: '09' },
    { label: 'ตุลาคม', value: '10' },
    { label: 'พฤศจิกายน', value: '11' },
    { label: 'ธันวาคม', value: '12' },
  ]);

/** ตัวเลือกรอบสอบสำหรับ dropdown */
export const fetchRoundOptions = (): Promise<ExamReportOption[]> =>
  simulateNetwork([
    { label: '1/2026', value: '1/2026' },
    { label: '2/2026', value: '2/2026' },
    { label: '3/2026', value: '3/2026' },
    { label: '4/2026', value: '4/2026' },
    { label: '5/2026', value: '5/2026' },
    { label: '6/2026', value: '6/2026' },
  ]);

/**
 * ดึงข้อมูลสรุปทั้งหน้ารายงานการสอบ
 * (mock — ค่าตามดีไซน์ Figma; ยังไม่กรองตาม filter จริง)
 */
export const fetchExamReportSummary = (
  filter: ExamReportFilter,
): Promise<ExamReportSummary> => {
  // TODO: ส่ง filter ไปกรองข้อมูลกับ API จริงเมื่อพร้อม (ตอนนี้ mock ทั้งหมด)
  void filter;

  const summary: ExamReportSummary = {
    statCards: [
      {
        key: 'applicant',
        icon: 'people',
        iconColorVar: '--exam-report-stat-applicant',
        iconBgVar: '--exam-report-stat-applicant-bg',
        label: 'จำนวนผู้สมัคร',
        value: 12540,
        unit: 'คน',
        trend: 'up',
        changePercent: 12,
        comparePrevious: 'จากปีที่แล้ว (11,200 คน)',
        visual: 'none',
      },
      {
        key: 'attended',
        icon: 'check_circle',
        iconColorVar: '--exam-report-stat-attended',
        iconBgVar: '--exam-report-stat-attended-bg',
        label: 'ผู้เข้าสอบ',
        value: 11230,
        unit: 'คน',
        trend: 'up',
        changePercent: 8,
        comparePrevious: 'จากปีที่แล้ว (10,400 คน)',
        visual: 'donut',
        donutPercent: 89,
        donutCaption: 'อัตราการเข้าสอบ',
      },
      {
        key: 'absent',
        icon: 'block',
        iconColorVar: '--exam-report-stat-absent',
        iconBgVar: '--exam-report-stat-absent-bg',
        label: 'ขาดสอบ',
        value: 1310,
        unit: 'คน',
        trend: 'up',
        changePercent: 12,
        comparePrevious: 'จากปีที่แล้ว (1,170 คน)',
        visual: 'donut',
        donutPercent: 11,
        donutCaption: 'อัตราการขาดสอบ',
      },
      {
        key: 'averageScore',
        icon: 'bar_chart',
        iconColorVar: '--exam-report-stat-score',
        iconBgVar: '--exam-report-stat-score-bg',
        label: 'คะแนนเฉลี่ย',
        value: 635,
        unit: 'คะแนน',
        trend: 'up',
        changePercent: 7,
        comparePrevious: 'จากปีที่แล้ว (593 คะแนน)',
        visual: 'sparkline',
        sparkline: [560, 580, 575, 600, 610, 620, 635],
      },
    ],
    attendanceChart: {
      categories: ['2022', '2023', '2024', '2025', '2026'],
      attended: [300, 420, 334, 350, 299],
      absent: [20, 30, 16, 6, 1],
    },
    trendChart: {
      categories: ['2022', '2023', '2024', '2025', '2026'],
      registered: [200, 450, 500, 500, 600],
    },
    rounds: [
      { round: '1/2026', date: '15 พ.ย. 2568', registered: 320, attended: 290, absent: 30 },
      { round: '2/2026', date: '24 ม.ค. 2569', registered: 310, attended: 300, absent: 10 },
      { round: '3/2026', date: '7 มี.ค. 2569', registered: 290, attended: 250, absent: 40 },
      { round: '4/2026', date: '16 พ.ค. 2569', registered: 315, attended: 280, absent: 35 },
      { round: '5/2026', date: '11 ก.ค. 2569', registered: 310, attended: null, absent: null },
      { round: '6/2026', date: '12 ก.ย. 2569', registered: null, attended: null, absent: null },
    ],
    scoreSummaryChart: {
      years: ['2565', '2566', '2567', '2568', '2569'],
      series: [
        { name: '40-49', colorVar: '--exam-report-score-40', data: [177, 152, 155, 166, 199] },
        { name: '50-59', colorVar: '--exam-report-score-50', data: [66, 67, 52, 66, 45] },
        { name: '60-69', colorVar: '--exam-report-score-60', data: [111, 91, 99, 122, 144] },
        { name: '70-79', colorVar: '--exam-report-score-70', data: [80, 90, 70, 50, 120] },
        { name: '80-100', colorVar: '--exam-report-score-80', data: [40, 50, 38, 100, 54] },
      ],
    },
  };

  return simulateNetwork(summary);
};
