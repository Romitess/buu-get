export const EXAM_TYPE = {
  GENERAL: 'รอบทั่วไป',
  SPECIAL: 'รอบพิเศษ',
} as const;

export type ExamType = (typeof EXAM_TYPE)[keyof typeof EXAM_TYPE];

/** Shared / individual exam passcode: exactly 6 alphanumeric characters */
export const PASSCODE_LENGTH = 6;
export const PASSCODE_PATTERN = /^[A-Za-z0-9]{6}$/;

export function normalizeExamPasscode(passcode: string): string {
  return passcode.trim().toUpperCase();
}
