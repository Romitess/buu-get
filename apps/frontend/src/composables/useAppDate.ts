import { useI18n } from 'vue-i18n';
import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';

/** Milliseconds per day for duration calculation */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function useAppDate() {
  const { locale } = useI18n();

  /**
   * Get formatting options based on locale
   */
  const getLocaleOptions = () => {
    const isThai = locale.value === 'th';
    return {
      locale: isThai ? 'th-TH' : 'en-US',
      yearOffset: isThai ? BUDDHIST_YEAR_OFFSET : 0,
    };
  };

  /**
   * Format date as "DD/MM/YYYY" (localized year)
   */
  const formatDate = (dateStr: string | Date): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    const { yearOffset } = getLocaleOptions();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + yearOffset;
    return `${day}/${month}/${year}`;
  };

  /**
   * Format date as "15 Nov 2026" or "15 พ.ย. 2569"
   */
  const formatDateShort = (dateStr: string | Date): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);

    const { locale: loc, yearOffset } = getLocaleOptions();

    // Use Intl for month name
    const monthName = new Intl.DateTimeFormat(loc, { month: 'short' }).format(date);
    const day = date.getDate();
    const year = date.getFullYear() + yearOffset;

    return `${day} ${monthName} ${year}`;
  };

  /**
   * Format date range localized
   * - Same day: "7 ส.ค. 2569" / "7 Aug 2026"
   * - Same month: "7 - 25 ต.ค. 2569" / "7 - 25 Oct 2026"
   * - Different months: "7 ต.ค. - 25 พ.ย. 2569" / "7 Oct - 25 Nov 2026"
   */
  const formatDateRange = (startDateStr: string | Date, endDateStr: string | Date): string => {
    if (!startDateStr || !endDateStr) return '-';
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';

    const { locale: loc, yearOffset } = getLocaleOptions();

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const startMonthName = new Intl.DateTimeFormat(loc, { month: 'short' }).format(startDate);
    const endMonthName = new Intl.DateTimeFormat(loc, { month: 'short' }).format(endDate);
    const displayEndYear = endYear + yearOffset;

    if (startDay === endDay && startMonth === endMonth && startYear === endYear) {
      return `${startDay} ${endMonthName} ${displayEndYear}`;
    }

    if (startMonth === endMonth && startYear === endYear) {
      return `${startDay} - ${endDay} ${endMonthName} ${displayEndYear}`;
    }

    return `${startDay} ${startMonthName} - ${endDay} ${endMonthName} ${displayEndYear}`;
  };

  /**
   * Calculate difference in days
   */
  const calcDaysDiff = (startDateStr: string | Date, endDateStr: string | Date): number => {
    if (!startDateStr || !endDateStr) return 0;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const diff = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diff / MS_PER_DAY);
  };

  /**
   * จำนวนวันเปิด–ปิดรับสมัครสำหรับแสดงผล
   * วันปฏิทินเดียวกันนับ 1 วัน แม้เวลาเปิดกับเวลาปิดจะไม่เท่ากัน
   */
  const countRegistrationDays = (
    startDateStr: string | Date,
    endDateStr: string | Date,
  ): number => {
    if (!startDateStr || !endDateStr) return 0;
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    if (
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getDate() === endDate.getDate()
    ) {
      return 1;
    }
    return calcDaysDiff(startDateStr, endDateStr) + 1;
  };

  return {
    formatDate,
    formatDateShort,
    formatDateRange,
    calcDaysDiff,
    countRegistrationDays,
  };
}
