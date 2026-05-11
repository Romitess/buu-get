import { api } from 'src/boot/axios';
import type { User } from 'src/types/user';

export const mockUsers: User[] = [
  {
    id: 1,
    nationalId: '1234567890123',
    passportNo: '',
    email: '67160426@go.buu.ac.th',
    password: '1234',
    status: 'ACTIVE',
    profileId: 1,
    titleTH: 'นาย',
    fullNameTH: 'นที บุญญานนท์',
    titleEN: 'Mr.',
    fullNameEN: 'Natee Boonyanon',
    birthdate: '2005-05-23',
    phone: '0984343014',
    educationLevel: 'ปริญญาตรี',
    country: 'TH',
    province: 'ชลบุรี',
    address: '104/13 ถ.มาบมะยมใต้ ต.แสนสุข',
    taxId: '1234567890123',
    thaidSynced: true,
    role: 'user',
  },
  {
    id: 2,
    nationalId: '1111111111111',
    passportNo: '',
    email: 'staff@buu.ac.th',
    password: '1234',
    status: 'ACTIVE',
    profileId: 2,
    titleTH: 'นาย',
    fullNameTH: 'เจ้าหน้าที่ ทดสอบ',
    titleEN: 'Mr.',
    fullNameEN: 'Staff Test',
    birthdate: '1990-01-01',
    phone: '0812345678',
    educationLevel: 'ปริญญาโท',
    country: 'TH',
    province: 'ชลบุรี',
    address: 'อาคารสำนักงานอธิการบดี',
    taxId: '1111111111111',
    thaidSynced: true,
    role: 'staff',
  },
];

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
 * ฟังก์ชันแปลงข้อมูลจาก Backend เป็น Frontend User Type
 */
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
    role: 'user', // Default role
  };
}

/**
 * ฟังก์ชันดึงข้อมูล User ทั้งหมดจาก API
 */
export async function getUsersFromApi(): Promise<User[]> {
  try {
    const response = await api.get<BackendUserResponse[]>('/users');
    return response.data.map(mapBackendUserToFrontendUser);
  } catch (error) {
    console.error('Failed to fetch users from API:', error);
    throw error;
  }
}

export function findUser(users: User[], inputID: string): User | undefined {
  return users.find((u) => u.nationalId === inputID || String(u.id) === inputID);
}

export function authenticateUser(users: User[], inputID: string, password?: string): User | null {
  const found = findUser(users, inputID);
  if (found && found.password === password) {
    return found;
  }
  return null;
}
