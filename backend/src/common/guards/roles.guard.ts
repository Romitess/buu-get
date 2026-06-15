import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';

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
    // ดึง roles ที่กำหนดไว้ใน @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // ถ้าไม่ได้กำหนด @Roles() ไว้ แสดงว่า route นี้ไม่จำกัด role → ให้ผ่าน
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user: { role: RoleEnum };
    }>();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: No role assigned');
    }

    // ตรวจสอบว่า role ของ user ตรงกับ role ที่ต้องการหรือไม่
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: requires one of [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
