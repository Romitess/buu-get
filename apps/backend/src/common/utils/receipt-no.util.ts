export function buildReceiptNo(
  rcId: number,
  referenceDate: Date | null | undefined,
  fallbackDate: Date,
): string {
  const year = (referenceDate ?? fallbackDate).getFullYear();
  return `RC${year}-${String(rcId).padStart(5, '0')}`;
}
