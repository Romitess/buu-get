/**
 * Credentials สำหรับ test RBAC seed — ใช้ร่วมกับ Playwright fixtures
 * (re-export จาก tests/shared/test-users.ts)
 */
export const TEST_PASSWORD = 'TestPass123!';

export type TestRoleKey =
  | 'admin'
  | 'staff'
  | 'finance'
  | 'proctor'
  | 'executive'
  | 'registration_officer'
  | 'exam_operations_officer'
  | 'candidate';

export type TestUserCredential = {
  email: string;
  password: string;
  role: TestRoleKey;
  displayNameTh: string;
};

export const TEST_USERS: Record<TestRoleKey, TestUserCredential> = {
  admin: {
    email: 'test.admin@buu-get.test',
    password: TEST_PASSWORD,
    role: 'admin',
    displayNameTh: 'ทดสอบ ผู้ดูแลระบบ',
  },
  staff: {
    email: 'test.staff@buu-get.test',
    password: TEST_PASSWORD,
    role: 'staff',
    displayNameTh: 'ทดสอบ เจ้าหน้าที่',
  },
  finance: {
    email: 'test.finance@buu-get.test',
    password: TEST_PASSWORD,
    role: 'finance',
    displayNameTh: 'ทดสอบ การเงิน',
  },
  proctor: {
    email: 'test.proctor@buu-get.test',
    password: TEST_PASSWORD,
    role: 'proctor',
    displayNameTh: 'ทดสอบ ผู้คุมสอบ',
  },
  executive: {
    email: 'test.executive@buu-get.test',
    password: TEST_PASSWORD,
    role: 'executive',
    displayNameTh: 'ทดสอบ ผู้บริหาร',
  },
  registration_officer: {
    email: 'test.registration@buu-get.test',
    password: TEST_PASSWORD,
    role: 'registration_officer',
    displayNameTh: 'ทดสอบ เจ้าหน้าที่ทะเบียน',
  },
  exam_operations_officer: {
    email: 'test.examops@buu-get.test',
    password: TEST_PASSWORD,
    role: 'exam_operations_officer',
    displayNameTh: 'ทดสอบ เจ้าหน้าที่จัดสอบ',
  },
  candidate: {
    email: 'test.candidate@buu-get.test',
    password: TEST_PASSWORD,
    role: 'candidate',
    displayNameTh: 'ทดสอบ ผู้สมัครสอบ',
  },
};

export const TEST_ROLE_DESCRIPTIONS: Record<TestRoleKey, string> = {
  admin: 'ผู้ดูแลระบบ',
  staff: 'เจ้าหน้าที่สถาบันภาษา',
  finance: 'เจ้าหน้าที่การเงิน',
  proctor: 'กรรมการคุมสอบ',
  executive: 'ผู้บริหาร',
  registration_officer: 'เจ้าหน้าที่รับสมัคร',
  exam_operations_officer: 'เจ้าหน้าที่จัดสอบ',
  candidate: 'ผู้สมัครสอบ',
};
