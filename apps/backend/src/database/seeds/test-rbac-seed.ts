import '../../config/load-env';

import * as bcrypt from 'bcrypt';
import { RoleEnum } from '../../modules/roles/enums/role.enum';
import {
  TEST_PERSON_IDS,
  TEST_ROLE_DESCRIPTIONS,
  TEST_USERS,
  type TestRoleKey,
} from './test-users.constants';

const ROLE_KEYS = Object.keys(TEST_USERS) as TestRoleKey[];

/**
 * Normalize role slug the same way RolesGuard does so
 * `registration officer` (legacy space) matches `registration_officer` (RoleEnum).
 */
function normalizeRoleName(name: string): string {
  return name.toLowerCase().replace(/[\s-_]+/g, '');
}

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
  const { MsgPerson } =
    await import('../../modules/msg-persons/entities/msg-person.entity');

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
    const personRepo = AppDataSource.getRepository(MsgPerson);
    const hashed = await bcrypt.hash(
      TEST_USERS.admin.password,
      await bcrypt.genSalt(),
    );

    const rolesByName = new Map<string, InstanceType<typeof Role>>();

    // Load all roles once (incl. soft-deleted) and match by normalized name
    // so legacy "registration officer" is reused instead of inserting
    // a duplicate "registration_officer" row.
    const existingRoles = await roleRepo.find({ withDeleted: true });
    const rolesByNormalized = new Map<string, InstanceType<typeof Role>>();
    for (const existing of existingRoles) {
      const key = normalizeRoleName(existing.ROLE_NAME);
      const prior = rolesByNormalized.get(key);
      // Prefer active (non-deleted) row when duplicates exist
      if (!prior || (prior.DELETED_AT && !existing.DELETED_AT)) {
        rolesByNormalized.set(key, existing);
      }
    }

    for (const key of ROLE_KEYS) {
      const roleName = TEST_USERS[key].role as RoleEnum;
      const normalized = normalizeRoleName(roleName);
      let role = rolesByNormalized.get(normalized) ?? null;

      if (role) {
        // Reuse legacy slug as-is (do not rewrite ROLE_NAME to underscore)
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
        rolesByNormalized.set(normalized, role);
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

    // Seed MSG_T_PERSON + PERSON_ROLES สำหรับ staff roles (ไม่รวม candidate)
    for (const key of ROLE_KEYS) {
      if (key === 'candidate') {
        continue;
      }
      const psnId = TEST_PERSON_IDS[key];
      const role = rolesByName.get(TEST_USERS[key].role);
      if (!psnId || !role) {
        continue;
      }
      const cred = TEST_USERS[key];
      const person = await personRepo.findOne({
        where: { PSN_ID: psnId },
        relations: ['ROLES'],
      });
      if (person) {
        person.PSN_EMAIL_BUU = cred.email;
        person.PSN_USERNAME = key.slice(0, 50);
        person.PSN_FNAMETH = cred.displayNameTh;
        person.PSN_RETIRE = 'N';
        person.ROLES = [role];
        await personRepo.save(person);
      } else {
        await personRepo.save(
          personRepo.create({
            PSN_ID: psnId,
            PSN_EMAIL_BUU: cred.email,
            PSN_USERNAME: key.slice(0, 50),
            PSN_FNAMETH: cred.displayNameTh,
            PSN_RETIRE: 'N',
            ROLES: [role],
          }),
        );
      }
      console.warn(`✓ PERSON ${psnId} ↔ role ${cred.role}`);
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
