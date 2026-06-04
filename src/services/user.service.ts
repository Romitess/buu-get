import { ROLES } from 'src/constants/roles';
import { api } from '../boot/axios';
import type { User } from 'src/types/user';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}
// export const mockUsers: User[] = [
//   {
//     id: 1,
//     nationalId: '1234567890123',
//     passportNo: '',
//     email: '67160426@go.buu.ac.th',
//     password: '1234',
//     status: 'ACTIVE',
//     profileId: 1,
//     titleTH: 'นาย',
//     fullNameTH: 'นที บุญญานนท์',
//     titleEN: 'Mr.',
//     fullNameEN: 'Natee Boonyanon',
//     birthdate: '2005-05-23',
//     phone: '0984343014',
//     educationLevel: 'ปริญญาตรี',
//     country: 'TH',
//     province: 'ชลบุรี',
//     address: '104/13 ถ.มาบมะยมใต้ ต.แสนสุข',
//     taxId: '1234567890123',
//     thaidSynced: true,
//     role: 'user',
//   },
//   {
//     id: 2,
//     nationalId: '1111111111111',
//     passportNo: '',
//     email: 'staff@buu.ac.th',
//     password: '1234',
//     status: 'ACTIVE',
//     profileId: 2,
//     titleTH: 'นาย',
//     fullNameTH: 'เจ้าหน้าที่ ทดสอบ',
//     titleEN: 'Mr.',
//     fullNameEN: 'Staff Test',
//     birthdate: '1990-01-01',
//     phone: '0812345678',
//     educationLevel: 'ปริญญาโท',
//     country: 'TH',
//     province: 'ชลบุรี',
//     address: 'อาคารสำนักงานอธิการบดี',
//     taxId: '1111111111111',
//     thaidSynced: true,
//     role: 'staff',
//   },
// ];

/**
 * Interface สำหรับข้อมูล User ที่ได้รับจาก Backend (NestJS)
 */
export interface BackendUserResponse {
  USER_ID: number;
  USER_NATIONAL_ID: string | null;
  USER_PASSPORT_NO: string | null;
  USER_EMAIL: string;
  USER_STATUS: string;
  USER_IMAGE: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
  PROFILE?: {
    userTitleTh?: string | null;
    userFullnameTh?: string | null;
    userTitleEn?: string | null;
    userFullnameEn?: string | null;
    userDateOfBirth?: string | null;
    userPhone?: string | null;
    userEducation?: string | null;
    userFaculty?: string | null;
    userInstitution?: string | null;
    userAddress?: string | null;
    userProvince?: string | null;
    userCountry?: string | null;
    userRemark?: string | null;
    userPhysicalStatus?: string | null;
  };
}

export function findUserByIdentifier(): Promise<User | undefined> {
  return Promise.resolve(undefined);
}
export function mapBackendUserToFrontendUser(backendUser: BackendUserResponse): User {
  return {
    id: backendUser.USER_ID,
    nationalId: backendUser.USER_NATIONAL_ID || '',
    passportNo: backendUser.USER_PASSPORT_NO || '',
    email: backendUser.USER_EMAIL,
    status: backendUser.USER_STATUS,
    titleTH: backendUser.PROFILE?.userTitleTh || '',
    fullNameTH: backendUser.PROFILE?.userFullnameTh || '',
    titleEN: backendUser.PROFILE?.userTitleEn || '',
    fullNameEN: backendUser.PROFILE?.userFullnameEn || '',
    birthdate: backendUser.PROFILE?.userDateOfBirth || '',
    phone: backendUser.PROFILE?.userPhone || '',
    educationLevel: backendUser.PROFILE?.userEducation || '',
    country: backendUser.PROFILE?.userCountry || '',
    province: backendUser.PROFILE?.userProvince || '',
    address: backendUser.PROFILE?.userAddress || '',
    faculty: backendUser.PROFILE?.userFaculty || '',
    institution: backendUser.PROFILE?.userInstitution || '',
    taxId: '',
    thaidSynced: false,
    role: ROLES.CANDIDATE,
    remark: backendUser.PROFILE?.userRemark || '',
    userPhysicalStatus: backendUser.PROFILE?.userPhysicalStatus || '',
  };
}

/**
 * ฟังก์ชันล็อกอินเชื่อมต่อกับ Backend จริง
 */
export async function authenticateUser(
  email: string,
  password?: string,
): Promise<LoginResponse | null> {
  try {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (err) {
    console.error('Authentication failed:', err);
    return null;
  }
}

export async function getUsersFromApi(role?: string): Promise<User[]> {
  try {
    const url = role ? `/users?role=${role}` : '/users';
    const response = await api.get<BackendUserResponse[] | { value: BackendUserResponse[] }>(url);

    let usersData: BackendUserResponse[] = [];
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if ('value' in response.data && Array.isArray(response.data.value)) {
        usersData = response.data.value;
      }
    }

    return usersData.map(mapBackendUserToFrontendUser);
  } catch (err) {
    console.error('Failed to fetch users from API:', err);
    return []; // Return empty array on failure instead of throwing
  }
}

export function findUser(users: User[], inputID: string): User | undefined {
  return users.find((u) => u.nationalId === inputID || String(u.id) === inputID);
}
/**
 * ฟังก์ชันสำหรับดึงข้อมูล Profile ของผู้ใช้ที่ล็อกอินอยู่
 */
export async function getProfile(token: string): Promise<User | null> {
  try {
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('Failed to fetch profile:', err);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดตข้อมูล Profile ของผู้ใช้ที่ล็อกอินอยู่
 */
export async function updateProfile(
  token: string,
  payload: {
    userTitleTh?: string | undefined;
    userFullnameTh?: string | undefined;
    userTitleEn?: string | undefined;
    userFullnameEn?: string | undefined;
    userDateOfBirth?: string | undefined;
    userPhone?: string | undefined;
    userEducation?: string | undefined;
    userFaculty?: string | undefined;
    userInstitution?: string | undefined;
    userCountry?: string | undefined;
    userAddress?: string | undefined;
    userImagePath?: string | null | undefined;
    userPhysicalStatus?: string | undefined;
    isFromEmail?: boolean | undefined;
  },
): Promise<User> {
  try {
    const response = await api.patch('/user-profile/me', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('Failed to update profile:', err);
    throw err;
  }
}

export async function updateUserProfileByAdmin(
  token: string,
  userProfileId: number,
  payload: {
    userTitleTh?: string;
    userFullnameTh?: string;
    userTitleEn?: string;
    userFullnameEn?: string;
    userDateOfBirth?: string;
    userPhone?: string;
    userEducation?: string;
    userFaculty?: string;
    userInstitution?: string;
    userAddress?: string;
    userPhysicalStatus?: string;
    userNationalId?: string;
    userImagePath?: string;
  },
): Promise<unknown> {
  try {
    const response = await api.patch(`/user-profile/${userProfileId}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error('Failed to update user profile by admin:', err);
    throw err;
  }
}
