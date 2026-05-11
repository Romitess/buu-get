import axios from 'axios';
import type { User } from 'src/types/user';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

/**
 * ฟังก์ชันสำหรับค้นหาผู้ใช้ (ยังไม่เปิดใช้งานในเวอร์ชันนี้)
 */
export function findUserByIdentifier(): Promise<User | undefined> {
  return Promise.resolve(undefined);
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
