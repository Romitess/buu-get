import JsBarcode from 'jsbarcode';

const PLACEHOLDER_VALUES = new Set(['-', '—', 'N/A', 'n/a']);

/**
 * Normalize barcode payload for Code128 encoding.
 * Returns null when the value is missing or a known placeholder (fail-closed).
 */
export function normalizeBarcodePayload(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return null;
  return trimmed;
}

/**
 * Render a Code128 barcode into an SVG element.
 * Clears the SVG and returns false when the payload is invalid or encoding fails.
 */
export function renderVoucherBarcode(
  svg: SVGSVGElement | null | undefined,
  value: string | null | undefined,
): boolean {
  if (!svg) return false;

  const payload = normalizeBarcodePayload(value);
  clearSvg(svg);

  if (!payload) return false;

  try {
    JsBarcode(svg, payload, {
      format: 'CODE128',
      displayValue: false,
      height: 48,
      width: 2,
      margin: 8,
      // Transparent so voucher card background shows through (no white box)
      background: 'transparent',
      lineColor: '#000000',
    });
    return true;
  } catch {
    clearSvg(svg);
    return false;
  }
}

function clearSvg(svg: SVGSVGElement): void {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.removeAttribute('viewBox');
  svg.removeAttribute('style');
}
