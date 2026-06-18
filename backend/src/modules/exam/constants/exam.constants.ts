export const EXAM_TYPE = {
  GENERAL: 'รอบทั่วไป',
  SPECIAL: 'รอบพิเศษ',
} as const;

export type ExamType = (typeof EXAM_TYPE)[keyof typeof EXAM_TYPE];
