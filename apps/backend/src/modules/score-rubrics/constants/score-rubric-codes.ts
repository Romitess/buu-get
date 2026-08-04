/** รหัสภายในสำหรับ backfill / dual-write คอลัมน์ legacy */
export const SCORE_RUBRIC_ITEM_CODE = {
  LANG_USE: 'LANG_USE',
  READING: 'READING',
} as const;

export type ScoreRubricItemCode =
  (typeof SCORE_RUBRIC_ITEM_CODE)[keyof typeof SCORE_RUBRIC_ITEM_CODE];
