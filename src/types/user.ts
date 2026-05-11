export type UserRole = 'admin' | 'staff' | 'finance' | 'executive' | 'user';

export interface User {
  // USER
  id?: number;
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
  province: string;
  address: string;
  zipCode?: string;
  faculty?: string;
  institution?: string;
  taxId: string;
  thaidSynced: boolean;

  // ROLES
  role?: UserRole;
}
