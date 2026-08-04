import { describe, expect, it } from 'vitest';
import { groupRowsByKey, sanitizeExcelSheetName } from './export-table-xlsx';

describe('sanitizeExcelSheetName', () => {
  it('removes illegal characters and truncates to 31 chars', () => {
    const used = new Set<string>();
    const name = sanitizeExcelSheetName('Room A/B:C?*[long name that exceeds thirty one]', used);
    expect(name.length).toBeLessThanOrEqual(31);
    expect(name).not.toMatch(/[:\\/?*[\]]/);
    expect(used.has(name)).toBe(true);
  });

  it('deduplicates colliding sheet names', () => {
    const used = new Set<string>();
    const first = sanitizeExcelSheetName('Room 1', used);
    const second = sanitizeExcelSheetName('Room 1', used);
    expect(first).toBe('Room 1');
    expect(second).toBe('Room 1 (2)');
  });
});

describe('groupRowsByKey', () => {
  it('groups rows in first-seen order', () => {
    const rows = [
      { room: 'A', id: 1 },
      { room: 'B', id: 2 },
      { room: 'A', id: 3 },
    ];
    const groups = groupRowsByKey(rows, (row) => row.room);
    expect(groups.map((g) => g.sheetName)).toEqual(['A', 'B']);
    expect(groups[0]?.rows.map((r) => r.id)).toEqual([1, 3]);
  });
});
