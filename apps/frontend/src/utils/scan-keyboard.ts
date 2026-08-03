/**
 * Map physical KeyboardEvent.code → ASCII for barcode / ID fields.
 * Layout-independent so Thai Kedmanee does not turn digits into Thai glyphs.
 */
export function codeToScanChar(code: string): string | null {
  if (code.startsWith('Digit') && code.length === 6) {
    return code.slice(5);
  }

  if (code.startsWith('Numpad') && code.length === 7) {
    const digit = code.slice(6);
    if (digit >= '0' && digit <= '9') return digit;
    return null;
  }

  if (code.startsWith('Key') && code.length === 4) {
    return code.slice(3).toUpperCase();
  }

  if (code === 'Minus' || code === 'NumpadSubtract') {
    return '-';
  }

  return null;
}

/** Thai Kedmanee (unshifted number/letter row) → US QWERTY — paste / leftover safety net */
const KEDMANEE_TO_QWERTY: Readonly<Record<string, string>> = {
  ๅ: '1',
  '/': '2',
  // Physical key 3 under Kedmanee emits ASCII "-" — left unmapped so passport hyphens stay valid.
  // Digit "3" from scanners is handled via event.code (Digit3), not this map.
  ภ: '4',
  ถ: '5',
  'ุ': '6',
  'ึ': '7',
  ค: '8',
  ต: '9',
  จ: '0',
  ๆ: 'q',
  ไ: 'w',
  ำ: 'e',
  พ: 'r',
  ะ: 't',
  'ั': 'y',
  'ี': 'u',
  ร: 'i',
  น: 'o',
  ย: 'p',
  ฟ: 'a',
  ห: 's',
  ก: 'd',
  ด: 'f',
  เ: 'g',
  '้': 'h',
  '่': 'j',
  า: 'k',
  ส: 'l',
  ผ: 'z',
  ป: 'x',
  แ: 'c',
  อ: 'v',
  'ิ': 'b',
  'ื': 'n',
  ท: 'm',
};

/**
 * Normalize a pasted or layout-corrupted scan string toward ASCII identifiers.
 * Already-ASCII characters are kept as-is.
 */
export function normalizeScanPayload(raw: string): string {
  let result = '';
  for (const char of raw.trim()) {
    if (/[A-Za-z0-9-]/.test(char)) {
      result += char;
      continue;
    }
    const mapped = KEDMANEE_TO_QWERTY[char];
    if (mapped) {
      result += mapped;
    }
  }
  return result;
}
