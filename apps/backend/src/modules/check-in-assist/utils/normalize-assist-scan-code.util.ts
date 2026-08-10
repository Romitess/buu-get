/** Normalize scan payload to ASCII identifiers (mirrors frontend scan-keyboard). */
export function normalizeAssistScanCode(raw: string): string {
  const trimmed = raw.trim();
  let result = '';
  for (const char of trimmed) {
    if (/[A-Za-z0-9-]/.test(char)) {
      result += char;
    }
  }
  return result.slice(0, 64);
}

export function isValidAssistScanCode(code: string): boolean {
  return code.length > 0 && /^[A-Za-z0-9-]+$/.test(code);
}
