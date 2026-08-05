/**
 * Credentials สำหรับ test RBAC seed — ต้องตรงกับ
 * apps/backend/src/database/seeds/test-rbac-seed.ts
 * Single source of truth อยู่ที่ backend constants (ให้ ts-node โหลดได้)
 */
export {
  TEST_PASSWORD,
  TEST_USERS,
  TEST_ROLE_DESCRIPTIONS,
  type TestRoleKey,
  type TestUserCredential,
} from '../../apps/backend/src/database/seeds/test-users.constants';
