const BANGKOK_TZ = 'Asia/Bangkok';

/** Calendar date (YYYY-MM-DD) in Asia/Bangkok for the given instant. */
export function getBangkokDateOnly(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK_TZ }).format(
    date,
  );
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
