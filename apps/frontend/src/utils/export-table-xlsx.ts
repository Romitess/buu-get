import * as XLSX from 'xlsx';
import type { QTableColumn } from 'quasar';

export interface SheetExportGroup<T extends object> {
  sheetName: string;
  rows: T[];
}

const INVALID_SHEET_CHARS = /[:\\/?*[\]]/g;

/**
 * Excel sheet names max 31 chars and cannot contain : \ / ? * [ ]
 */
export const sanitizeExcelSheetName = (name: string, usedNames: Set<string>): string => {
  const cleaned = name.replace(INVALID_SHEET_CHARS, '_').trim() || 'Sheet';
  let base = cleaned.slice(0, 31);
  let candidate = base;
  let suffix = 2;

  while (usedNames.has(candidate)) {
    const suffixText = ` (${suffix})`;
    base = cleaned.slice(0, Math.max(1, 31 - suffixText.length));
    candidate = `${base}${suffixText}`;
    suffix += 1;
  }

  usedNames.add(candidate);
  return candidate;
};

const resolveCellValue = <T extends object>(
  column: QTableColumn,
  row: T,
): string | number | boolean | null => {
  let val: unknown;

  if (typeof column.field === 'function') {
    val = column.field(row);
  } else if (typeof column.field === 'string') {
    val = (row as Record<string, unknown>)[column.field];
  }

  if (column.format) {
    val = column.format(val, row);
  }

  if (val === null || val === undefined) return null;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return val;
  }

  return JSON.stringify(val);
};

const buildSheetAoA = <T extends object>(columns: QTableColumn[], rows: T[]): unknown[][] => {
  const exportableColumns = columns.filter((col) => col.name !== 'tools' && col.name !== 'actions');
  const header = exportableColumns.map((col) => col.label);
  const data = rows.map((row) => exportableColumns.map((col) => resolveCellValue(col, row)));
  return [header, ...data];
};

/**
 * Build a multi-sheet .xlsx workbook and trigger a browser download.
 * CSV cannot represent multiple sheets; Excel (.xlsx) is used instead.
 */
export const downloadMultiSheetXlsx = <T extends object>(options: {
  columns: QTableColumn[];
  sheets: SheetExportGroup<T>[];
  fileName: string;
}): void => {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const sheet of options.sheets) {
    if (sheet.rows.length === 0) continue;

    const sheetName = sanitizeExcelSheetName(sheet.sheetName, usedNames);
    const aoa = buildSheetAoA(options.columns, sheet.rows);
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  if (workbook.SheetNames.length === 0) {
    throw new Error('NO_SHEETS');
  }

  XLSX.writeFile(workbook, options.fileName);
};

/**
 * Group table rows by a key, preserving first-seen order of groups.
 */
export const groupRowsByKey = <T extends object>(
  rows: T[],
  getKey: (row: T) => string,
): SheetExportGroup<T>[] => {
  const groups = new Map<string, T[]>();

  for (const row of rows) {
    const key = getKey(row) || 'Sheet';
    const existing = groups.get(key);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  return [...groups.entries()].map(([sheetName, sheetRows]) => ({
    sheetName,
    rows: sheetRows,
  }));
};
