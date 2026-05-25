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
  CREATED_AT: string;
  UPDATED_AT: string;
}

/**
 * ฟังก์ชันสำหรับค้นหาผู้ใช้ (ยังไม่เปิดใช้งานในเวอร์ชันนี้)
 */
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
    // ฟิลด์ Profile จะเป็นค่าว่างไปก่อนเนื่องจาก Backend ยังไม่ได้ Join ข้อมูลมา
    titleTH: '',
    fullNameTH: '',
    titleEN: '',
    fullNameEN: '',
    birthdate: '',
    phone: '',
    educationLevel: '',
    country: '',
    province: '',
    address: '',
    taxId: '',
    thaidSynced: false,
    role: ROLES.CANDIDATE, // Default role
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

export async function getUsersFromApi(): Promise<User[]> {
  try {
    // โครงสร้างที่ Backend ส่งมาคือ { value: User[], Count: number }
    const response = await api.get<{ value: BackendUserResponse[]; Count: number }>('/users');
    return response.data.value.map(mapBackendUserToFrontendUser);
  } catch {
    console.error('Failed to fetch users from API');
    throw new Error('Could not fetch users');
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
    userTitleTh?: string;
    userFullnameTh?: string;
    userTitleEn?: string;
    userFullnameEn?: string;
    userDateOfBirth?: string | undefined;
    userPhone?: string;
    userEducation?: string;
    userFaculty?: string;
    userInstitution?: string;
    userCountry?: string;
    userAddress?: string;
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
