import { RoleEnum } from 'src/modules/roles/enums/role.enum';

/** role ที่ admin สลับมุมมองได้ */
export const ADMIN_SWITCHABLE_ROLES: RoleEnum[] = [
  RoleEnum.REGISTRATION_OFFICER,
  RoleEnum.EXAM_OPERATIONS_OFFICER,
];

/** role ที่ super_admin สลับมุมมองได้ — ทุก role ยกเว้น super_admin เอง */
export const SUPER_ADMIN_SWITCHABLE_ROLES: RoleEnum[] = [
  RoleEnum.CANDIDATE,
  RoleEnum.STAFF,
  RoleEnum.FINANCE,
  RoleEnum.PROCTOR,
  RoleEnum.EXECUTIVE,
  RoleEnum.REGISTRATION_OFFICER,
  RoleEnum.EXAM_OPERATIONS_OFFICER,
  RoleEnum.ADMIN,
];

/** role ที่สามารถใช้ X-Active-Role header ได้ */
export const PRIVILEGED_ROLES: RoleEnum[] = [
  RoleEnum.ADMIN,
  RoleEnum.SUPER_ADMIN,
];

export const ACTIVE_ROLE_HEADER = 'x-active-role';
