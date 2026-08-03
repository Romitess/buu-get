import type { ScoreRubricItemDto } from 'src/types/score-rubric';
import type { BackendExamScore, ExamScoreLinePayload } from 'src/services/exam-score.service';

export interface ScoreDraft {
  lineScores: Record<number, number>;
  scoreTotal: number;
  band: number;
}

export const calculateBand = (total: number): number => {
  if (total >= 80) return 5;
  if (total >= 70) return 4;
  if (total >= 60) return 3;
  if (total >= 50) return 2;
  if (total >= 40) return 1;
  return 0;
};

export const rubricItemsFromExam = (
  exam:
    | {
        SCORE_RUBRIC?: {
          ITEMS?: Array<{
            SRBI_ID: number;
            SRBI_NAME_TH: string;
            SRBI_NAME_EN: string;
            SRBI_CODE: string | null;
            SRBI_MAX_SCORE: number | string;
            SRBI_SORT_ORDER: number;
            DELETED_AT?: string | null;
          }>;
        };
      }
    | null
    | undefined,
): ScoreRubricItemDto[] => {
  const items = exam?.SCORE_RUBRIC?.ITEMS ?? [];
  return items
    .filter((item) => !item.DELETED_AT)
    .sort((a, b) => a.SRBI_SORT_ORDER - b.SRBI_SORT_ORDER)
    .map((item) => ({
      id: item.SRBI_ID,
      nameTh: item.SRBI_NAME_TH,
      nameEn: item.SRBI_NAME_EN,
      code: item.SRBI_CODE,
      maxScore: Number(item.SRBI_MAX_SCORE),
      sortOrder: item.SRBI_SORT_ORDER,
    }));
};

export const sumLineScores = (
  rubricItems: ScoreRubricItemDto[],
  lineScores: Record<number, number>,
): number => {
  return rubricItems.reduce((sum, item) => sum + (lineScores[item.id] ?? 0), 0);
};

export const buildScoreDraftFromScore = (
  score: BackendExamScore | undefined,
  rubricItems: ScoreRubricItemDto[],
): ScoreDraft => {
  const lineScores: Record<number, number> = {};

  if (score?.LINES?.length) {
    for (const line of score.LINES) {
      if (line.SRBI_ID != null) {
        lineScores[line.SRBI_ID] = Number(line.SCL_SCORE ?? 0);
      }
    }
  } else if (score) {
    for (const item of rubricItems) {
      if (item.code === 'LANG_USE') {
        lineScores[item.id] = Number(score.SC_LANG_USE_SCORE ?? 0);
      } else if (item.code === 'READING') {
        lineScores[item.id] = Number(score.SC_READING_SCORE ?? 0);
      }
    }
  }

  for (const item of rubricItems) {
    if (lineScores[item.id] === undefined) {
      lineScores[item.id] = 0;
    }
  }

  const scoreTotal = Number(score?.SC_TOTAL_SCORE ?? 0) || sumLineScores(rubricItems, lineScores);

  return {
    lineScores,
    scoreTotal,
    band: Number(score?.SC_BAND_LEVEL ?? 0) || calculateBand(scoreTotal),
  };
};

export const buildSavePayload = (
  ermId: number,
  draft: ScoreDraft,
  rubricItems: ScoreRubricItemDto[],
): { ERM_ID: number; lines: ExamScoreLinePayload[]; SC_BAND_LEVEL: number } => {
  return {
    ERM_ID: ermId,
    lines: rubricItems.map((item) => ({
      SRBI_ID: item.id,
      score: draft.lineScores[item.id] ?? 0,
    })),
    SC_BAND_LEVEL: draft.band,
  };
};

export const matchHeaderToRubricItem = (header: string, item: ScoreRubricItemDto): boolean => {
  const normalized = header.replace(/\s/g, '').toLowerCase();
  const nameTh = item.nameTh.replace(/\s/g, '').toLowerCase();
  const nameEn = item.nameEn.replace(/\s/g, '').toLowerCase();

  if (normalized.includes(nameTh) || normalized.includes(nameEn)) {
    return true;
  }

  if (item.code === 'LANG_USE') {
    return (
      normalized.includes('grammar') ||
      normalized.includes('vocab') ||
      normalized.includes('language') ||
      normalized.includes('languse') ||
      normalized.includes('lang_use')
    );
  }

  if (item.code === 'READING') {
    return normalized.includes('reading') || normalized.includes('read_score');
  }

  return false;
};

export const scoreByCode = (
  draft: ScoreDraft,
  rubricItems: ScoreRubricItemDto[],
  code: string,
): number => {
  const item = rubricItems.find((r) => r.code === code);
  if (!item) return 0;
  return draft.lineScores[item.id] ?? 0;
};

export const buildCertificateScoreLines = (
  score:
    | {
        LINES?: Array<{
          SCL_NAME_TH: string;
          SCL_NAME_EN: string;
          SCL_MAX_SCORE: number | string;
          SCL_SORT_ORDER: number;
          SCL_SCORE: number | string | null;
        }>;
        SC_LANG_USE_SCORE?: number | string | null;
        SC_READING_SCORE?: number | string | null;
      }
    | undefined,
): Array<{
  nameTh: string;
  nameEn: string;
  score: number;
  maxScore: number;
  sortOrder: number;
}> => {
  if (score?.LINES?.length) {
    return [...score.LINES]
      .sort((a, b) => a.SCL_SORT_ORDER - b.SCL_SORT_ORDER)
      .map((line) => ({
        nameTh: line.SCL_NAME_TH,
        nameEn: line.SCL_NAME_EN,
        score: Number(line.SCL_SCORE ?? 0),
        maxScore: Number(line.SCL_MAX_SCORE),
        sortOrder: line.SCL_SORT_ORDER,
      }));
  }

  return [
    {
      nameTh: 'คำศัพท์และไวยากรณ์',
      nameEn: 'Vocabulary & Grammar',
      score: Number(score?.SC_LANG_USE_SCORE ?? 0),
      maxScore: 50,
      sortOrder: 1,
    },
    {
      nameTh: 'ทักษะการอ่าน',
      nameEn: 'Reading',
      score: Number(score?.SC_READING_SCORE ?? 0),
      maxScore: 50,
      sortOrder: 2,
    },
  ];
};
