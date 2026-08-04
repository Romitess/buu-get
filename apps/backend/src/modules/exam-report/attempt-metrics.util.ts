/**
 * รวมเมตริกผู้สอบครั้งเดียว / สอบซ้ำ จากแถว enrollment ที่มีคะแนนใน window
 * โดยแต่ละแถวระบุแล้วว่ามี prior scored attempt (lifetime) หรือไม่
 *
 * ใช้เป็นกฎเดียวกับ SQL COUNT(DISTINCT … EXISTS prior) ใน ExamReportService
 */
export interface ScoredWindowAttempt {
  userId: number;
  year: number;
  /** มี enrollment มีคะแนนก่อนหน้า (เรียง EXAM_DATE แล้ว EXAM_ID) */
  hasPriorScore: boolean;
}

export interface AttemptMetrics {
  /** ปี → จำนวนคน (DISTINCT) ที่เป็นผู้สอบซ้ำในปีนั้น */
  repeatByYear: Map<number, number>;
  attemptProportion: {
    firstTime: number;
    repeat: number;
  };
}

export function buildAttemptMetrics(
  scoredInWindow: ScoredWindowAttempt[],
): AttemptMetrics {
  const scoredUsers = new Set<number>();
  const repeatUsers = new Set<number>();
  const repeatUsersByYear = new Map<number, Set<number>>();

  scoredInWindow.forEach((row) => {
    scoredUsers.add(row.userId);
    if (!row.hasPriorScore) {
      return;
    }

    repeatUsers.add(row.userId);
    const yearSet = repeatUsersByYear.get(row.year) ?? new Set<number>();
    yearSet.add(row.userId);
    repeatUsersByYear.set(row.year, yearSet);
  });

  const repeatByYear = new Map<number, number>();
  repeatUsersByYear.forEach((users, year) => {
    repeatByYear.set(year, users.size);
  });

  return {
    repeatByYear,
    attemptProportion: {
      firstTime: scoredUsers.size - repeatUsers.size,
      repeat: repeatUsers.size,
    },
  };
}
