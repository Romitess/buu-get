export const NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY =
  'daily_payment_summary' as const;

export type NotificationType = typeof NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY;

export function dailyPaymentSummaryDedupeKey(periodDate: string): string {
  return `${NOTIFICATION_TYPE_DAILY_PAYMENT_SUMMARY}:${periodDate}`;
}
