import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator — ใช้กำหนดว่า route นั้นต้องการ role อะไรบ้าง
 * ตัวอย่าง: @Roles(RoleEnum.STAFF, RoleEnum.EXECUTIVE)
 */
export const Roles = (...roles: RoleEnum[]) => SetMetadata(ROLES_KEY, roles);
