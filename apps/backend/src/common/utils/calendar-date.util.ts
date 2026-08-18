const BANGKOK_TZ = 'Asia/Bangkok';

/** Calendar date (YYYY-MM-DD) in Asia/Bangkok for the given instant. */
export function getBangkokDateOnly(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK_TZ }).format(
    date,
  );
}

/** Previous Bangkok calendar date (YYYY-MM-DD) relative to the given instant. */
export function getYesterdayBangkokDateOnly(date: Date = new Date()): string {
  const today = getBangkokDateOnly(date);
  const [yearText, monthText, dayText] = today.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  return getBangkokDateOnly(new Date(utcNoon - 24 * 60 * 60 * 1000));
}

/** Normalize ISO/date input to a Bangkok calendar date (YYYY-MM-DD). */
export function toBangkokDateOnly(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return getBangkokDateOnly(date);
}

/** True when the Bangkok calendar day is after today in Bangkok. */
export function isFutureBangkokDate(value: string | Date): boolean {
  return toBangkokDateOnly(value) > getBangkokDateOnly();
}
