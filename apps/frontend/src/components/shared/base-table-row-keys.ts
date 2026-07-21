export const PLACEHOLDER_ROW_KEYS = {
  empty: '__base-table-empty__',
  skeletonPrefix: '__base-table-skeleton__',
} as const;

export type PlaceholderRow = {
  __skeleton?: boolean;
  __empty?: boolean;
  id?: string;
};

export const resolveTableRowKey = (row: unknown): string | number => {
  const record = row as PlaceholderRow & { id?: string | number };

  if (record.__empty) {
    return record.id ?? PLACEHOLDER_ROW_KEYS.empty;
  }

  if (record.__skeleton) {
    return record.id ?? PLACEHOLDER_ROW_KEYS.skeletonPrefix;
  }

  if (record.id !== undefined && record.id !== null && record.id !== '') {
    return record.id;
  }

  return JSON.stringify(record);
};

export const createSkeletonRows = (count: number): Array<{ __skeleton: true; id: string }> => {
  const skeletonRows: Array<{ __skeleton: true; id: string }> = [];

  for (let index = 0; index < count; index += 1) {
    skeletonRows.push({
      __skeleton: true,
      id: `${PLACEHOLDER_ROW_KEYS.skeletonPrefix}${index}`,
    });
  }

  return skeletonRows;
};

export const createEmptyRow = (): { __empty: true; id: string } => ({
  __empty: true,
  id: PLACEHOLDER_ROW_KEYS.empty,
});
