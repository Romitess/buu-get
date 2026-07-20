import { RoleEnum } from 'src/modules/roles/enums/role.enum';

/** ผู้ดูแลระบบและเจ้าหน้าที่ทั่วไป */
export const ADMIN_STAFF_ROLES: RoleEnum[] = [RoleEnum.ADMIN, RoleEnum.STAFF];

/** การเงินและธุรกรรม */
export const FINANCE_ROLES: RoleEnum[] = [
  RoleEnum.ADMIN,
  RoleEnum.FINANCE,
  RoleEnum.STAFF,
];

/** จัดการผู้ใช้และ role */
export const USER_ADMIN_ROLES: RoleEnum[] = [RoleEnum.ADMIN];

/** จัดการการสมัครสอบ */
export const ENROLLMENT_ADMIN_ROLES: RoleEnum[] = [
  RoleEnum.ADMIN,
  RoleEnum.STAFF,
  RoleEnum.REGISTRATION_OFFICER,
  RoleEnum.EXAM_OPERATIONS_OFFICER,
];

/** ดูรายการผู้ใช้ (เช่น เลือกผู้คุมสอบตอนสร้างการสอบ) — ไม่รวมการจัดการ role */
export const USER_LIST_ROLES: RoleEnum[] = [...ENROLLMENT_ADMIN_ROLES];

/** รายงานและผู้บริหาร */
export const EXECUTIVE_ROLES: RoleEnum[] = [RoleEnum.ADMIN, RoleEnum.EXECUTIVE];

/** จัดการข้อสอบ (admin mutate) */
export const EXAM_ADMIN_ROLES: RoleEnum[] = [
  RoleEnum.ADMIN,
  RoleEnum.STAFF,
  RoleEnum.EXAM_OPERATIONS_OFFICER,
  RoleEnum.REGISTRATION_OFFICER,
];

/** อ่านแหล่งทุน — การเงิน + เจ้าหน้าที่จัดสอบ/ทะเบียน (ใช้ตอนสร้างการสอบ) */
export const FUND_SOURCE_READ_ROLES: RoleEnum[] = [
  ...FINANCE_ROLES,
  RoleEnum.EXAM_OPERATIONS_OFFICER,
  RoleEnum.REGISTRATION_OFFICER,
];
