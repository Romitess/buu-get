import { describe, expect, it } from 'vitest';
import { codeToScanChar, normalizeScanPayload } from 'src/utils/scan-keyboard';

describe('codeToScanChar', () => {
  it('maps digit row codes to ASCII digits', () => {
    expect(codeToScanChar('Digit0')).toBe('0');
    expect(codeToScanChar('Digit6')).toBe('6');
    expect(codeToScanChar('Digit9')).toBe('9');
  });

  it('maps numpad digit codes', () => {
    expect(codeToScanChar('Numpad1')).toBe('1');
    expect(codeToScanChar('Numpad0')).toBe('0');
  });

  it('maps letter keys to uppercase ASCII', () => {
    expect(codeToScanChar('KeyA')).toBe('A');
    expect(codeToScanChar('KeyZ')).toBe('Z');
  });

  it('maps minus keys', () => {
    expect(codeToScanChar('Minus')).toBe('-');
    expect(codeToScanChar('NumpadSubtract')).toBe('-');
  });

  it('returns null for unrelated codes', () => {
    expect(codeToScanChar('Enter')).toBeNull();
    expect(codeToScanChar('ShiftLeft')).toBeNull();
    expect(codeToScanChar('Space')).toBeNull();
  });
});

describe('normalizeScanPayload', () => {
  it('keeps ASCII identifiers', () => {
    expect(normalizeScanPayload('691011001')).toBe('691011001');
    expect(normalizeScanPayload(' AB-12 ')).toBe('AB-12');
  });

  it('maps Thai Kedmanee digit-row glyphs to ASCII digits', () => {
    // Key 3 under Kedmanee is ASCII "-" (kept for passport); scanners use event.code for "3"
    expect(normalizeScanPayload('ๅ/-ภถุึคตจ')).toBe('12-4567890');
    // Physical keys for 691011001 under Kedmanee
    expect(normalizeScanPayload('ุตๅจๅๅจจๅ')).toBe('691011001');
  });
});
