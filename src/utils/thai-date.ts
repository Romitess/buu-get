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
