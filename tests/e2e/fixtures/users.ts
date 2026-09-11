import {
  TEST_USERS,
  type TestRoleKey,
  type TestUserCredential,
} from '../../shared/test-users';

export type { TestRoleKey, TestUserCredential };
export {
  TEST_USERS,
  TEST_PASSWORD,
  TEST_PERSON_IDS,
} from '../../shared/test-users';

export function getTestUser(role: TestRoleKey): TestUserCredential {
  return TEST_USERS[role];
}
