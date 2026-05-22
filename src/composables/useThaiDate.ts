import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';

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
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${day}/${month}/${year}`;
  };

  /**
   * Format วันที่เป็น "15 พ.ย. 2569"
   */
  const formatThaiDateShort = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate();
    const monthName = THAI_SHORT_MONTHS[date.getMonth()] ?? '';
    const year = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${day} ${monthName} ${year}`;
  };

  /**
   * Format ช่วงวันที่เปิดรับสมัคร
   * - กรณีเดือนเดียวกัน: "7 - 25 ต.ค. 2569"
   * - กรณีข้ามเดือน: "7 ต.ค. - 25 พ.ย. 2569"
   */
  const formatThaiDateRange = (startDateStr: string, endDateStr: string): string => {
    if (!startDateStr || !endDateStr) return '-';
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();
    const startMonthName = THAI_SHORT_MONTHS[startMonth] ?? '';
    const endMonthName = THAI_SHORT_MONTHS[endMonth] ?? '';
    const endYear = endDate.getFullYear() + BUDDHIST_YEAR_OFFSET;

    if (startMonth === endMonth && startDate.getFullYear() === endDate.getFullYear()) {
      // Same month: "7 - 25 ต.ค. 2569"
      return `${startDay} - ${endDay} ${endMonthName} ${endYear}`;
    }
    // Different months: "7 ต.ค. - 25 พ.ย. 2569"
    return `${startDay} ${startMonthName} - ${endDay} ${endMonthName} ${endYear}`;
  };

  /**
   * คำนวณจำนวนวันระหว่าง 2 วันที่
   */
  const calcDaysDiff = (startDateStr: string, endDateStr: string): number => {
    if (!startDateStr || !endDateStr) return 0;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const diff = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diff / MS_PER_DAY);
  };

  return { formatThaiDate, formatThaiDateShort, formatThaiDateRange, calcDaysDiff };
}
