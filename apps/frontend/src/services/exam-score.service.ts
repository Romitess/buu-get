import { api } from 'src/boot/axios';

export interface BackendExamScore {
  SCORES_ID: number;
  ERM_ID: number;
  SC_LANG_USE_SCORE?: number | string | null;
  SC_READING_SCORE?: number | string | null;
  SC_TOTAL_SCORE?: number | string | null;
  SC_BAND_LEVEL?: number | string | null;
  CERTIFICATES?: {
    CERT_ID: number;
    CERT_ISSUED_AT: string;
    CERT_EXPIRES_AT: string;
    CERT_CODE: string;
  }[];
}

export interface SaveExamScorePayload {
  ERM_ID: number;
  SC_LANG_USE_SCORE: number;
  SC_READING_SCORE: number;
  SC_TOTAL_SCORE: number;
  SC_BAND_LEVEL: number;
}

const SCORE_ENDPOINT = '/api/exam-scores';

export const fetchExamScores = async (): Promise<BackendExamScore[]> => {
  const response = await api.get<BackendExamScore[]>(SCORE_ENDPOINT);
  return response.data;
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
