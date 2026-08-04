import { api } from 'src/boot/axios';
import type {
  CreateScoreRubricPayload,
  ScoreRubricDto,
  UpdateScoreRubricPayload,
} from 'src/types/score-rubric';

const ENDPOINT = '/score-rubrics';

export const fetchScoreRubrics = async (): Promise<ScoreRubricDto[]> => {
  const response = await api.get<ScoreRubricDto[]>(ENDPOINT);
  return response.data;
};

export const fetchScoreRubricById = async (id: number): Promise<ScoreRubricDto> => {
  const response = await api.get<ScoreRubricDto>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const createScoreRubric = async (
  payload: CreateScoreRubricPayload,
): Promise<ScoreRubricDto> => {
  const response = await api.post<ScoreRubricDto>(ENDPOINT, payload);
  return response.data;
};

export const updateScoreRubric = async (
  id: number,
  payload: UpdateScoreRubricPayload,
): Promise<ScoreRubricDto> => {
  const response = await api.patch<ScoreRubricDto>(`${ENDPOINT}/${id}`, payload);
  return response.data;
};

export const deleteScoreRubric = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};
