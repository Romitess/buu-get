import { maskIdentifier } from './mask-identifier.util';

describe('maskIdentifier', () => {
  it('returns null for empty values', () => {
    expect(maskIdentifier(null)).toBeNull();
    expect(maskIdentifier(undefined)).toBeNull();
    expect(maskIdentifier('')).toBeNull();
  });

  it('masks Thai national ID style values', () => {
    expect(maskIdentifier('1234567890123')).toBe('12345****0123');
  });

  it('masks short numeric values', () => {
    expect(maskIdentifier('1234')).toBe('****');
  });
});
