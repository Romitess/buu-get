export function buildReceiptNo(
  rcNo: string | null | undefined,
  rcId: number,
  referenceDate: Date | null | undefined,
  fallbackDate: Date,
): string {
  if (rcNo) return rcNo;

  // Fallback for legacy receipts or cases where RC_NO is not yet assigned
  const year = (referenceDate ?? fallbackDate).getFullYear();
  return `RC${year}-${String(rcId).padStart(5, '0')}`;
}
