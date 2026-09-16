import type { PaginatedResponse } from './pagination';

export interface MsgPersonRole {
  ROLE_ID: number;
  ROLE_NAME: string;
  ROLE_DESCRIPTION?: string;
}

export interface MsgPerson {
  PSN_ID: string;
  PRF_NAMETH: string | null;
  PRF_NAMEEN: string | null;
  PSN_FNAMETH: string | null;
  PSN_FNAMEEN: string | null;
  PSN_LNAMETH: string | null;
  PSN_LNAMEEN: string | null;
  PSN_EMAIL_BUU: string | null;
  PSN_IDCARD: string | null;
  PSN_RETIRE: 'N' | 'Y' | null;
  PSN_TECHNIQUE: string | null;
  PSN_USERNAME: string | null;
  ROLES?: MsgPersonRole[];
}

export interface MsgPersonsListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  excludeRetired?: boolean;
}

export type MsgPersonsListResponse = PaginatedResponse<MsgPerson>;

export interface UpdateMsgPersonRolesPayload {
  roleIds: number[];
}

export interface SystemRole {
  ROLE_ID: number;
  ROLE_NAME: string;
  ROLE_DESCRIPTION: string;
}
