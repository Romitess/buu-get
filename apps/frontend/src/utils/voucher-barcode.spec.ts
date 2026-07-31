import { describe, expect, it } from 'vitest';
import { normalizeBarcodePayload, renderVoucherBarcode } from 'src/utils/voucher-barcode';

describe('normalizeBarcodePayload', () => {
  it('returns trimmed payload for valid test taker ids', () => {
    expect(normalizeBarcodePayload('68014001')).toBe('68014001');
    expect(normalizeBarcodePayload('  66100001  ')).toBe('66100001');
  });

  it('returns null for empty or placeholder values', () => {
    expect(normalizeBarcodePayload('')).toBeNull();
    expect(normalizeBarcodePayload('   ')).toBeNull();
    expect(normalizeBarcodePayload('-')).toBeNull();
    expect(normalizeBarcodePayload(null)).toBeNull();
    expect(normalizeBarcodePayload(undefined)).toBeNull();
  });
});

describe('renderVoucherBarcode', () => {
  it('renders Code128 bars for a known payload', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const ok = renderVoucherBarcode(svg, '68014001');
    expect(ok).toBe(true);
    expect(svg.childNodes.length).toBeGreaterThan(0);
    expect(svg.getAttribute('viewBox') || svg.getAttribute('width')).toBeTruthy();
  });

  it('clears the SVG and returns false for empty payload', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    svg.appendChild(rect);

    const ok = renderVoucherBarcode(svg, '-');
    expect(ok).toBe(false);
    expect(svg.childNodes.length).toBe(0);
  });

  it('returns false when svg element is missing', () => {
    expect(renderVoucherBarcode(null, '68014001')).toBe(false);
  });
});
