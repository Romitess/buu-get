import * as XLSX from 'xlsx';

export interface FinanceReportColumn {
  label: string;
  value: (row: object) => string | number;
  align?: 'left' | 'right' | 'center';
}

export interface FinanceReportSection {
  title?: string;
  rows: readonly object[];
  totalLabel?: string;
  totalValue?: string | number;
}

export const readReportField = (row: object, field: string): string | number => {
  const value = Object.getOwnPropertyDescriptor(row, field)?.value as unknown;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' || typeof value === 'boolean') return String(value);
  return '';
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const cellText = (value: string | number): string => String(value);

export const downloadFinanceReportXlsx = (options: {
  fileName: string;
  title: string;
  subtitle?: string;
  columns: FinanceReportColumn[];
  sections: FinanceReportSection[];
}): void => {
  const aoa: unknown[][] = [[options.title]];
  if (options.subtitle) aoa.push([options.subtitle]);
  aoa.push([]);

  for (const section of options.sections) {
    if (section.title) aoa.push([section.title]);
    aoa.push(options.columns.map((column) => column.label));
    for (const row of section.rows) {
      aoa.push(options.columns.map((column) => column.value(row)));
    }
    if (section.totalLabel) {
      const totalRow = options.columns.map(() => '');
      totalRow[0] = section.totalLabel;
      totalRow[totalRow.length - 1] = cellText(section.totalValue ?? '');
      aoa.push(totalRow);
    }
    aoa.push([]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, options.fileName);
};

export const printFinanceReport = (options: {
  title: string;
  subtitle?: string;
  columns: FinanceReportColumn[];
  sections: FinanceReportSection[];
}): boolean => {
  const popup = window.open('', '_blank');
  if (!popup) return false;

  const header = options.columns
    .map((column) => `<th class="${column.align ?? 'left'}">${escapeHtml(column.label)}</th>`)
    .join('');

  const sections = options.sections
    .map((section) => {
      const body = section.rows
        .map((row) => {
          const cells = options.columns
            .map(
              (column) =>
                `<td class="${column.align ?? 'left'}">${escapeHtml(cellText(column.value(row)))}</td>`,
            )
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');
      const total = section.totalLabel
        ? `<tr><td colspan="${Math.max(options.columns.length - 1, 1)}"><strong>${escapeHtml(section.totalLabel)}</strong></td><td class="right"><strong>${escapeHtml(cellText(section.totalValue ?? ''))}</strong></td></tr>`
        : '';
      const heading = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : '';
      return `${heading}<table><thead><tr>${header}</tr></thead><tbody>${body}${total}</tbody></table>`;
    })
    .join('');

  popup.document.write(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.title)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" />
  <style>
    body { font-family: Sarabun, sans-serif; margin: 24px; color: #111; }
    h1, h2, p { text-align: center; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    h2 { font-size: 14px; text-align: left; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
    th, td { border: 1px solid #333; padding: 4px 6px; vertical-align: top; }
    th { background: #f3f3f3; }
    .right { text-align: right; }
    .center { text-align: center; }
    .left { text-align: left; }
  </style>
</head>
<body>
  <h1>${escapeHtml(options.title)}</h1>
  ${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ''}
  ${sections}
</body>
</html>`);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 400);
  return true;
};

export const formatReportDateTime = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatReportDate = (value?: string | null): string => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatReportAmount = (value: number): string =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
