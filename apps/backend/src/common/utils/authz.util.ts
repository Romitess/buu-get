import { ForbiddenException } from '@nestjs/common';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import {
  ADMIN_SWITCHABLE_ROLES,
  PRIVILEGED_ROLES,
  SUPER_ADMIN_SWITCHABLE_ROLES,
} from '../constants/role-switch.constants';

export interface AuthenticatedUser {
  userId: number;
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
  if (user.userId === resourceUserId) {
    return;
  }
  if (!userHasAnyRole(user, allowedRoles)) {
    throw new ForbiddenException(message);
  }
}
