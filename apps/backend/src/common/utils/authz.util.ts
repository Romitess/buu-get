import { ForbiddenException } from '@nestjs/common';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import {
  ADMIN_SWITCHABLE_ROLES,
  PRIVILEGED_ROLES,
  SUPER_ADMIN_SWITCHABLE_ROLES,
} from '../constants/role-switch.constants';

export interface AuthenticatedUser {
  /** 'user' = BUU_GET_T_USER; 'person' = MSG_T_PERSON (default = user เมื่อไม่ระบุ) */
  actorType?: 'user' | 'person';
  /** USER_ID — มีเมื่อ actorType = 'user' */
  userId?: number;
  /** PSN_ID — มีเมื่อ actorType = 'person' */
  personId?: string;
  email: string;
  role: RoleEnum;
  roles?: RoleEnum[];
  /** role มุมมองที่สลับจาก frontend (validate แล้ว) */
  activeRole?: RoleEnum;
}

function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[\s-_]+/g, '');
}

export function getUserRoles(user: AuthenticatedUser): RoleEnum[] {
  if (user.roles && user.roles.length > 0) {
    return user.roles;
  }
  return user.role ? [user.role] : [];
}

function isPrivilegedUser(user: AuthenticatedUser): boolean {
  const realRoles = getUserRoles(user).map((r) => normalizeRole(r));
  return PRIVILEGED_ROLES.some((r) => realRoles.includes(normalizeRole(r)));
}

function getSwitchableRolesForUser(user: AuthenticatedUser): RoleEnum[] {
  const realRoles = getUserRoles(user).map((r) => normalizeRole(r));
  if (realRoles.includes(normalizeRole(RoleEnum.SUPER_ADMIN))) {
    return SUPER_ADMIN_SWITCHABLE_ROLES;
  }
  if (realRoles.includes(normalizeRole(RoleEnum.ADMIN))) {
    return ADMIN_SWITCHABLE_ROLES;
  }
  return [];
}

/** validate X-Active-Role header สำหรับ admin/super_admin เท่านั้น */
export function resolveActiveRole(
  user: AuthenticatedUser,
  headerValue: string | undefined,
): RoleEnum | undefined {
  if (!headerValue?.trim() || !isPrivilegedUser(user)) {
    return undefined;
  }

  const normalizedHeader = normalizeRole(headerValue.trim());
  const switchable = getSwitchableRolesForUser(user);
  return switchable.find((r) => normalizeRole(r) === normalizedHeader);
}

export function getEffectiveRoles(user: AuthenticatedUser): RoleEnum[] {
  const realRoles = getUserRoles(user);
  if (!user.activeRole) {
    return realRoles;
  }
  return [...new Set([...realRoles, user.activeRole])];
}

export function userHasAnyRole(
  user: AuthenticatedUser,
  requiredRoles: RoleEnum[],
): boolean {
  const userRoles = getEffectiveRoles(user).map((r) => normalizeRole(r));
  const required = requiredRoles.map((r) => normalizeRole(r));
  return required.some((role) => userRoles.includes(role));
}

export function assertSelfOrRoles(
  user: AuthenticatedUser,
  resourceUserId: number,
  allowedRoles: RoleEnum[],
  message = 'Access denied',
): void {
  if (user.userId != null && user.userId === resourceUserId) {
    return;
  }
  if (!userHasAnyRole(user, allowedRoles)) {
    throw new ForbiddenException(message);
  }
}

/**
 * บังคับว่าต้องเป็นบัญชีผู้สมัคร (BUU_GET_T_USER) ที่มี USER_ID ตัวเลข
 * — ใช้กับ endpoint ที่ยังผูก FK/actor กับ USER_ID (ยังไม่รองรับ person login ในเฟสนี้)
 * แนวเดียวกับ HRD ที่ extract acting id จาก req.user ก่อนเขียน audit/FK
 */
export function requireUserId(
  user: AuthenticatedUser,
  message = 'This action requires a candidate user account',
): number {
  if (user.userId == null) {
    throw new ForbiddenException(message);
  }
  return user.userId;
}

/**
 * บังคับว่าต้องเป็นบัญชีบุคลากร (MSG_T_PERSON) ที่มี PSN_ID
 * — ใช้กับ endpoint ที่ผูก host/scanner กับ PERSON
 */
export function requirePersonId(
  user: AuthenticatedUser,
  message = 'This action requires a personnel account',
): string {
  if (!user.personId) {
    throw new ForbiddenException(message);
  }
  return user.personId;
}
