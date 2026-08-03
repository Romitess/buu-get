export interface ScoreRubricItemDto {
  id: number;
  nameTh: string;
  nameEn: string;
  code: string | null;
  maxScore: number;
  sortOrder: number;
}

export interface ScoreRubricDto {
  id: number;
  nameTh: string;
  nameEn: string;
  isDefault: boolean;
  items: ScoreRubricItemDto[];
}

export interface ScoreRubricItemInput {
  nameTh: string;
  nameEn: string;
  maxScore?: number;
  sortOrder: number;
  code?: string;
}

export interface CreateScoreRubricPayload {
  nameTh: string;
  nameEn: string;
  items: ScoreRubricItemInput[];
}

export interface UpdateScoreRubricPayload {
  nameTh?: string;
  nameEn?: string;
  items?: ScoreRubricItemInput[];
}

export interface BackendScoreRubricItem {
  SRBI_ID: number;
  SRB_ID: number;
  SRBI_NAME_TH: string;
  SRBI_NAME_EN: string;
  SRBI_CODE: string | null;
  SRBI_MAX_SCORE: number | string;
  SRBI_SORT_ORDER: number;
}

export interface BackendScoreRubric {
  SRB_ID: number;
  SRB_NAME_TH: string;
  SRB_NAME_EN: string;
  SRB_IS_DEFAULT: boolean;
  ITEMS?: BackendScoreRubricItem[];
}

export interface ExamScoreLineDto {
  SCL_ID?: number;
  SRBI_ID: number | null;
  SCL_NAME_TH: string;
  SCL_NAME_EN: string;
  SCL_MAX_SCORE: number | string;
  SCL_SORT_ORDER: number;
  SCL_SCORE: number | string | null;
}
