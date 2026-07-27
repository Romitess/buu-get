/**
 * Mask national ID / tax ID for public verification pages.
 * Example: 1234567890123 → 12345****0123
 */
export function maskIdentifier(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) {
    if (trimmed.length <= 4) return '****';
    return `${trimmed.slice(0, 2)}****${trimmed.slice(-2)}`;
  }

  if (digits.length <= 4) return '****';
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}****${digits.slice(-2)}`;
  }

  return `${digits.slice(0, 5)}****${digits.slice(-4)}`;
}
