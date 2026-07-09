import { describe, expect, it } from 'vitest';
import { createEmptyRow, createSkeletonRows, resolveTableRowKey } from './base-table-row-keys';

describe('base-table row keys', () => {
  it('creates unique skeleton row keys', () => {
    const rows = createSkeletonRows(10);
    const keys = rows.map((row) => resolveTableRowKey(row));

    expect(new Set(keys).size).toBe(10);
    expect(keys).not.toContain(0);
  });

  it('resolves stable keys for empty and data rows', () => {
    expect(resolveTableRowKey(createEmptyRow())).toBe('__base-table-empty__');
    expect(resolveTableRowKey({ id: 'exam-1' })).toBe('exam-1');
  });
});
