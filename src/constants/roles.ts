export type RolesType = {
  ADMIN: string;
  STAFF: string;
  REGISTRATION_OFFICER: string;
  CANDIDATE: string;
  EXAM_OPERATIONS_OFFICER: string;
  FINANCE: string;
  EXECUTIVE: string;
  PROCTOR: string;
};

export const ROLES: RolesType = {
  ADMIN: 'admin',
  STAFF: 'staff',
  REGISTRATION_OFFICER: 'registration_officer',
  CANDIDATE: 'candidate',
  EXAM_OPERATIONS_OFFICER: 'exam_operations_officer',
  FINANCE: 'finance',
  EXECUTIVE: 'executive',
  PROCTOR: 'proctor',
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  staff: 'เจ้าหน้าที่',
  registration_officer: 'เจ้าหน้าที่ทะเบียน',
  candidate: 'ผู้สมัครสอบ',
  exam_operations_officer: 'เจ้าหน้าที่จัดสอบ',
  finance: 'เจ้าหน้าที่การเงิน',
  executive: 'ผู้บริหาร',
  proctor: 'ผู้คุมสอบ',
};
