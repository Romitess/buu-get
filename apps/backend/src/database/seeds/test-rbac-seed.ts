import '../../config/load-env';

import * as bcrypt from 'bcrypt';
import { RoleEnum } from '../../modules/roles/enums/role.enum';
import {
  TEST_ROLE_DESCRIPTIONS,
  TEST_USERS,
  type TestRoleKey,
} from './test-users.constants';

const ROLE_KEYS = Object.keys(TEST_USERS) as TestRoleKey[];

/**
 * Upsert ครบ 8 roles + 1 user ต่อ role สำหรับ test DB
 * Idempotent — รันซ้ำได้หลัง truncate
 *
 * @param manageConnection เมื่อ true (default) จะ init/destroy DataSource เอง
 *   ตั้ง false เมื่อเรียกจาก test-db-reset ที่ถือ connection อยู่แล้ว
 */
export async function seedTestRbac(manageConnection = true): Promise<void> {
  const { default: AppDataSource } = await import('../data-source');
  const { User } = await import('../../modules/users/entities/user.entity');
  const { Role } = await import('../../modules/roles/entities/role.entity');
  const { UserProfile } =
    await import('../../modules/user-profile/entities/user-profile.entity');

  const wasInitialized = AppDataSource.isInitialized;
  if (!wasInitialized) {
    if (!manageConnection) {
      throw new Error(
        'DataSource must be initialized when seedTestRbac(manageConnection=false)',
      );
    }
    await AppDataSource.initialize();
  }

  try {
    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(UserProfile);
    const hashed = await bcrypt.hash(
      TEST_USERS.admin.password,
      await bcrypt.genSalt(),
    );

    const rolesByName = new Map<string, InstanceType<typeof Role>>();

    for (const key of ROLE_KEYS) {
      const roleName = TEST_USERS[key].role as RoleEnum;
      let role = await roleRepo.findOne({
        where: { ROLE_NAME: roleName },
        withDeleted: true,
      });
      if (role) {
        role.ROLE_DESCRIPTION = TEST_ROLE_DESCRIPTIONS[key];
        role.DELETED_AT = null;
        role = await roleRepo.save(role);
      } else {
        role = await roleRepo.save(
          roleRepo.create({
            ROLE_NAME: roleName,
            ROLE_DESCRIPTION: TEST_ROLE_DESCRIPTIONS[key],
          }),
        );
      }
      rolesByName.set(roleName, role);
    }

    for (const key of ROLE_KEYS) {
      const cred = TEST_USERS[key];
      const role = rolesByName.get(cred.role);
      if (!role) {
        throw new Error(`Missing role after seed: ${cred.role}`);
      }

      let user = await userRepo.findOne({
        where: { USER_EMAIL: cred.email },
        relations: ['ROLES_ID'],
        withDeleted: true,
      });

      if (user) {
        user.USER_PASSWORD = hashed;
        user.USER_STATUS = 'ACTIVE';
        user.DELETED_AT = null;
        user.ROLES_ID = [role];
        user = await userRepo.save(user);
      } else {
        user = await userRepo.save(
          userRepo.create({
            USER_EMAIL: cred.email,
            USER_PASSWORD: hashed,
            USER_STATUS: 'ACTIVE',
            ROLES_ID: [role],
          }),
        );
      }

      const profile = await profileRepo.findOne({
        where: { userId: user.USER_ID },
        withDeleted: true,
      });
      if (profile) {
        profile.userFullnameTh = cred.displayNameTh;
        profile.updatedAt = new Date();
        await profileRepo.save(profile);
      } else {
        await profileRepo.save(
          profileRepo.create({
            userId: user.USER_ID,
            userFullnameTh: cred.displayNameTh,
          }),
        );
      }

      console.warn(`✓ ${cred.role}: ${cred.email}`);
    }
  } finally {
    if (manageConnection && !wasInitialized && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function main(): Promise<void> {
  await seedTestRbac();
  console.warn('✓ test RBAC seed complete');
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
