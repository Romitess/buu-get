import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';

/**
 * Formats a parseable date string as a long Thai (Buddhist-era) date,
 * e.g. "15 พฤษภาคม 2569".
 *
 * Month names are supplied by the caller (typically resolved from i18n) so this
 * helper stays free of any framework/i18n dependency and is easy to unit-test.
 *
 * @param dateStr       any value accepted by `new Date()`
 * @param getMonthName  resolver returning the localized month name for a
 *                       0-based month index (0 = January)
 */
export const formatThaiLongDate = (
  dateStr: string,
  getMonthName: (monthIndex: number) => string,
): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
  return `${day} ${month} ${year}`;
};

/**
 * Converts a Buddhist Era date string (DD/MM/YYYY) to Christian Era date string (YYYY-MM-DD)
 */
export const beToCeString = (beStr: string | undefined): string => {
  if (!beStr) return '';
  const parts = beStr.split('/');
  if (parts.length === 3) {
    const day = parts[0];
    const month = parts[1];
    const yearStr = parts[2];
    if (day && month && yearStr) {
      const beYear = parseInt(yearStr, 10);
      const ceYear = beYear - BUDDHIST_YEAR_OFFSET;
      return `${ceYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  return '';
};

/**
 * Converts a Christian Era date string (YYYY-MM-DD) to Buddhist Era date string (DD/MM/YYYY)
 */
export const ceToBeString = (ceStr: string | undefined): string => {
  if (!ceStr) return '';
  const parts = ceStr.split('-');
  if (parts.length === 3) {
    const yearStr = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (yearStr && month && day) {
      const year = parseInt(yearStr, 10);
      const beYear = year + BUDDHIST_YEAR_OFFSET;
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${beYear}`;
    }
  }
  return '';
};
