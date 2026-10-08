import { api } from 'src/boot/axios';

export interface CandidateAccount {
  userId: number;
  userCode: string | null;
  email: string;
  nationalId: string | null;
  passportNo: string | null;
  titleTh: string | null;
  fullNameTh: string | null;
  titleEn: string | null;
  fullNameEn: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  education: string | null;
  faculty: string | null;
  institution: string | null;
  country: string | null;
  address: string | null;
  remark: string | null;
  registeredViaThaid: boolean;
  moodleId: number | null;
}

export interface CandidateAccountPage {
  data: CandidateAccount[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateCandidateAccountPayload {
  email?: string;
  userNationalId?: string;
  userTitleTh?: string;
  userFullnameTh?: string;
  userTitleEn?: string;
  userFullnameEn?: string;
  userDateOfBirth?: string;
  userPhone?: string;
  userEducation?: string;
  userFaculty?: string;
  userInstitution?: string;
  userCountry?: string;
  userAddress?: string;
  userRemark?: string;
}

export async function fetchCandidateAccounts(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<CandidateAccountPage> {
  const response = await api.get<CandidateAccountPage>('/users/candidates', {
    params,
  });
  return response.data;
}

export async function updateCandidateAccount(
  userId: number,
  payload: UpdateCandidateAccountPayload,
): Promise<CandidateAccount> {
  const response = await api.patch<CandidateAccount>(
    `/users/candidates/${userId}`,
    payload,
  );
  return response.data;
}

export async function purgeCandidateAccount(userId: number): Promise<void> {
  await api.delete(`/users/candidates/${userId}`);
}
