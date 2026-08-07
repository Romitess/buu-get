import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';
import { parseBangkokDate } from 'src/services/exam.service';

/** ชื่อเดือนย่อภาษาไทย */
const THAI_SHORT_MONTHS: string[] = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

/** Milliseconds per day for duration calculation */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function useThaiDate() {
  const formatThaiDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const { year, month, day } = parseBangkokDate(dateStr);
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const bYear = year + BUDDHIST_YEAR_OFFSET;
    return `${dayStr}/${monthStr}/${bYear}`;
  };

  /**
   * Format วันที่เป็น "15 พ.ย. 2569"
   */
  const formatThaiDateShort = (dateStr: string): string => {
    if (!dateStr) return '-';
    const { year, month, day } = parseBangkokDate(dateStr);
    const monthName = THAI_SHORT_MONTHS[month - 1] ?? '';
    const bYear = year + BUDDHIST_YEAR_OFFSET;
    return `${day} ${monthName} ${bYear}`;
  };

  /**
   * Format ช่วงวันที่เปิดรับสมัคร
   * - กรณีวันเดียว: "7 ส.ค. 2569"
   * - กรณีเดือนเดียวกัน: "7 - 25 ต.ค. 2569"
   * - กรณีข้ามเดือน: "7 ต.ค. - 25 พ.ย. 2569"
   */
  const formatThaiDateRange = (startDateStr: string, endDateStr: string): string => {
    if (!startDateStr || !endDateStr) return '-';
    const start = parseBangkokDate(startDateStr);
    const end = parseBangkokDate(endDateStr);

    const startDay = start.day;
    const endDay = end.day;
    const startMonth = start.month;
    const endMonth = end.month;
    const startMonthName = THAI_SHORT_MONTHS[startMonth - 1] ?? '';
    const endMonthName = THAI_SHORT_MONTHS[endMonth - 1] ?? '';
    const endYear = end.year + BUDDHIST_YEAR_OFFSET;

    if (startDay === endDay && startMonth === endMonth && start.year === end.year) {
      return `${startDay} ${endMonthName} ${endYear}`;
    }

    if (startMonth === endMonth && start.year === end.year) {
      return `${startDay} - ${endDay} ${endMonthName} ${endYear}`;
    }

    return `${startDay} ${startMonthName} - ${endDay} ${endMonthName} ${endYear}`;
  };

  /**
   * คำนวณจำนวนวันระหว่าง 2 วันที่
   */
  const calcDaysDiff = (startDateStr: string, endDateStr: string): number => {
    if (!startDateStr || !endDateStr) return 0;
    const start = parseBangkokDate(startDateStr);
    const end = parseBangkokDate(endDateStr);
    const startDate = new Date(start.year, start.month - 1, start.day);
    const endDate = new Date(end.year, end.month - 1, end.day);
    const diff = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diff / MS_PER_DAY);
  };

  return { formatThaiDate, formatThaiDateShort, formatThaiDateRange, calcDaysDiff };
}
