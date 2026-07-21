import { ForbiddenException } from '@nestjs/common';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: RoleEnum;
  roles?: RoleEnum[];
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

export function userHasAnyRole(
  user: AuthenticatedUser,
  requiredRoles: RoleEnum[],
): boolean {
  const userRoles = getUserRoles(user).map((r) => normalizeRole(r));
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
