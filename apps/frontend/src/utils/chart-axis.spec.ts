import { describe, expect, it } from 'vitest';
import { getNiceYAxisMax } from 'src/utils/chart-axis';

describe('getNiceYAxisMax', () => {
  it('returns tickAmount when all values are zero or empty', () => {
    expect(getNiceYAxisMax([], 5)).toBe(5);
    expect(getNiceYAxisMax([0, 0], 6)).toBe(6);
  });

  it('rounds up above the data max with headroom', () => {
    // max 87 → target 95.7 → step 20 → 100
    expect(getNiceYAxisMax([10, 87, 40], 5)).toBe(100);
  });

  it('scales for larger series', () => {
    // max 520 → target 572 → step 100 → 600
    expect(getNiceYAxisMax([120, 520, 300], 6)).toBe(600);
  });

  it('keeps small series close to the data max', () => {
    // max 50 → target 55 → step 20 → 60
    expect(getNiceYAxisMax([50, Number.NaN, Number.POSITIVE_INFINITY], 5)).toBe(60);
  });
});
