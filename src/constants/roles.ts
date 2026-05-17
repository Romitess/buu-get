export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FINANCE: 'finance',
  EXECUTIVE: 'executive',
  CANDIDATE: 'candidate',
  PROCTOR: 'proctor',
  REGISTRATION_OFFICER: 'registration_officer',
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'ผู้ดูแลระบบ',
  [ROLES.STAFF]: 'เจ้าหน้าที่ดำเนินการสอบ',
  [ROLES.FINANCE]: 'เจ้าหน้าที่การเงิน',
  [ROLES.EXECUTIVE]: 'ผู้บริหาร',
  [ROLES.CANDIDATE]: 'ผู้สมัครสอบ',
  [ROLES.PROCTOR]: 'กรรมการคุมสอบ',
  [ROLES.REGISTRATION_OFFICER]: 'เจ้าหน้าที่ลงทะเบียน',
} as const;

export type RolesType = typeof ROLES;
