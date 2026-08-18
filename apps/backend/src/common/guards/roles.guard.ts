import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { ACTIVE_ROLE_HEADER } from '../constants/role-switch.constants';
import {
  AuthenticatedUser,
  getEffectiveRoles,
  getUserRoles,
  resolveActiveRole,
} from '../utils/authz.util';

/**
 * RolesGuard — ตรวจสอบว่า user ที่ login แล้วมี role ตรงกับที่กำหนดไว้ใน @Roles() หรือไม่
 * ต้องใช้ร่วมกับ JwtAuthGuard เสมอ เพื่อให้ request.user มีค่า
 *
 * ตัวอย่าง:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(RoleEnum.STAFF)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const user = request.user;

    if (user) {
      const headerValue = request.headers[ACTIVE_ROLE_HEADER];
      const activeRoleHeader =
        typeof headerValue === 'string'
          ? headerValue
          : Array.isArray(headerValue)
            ? headerValue[0]
            : undefined;
      user.activeRole = resolveActiveRole(user, activeRoleHeader);
    }

    // ดึง roles ที่กำหนดไว้ใน @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ถ้าไม่ได้กำหนด @Roles() ไว้ แสดงว่า route นี้ไม่จำกัด role → ให้ผ่าน
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('Access denied: No role assigned');
    }

    const userRoles = getEffectiveRoles(user);

    if (userRoles.length === 0) {
      throw new ForbiddenException('Access denied: No role assigned');
    }

    const normalizeRole = (r: string): string =>
      r.toLowerCase().replace(/[\s-_]+/g, '');

    // super_admin ผ่านทุก @Roles() เสมอ (safety net)
    const realRoles = getUserRoles(user);
    if (
      realRoles.some(
        (r) => normalizeRole(r) === normalizeRole(RoleEnum.SUPER_ADMIN),
      )
    ) {
      return true;
    }

    const normalizedRequired = requiredRoles.map((r) => normalizeRole(r));
    const normalizedUser = userRoles.map((r) => normalizeRole(r));

    const hasRole = normalizedRequired.some((role) =>
      normalizedUser.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: requires one of [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
