/** ข้อมูล Credentials ขั้นตอนแรกของการสมัครสมาชิก (Email + Password) */
export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  userType: 'thai' | 'foreigner';
  registrationMethod: 'email' | 'thaid';
}

/** ข้อมูลฟอร์มสมัครสมาชิก / แก้ไขข้อมูลส่วนตัว */
export interface RegisterFormData {
  profileImage: string;
  nationalId: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  country: string;
  titleTH: string;
  titleEN: string;
  fullName: string;
  englishName: string;
  birthdate: string;
  phone: string;
  educationLevel: string;
  faculty: string;
  institution: string;
  address: string | null;
  userImagePath?: string | undefined;
}

/** สถานะของ Dialog (ใช้ใน form confirmation) */
export interface DialogState {
  show: boolean;
  type: 'success' | 'error' | '';
  message: string;
}
