export type RolesType = {
  ADMIN: string;
  SUPER_ADMIN: string;
  STAFF: string;
  REGISTRATION_OFFICER: string;
  CANDIDATE: string;
  EXAM_OPERATIONS_OFFICER: string;
  FINANCE: string;
  EXECUTIVE: string;
  PROCTOR: string;
};

export type RoleValue = RolesType[keyof RolesType];

export const ROLES: RolesType = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
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
  super_admin: 'ผู้ดูแลระบบสูงสุด',
  staff: 'เจ้าหน้าที่',
  registration_officer: 'เจ้าหน้าที่ทะเบียน',
  candidate: 'ผู้สมัครสอบ',
  exam_operations_officer: 'เจ้าหน้าที่จัดสอบ',
  finance: 'เจ้าหน้าที่การเงิน',
  executive: 'ผู้บริหาร',
  proctor: 'ผู้คุมสอบ',
};

/** role ที่ admin สลับมุมมองได้ — รวม admin เพื่อกลับมาโหมดผู้ดูแลได้ */
export const ADMIN_SWITCHABLE_ROLES: RoleValue[] = [
  ROLES.ADMIN,
  ROLES.REGISTRATION_OFFICER,
  ROLES.EXAM_OPERATIONS_OFFICER,
];

/** role ที่ super_admin สลับมุมมองได้ — ทุก role ยกเว้น super_admin เอง */
export const SUPER_ADMIN_SWITCHABLE_ROLES: RoleValue[] = [
  ROLES.CANDIDATE,
  ROLES.STAFF,
  ROLES.FINANCE,
  ROLES.PROCTOR,
  ROLES.EXECUTIVE,
  ROLES.REGISTRATION_OFFICER,
  ROLES.EXAM_OPERATIONS_OFFICER,
  ROLES.ADMIN,
];

/**
 * อันดับบทบาทสำหรับกฎมอบหมาย: มอบระดับเดียวกันหรือต่ำกว่าได้ ห้ามสูงกว่า
 */
export const ROLE_RANK: Record<RoleValue, number> = {
  [ROLES.CANDIDATE]: 0,
  [ROLES.STAFF]: 1,
  [ROLES.FINANCE]: 1,
  [ROLES.PROCTOR]: 1,
  [ROLES.EXECUTIVE]: 1,
  [ROLES.REGISTRATION_OFFICER]: 1,
  [ROLES.EXAM_OPERATIONS_OFFICER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3,
};

export function getRoleRank(roleName: string): number {
  return ROLE_RANK[roleName as RoleValue] ?? Number.POSITIVE_INFINITY;
}

export function maxRoleRank(roleNames: Iterable<string>): number {
  let max = 0;
  for (const name of roleNames) {
    max = Math.max(max, getRoleRank(name));
  }
  return max;
}
