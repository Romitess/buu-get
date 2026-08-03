import { api } from 'src/boot/axios';
import type { ExamScoreLineDto } from 'src/types/score-rubric';

export interface BackendExamScore {
  SCORES_ID: number;
  ERM_ID: number;
  SC_LANG_USE_SCORE?: number | string | null;
  SC_READING_SCORE?: number | string | null;
  SC_TOTAL_SCORE?: number | string | null;
  SC_BAND_LEVEL?: number | string | null;
  LINES?: ExamScoreLineDto[];
  CERTIFICATES?: {
    CERT_ID: number;
    CERT_ISSUED_AT: string;
    CERT_EXPIRES_AT: string;
    CERT_CODE: string;
  }[];
}

export interface ExamScoreLinePayload {
  SRBI_ID: number;
  score: number;
}

export interface SaveExamScorePayload {
  ERM_ID: number;
  lines: ExamScoreLinePayload[];
  SC_BAND_LEVEL: number;
}

interface PaginatedExamScores {
  data: BackendExamScore[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Relative to axios baseURL (usually ends with `/api`) → `/api/exam-scores` */
const SCORE_ENDPOINT = '/exam-scores';
const SCORE_PAGE_LIMIT = 100;

const unwrapExamScoresPage = (
  body: BackendExamScore[] | PaginatedExamScores,
): { rows: BackendExamScore[]; totalPages: number } => {
  if (Array.isArray(body)) {
    return { rows: body, totalPages: 1 };
  }
  const rows = Array.isArray(body.data) ? body.data : [];
  const totalPages = body.meta?.totalPages && body.meta.totalPages > 0 ? body.meta.totalPages : 1;
  return { rows, totalPages };
};

export const fetchExamScores = async (): Promise<BackendExamScore[]> => {
  const all: BackendExamScore[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await api.get<BackendExamScore[] | PaginatedExamScores>(SCORE_ENDPOINT, {
      params: { page, limit: SCORE_PAGE_LIMIT },
    });
    const parsed = unwrapExamScoresPage(response.data);
    all.push(...parsed.rows);
    totalPages = parsed.totalPages;
    page += 1;
  } while (page <= totalPages);

  return all;
};

export const createExamScore = async (payload: SaveExamScorePayload): Promise<BackendExamScore> => {
  const response = await api.post<BackendExamScore>(SCORE_ENDPOINT, payload);
  return response.data;
};

export const updateExamScore = async (
  scoreId: number,
  payload: SaveExamScorePayload,
): Promise<BackendExamScore> => {
  const response = await api.patch<BackendExamScore>(`${SCORE_ENDPOINT}/${scoreId}`, payload);
  return response.data;
};
