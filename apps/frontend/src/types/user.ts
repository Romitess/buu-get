import type { RolesType } from '../constants/roles';

export type UserRole = RolesType[keyof RolesType];

export interface User {
  // USER
  id?: number;
  /** MSG_T_PERSON.PSN_ID เมื่อ login ด้วยบัญชีมหาวิทยาลัย */
  psnId?: string;
  actorType?: 'user' | 'person';
  userCode?: string;
  nationalId: string;
  passportNo: string;
  email: string;
  password?: string;
  status: string;

  // USER_PROFILE
  profileId?: number;
  titleTH: string;
  fullNameTH: string;
  titleEN: string;
  fullNameEN: string;
  birthdate: string;
  phone: string;
  educationLevel: string;
  country: string;
  address: string;
  faculty?: string;
  institution?: string;
  taxId: string;
  thaidSynced: boolean;
  userImagePath?: string;

  // ROLES
  /** role หลัก (ตัวแรก) — ใช้สำหรับ default landing/แสดงผล */
  role?: UserRole;
  /** role ทั้งหมดที่ผู้ใช้มี (1 user มีได้หลาย role) */
  roles?: UserRole[];
  remark?: string;
}
