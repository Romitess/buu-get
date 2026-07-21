import { describe, expect, it } from 'vitest';
import { numberToThaiText } from 'src/utils/thai-currency';

describe('numberToThaiText', () => {
  it('formats zero', () => {
    expect(numberToThaiText(0)).toBe('ศูนย์บาทถ้วน');
  });

  it('formats hundreds', () => {
    expect(numberToThaiText(500)).toBe('ห้าร้อยบาทถ้วน');
  });

  it('rejects negative amounts', () => {
    expect(numberToThaiText(-1)).toBe('-');
  });
});
