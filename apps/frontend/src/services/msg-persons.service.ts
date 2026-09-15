import { api } from 'src/boot/axios';
import type {
  MsgPerson,
  MsgPersonsListParams,
  MsgPersonsListResponse,
  SystemRole,
  UpdateMsgPersonRolesPayload,
} from 'src/types/msg-person';

export const fetchMsgPersons = async (
  params: MsgPersonsListParams = {},
): Promise<MsgPersonsListResponse> => {
  const response = await api.get<MsgPersonsListResponse>('/msg-persons', {
    params,
  });
  return response.data;
};

export const fetchMsgPersonById = async (psnId: string): Promise<MsgPerson> => {
  const response = await api.get<MsgPerson>(`/msg-persons/${psnId}`);
  return response.data;
};

export const updateMsgPersonRoles = async (
  psnId: string,
  payload: UpdateMsgPersonRolesPayload,
): Promise<MsgPerson> => {
  const response = await api.patch<MsgPerson>(
    `/msg-persons/${psnId}/roles`,
    payload,
  );
  return response.data;
};

export const fetchSystemRoles = async (): Promise<SystemRole[]> => {
  const response = await api.get<SystemRole[]>('/roles');
  return response.data;
};
