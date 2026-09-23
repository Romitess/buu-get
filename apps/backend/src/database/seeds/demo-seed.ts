/**
 * Demo Seed — สร้างชุดข้อมูลทดสอบแบบ end-to-end (รันซ้ำได้ / idempotent)
 *
 * ขั้นตอน:
 *   1) ensure roles (candidate, staff) + upsert staff02 (เจ้าหน้าที่เปิดการสอบ)
 *      และ MSG_T_PERSON + PERSON_ROLES (loginBuu ใช้ PERSON; email login ยังใช้ User)
 *   2) upsert 100 candidate users (test001–100) — ชื่อ-สกุลไม่ซ้ำ, profile random
 *   3) login staff02 → เปิด 10 การสอบ (published) ผ่าน API จริง
 *      - ที่นั่ง = สุ่มจาก location จริงที่มี capacity ≥ 40
 *      - fee / วันสอบ / รอบ / ช่วงรับสมัคร random สมจริง
 *   4) แต่ละ user สุ่มลงทะเบียน 2–5 จาก 10 การสอบ → enroll → จ่ายเงิน (ผ่าน API)
 *
 * ต้องเปิด backend ไว้ที่ http://localhost:3000 ก่อนรัน
 *   npm run seed:demo   (ในโฟลเดอร์ backend)
 */
import '../../config/load-env';

import * as bcrypt from 'bcrypt';
import { RoleEnum } from '../../modules/roles/enums/role.enum';

// ── config ──
const BASE_URL = 'http://localhost:3000/api';
const CANDIDATE_COUNT = 100;
const EXAM_COUNT = 10;
const ENROLL_MIN = 2;
const ENROLL_MAX = 5;
const MIN_SEATS = 40;
const PASSWORD = 'password123';
const STAFF_EMAIL = 'staff02@go.buu.ac.th';
/** รหัสบุคลากรคงที่สำหรับ staff02 ใน MSG_T_PERSON (≤10 ตัวอักษร) */
const STAFF_PSN_ID = 'DEMOSTAFF2';
/** เลขบัตรประชาชนจำลองสำหรับ staff02 (loginBuu / MSG_T_PERSON.PSN_IDCARD) */
const STAFF_PSN_IDCARD = '1100700000002';
const SEED_TAG = 'DEMO-SEED'; // ใช้ติด EXAM_MOODLE_COURSE_ID เพื่อ idempotent

// ── ข้อมูลสุ่ม (สมจริง) ──
const MALE_FIRST = [
  'กิตติ',
  'ณัฐพล',
  'ธนวัฒน์',
  'ปรเมศวร์',
  'พงศกร',
  'ภาณุพงศ์',
  'วีรภัทร',
  'ศุภชัย',
  'อนุชา',
  'จิรายุ',
  'ธีรเดช',
  'นพดล',
  'ภูริช',
  'รัชชานนท์',
  'สหรัฐ',
];
const FEMALE_FIRST = [
  'กชกร',
  'ชนิกานต์',
  'ณัฐริกา',
  'ธิดารัตน์',
  'ปาริชาติ',
  'พิมพ์ชนก',
  'ศิริพร',
  'สุวนันท์',
  'อรทัย',
  'กมลชนก',
  'จุฑามาศ',
  'ณิชากร',
  'ปวีณา',
  'มนัสนันท์',
  'วรรณวิสา',
];
const LAST = [
  'ใจดี',
  'รักเรียน',
  'ศรีสุข',
  'แสงทอง',
  'บุญมา',
  'พงษ์ไพบูลย์',
  'วัฒนชัย',
  'จันทร์เพ็ญ',
  'ทองคำ',
  'สมบูรณ์',
  'พิทักษ์',
  'อินทรีย์',
  'มหาชัย',
  'เกียรติศักดิ์',
  'ภูผา',
];
const EN_MALE_FIRST = [
  'Kitti',
  'Nattaphon',
  'Thanawat',
  'Poramet',
  'Pongsakorn',
  'Phanupong',
  'Weeraphat',
  'Suphachai',
  'Anucha',
  'Jirayu',
  'Teeradet',
  'Noppadol',
  'Phurich',
  'Ratchanon',
  'Saharat',
];
const EN_FEMALE_FIRST = [
  'Kotchakorn',
  'Chanikan',
  'Nattarika',
  'Thidarat',
  'Parichat',
  'Phimchanok',
  'Siriporn',
  'Suwanan',
  'Orathai',
  'Kamonchanok',
  'Juthamas',
  'Nichakorn',
  'Paweena',
  'Manatsanan',
  'Wanwisa',
];
const EN_LAST = [
  'Jaidee',
  'Rakrian',
  'Srisuk',
  'Saengthong',
  'Boonma',
  'Pongpaiboon',
  'Wattanachai',
  'Chanpen',
  'Thongkham',
  'Somboon',
  'Phithak',
  'Insi',
  'Mahachai',
  'Kiattisak',
  'Phupha',
];
const EDUCATION = ['ปริญญาตรี', 'ปริญญาโท', 'มัธยมศึกษาตอนปลาย'];
const FACULTY = [
  'คณะวิทยาการสารสนเทศ',
  'คณะวิศวกรรมศาสตร์',
  'คณะมนุษยศาสตร์และสังคมศาสตร์',
  'คณะวิทยาศาสตร์',
  'คณะศึกษาศาสตร์',
  'คณะบริหารธุรกิจ',
];
const INSTITUTION = [
  'มหาวิทยาลัยบูรพา',
  'มหาวิทยาลัยเกษตรศาสตร์',
  'จุฬาลงกรณ์มหาวิทยาลัย',
  'มหาวิทยาลัยเชียงใหม่',
  'มหาวิทยาลัยขอนแก่น',
  'มหาวิทยาลัยธรรมศาสตร์',
];
const PROVINCE = [
  'ชลบุรี',
  'กรุงเทพมหานคร',
  'ระยอง',
  'ฉะเชิงเทรา',
  'นนทบุรี',
  'สมุทรปราการ',
];
const EXAM_NAMES = [
  'BUU-GET ภาษาอังกฤษ',
  'การสอบวัดความรู้ภาษาอังกฤษ',
  'BUU English Proficiency Test',
  'สอบวัดระดับภาษาอังกฤษ ป.ตรี',
  'BUU-GET รอบทั่วไป',
];
const EXAM_FEES = [500, 600, 750, 800, 1000];

const rand = (n: number): number => Math.floor(Math.random() * n);
const pick = <T>(arr: T[]): T => arr[rand(arr.length)];
const randDigits = (n: number): string =>
  Array.from({ length: n }, () => rand(10)).join('');
const pad2 = (n: number): string => String(n).padStart(2, '0');

interface Candidate {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  nationalId: string;
  address: string;
}

async function api<T>(
  method: 'GET' | 'POST' | 'DELETE',
  url: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const p = JSON.parse(text) as { message?: string | string[] };
      msg = Array.isArray(p.message) ? p.message.join(', ') : p.message || text;
    } catch {
      /* keep */
    }
    throw new Error(`${res.status} ${msg}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ════════════ Phase 1: users (ผ่าน DB) ════════════
async function seedUsers(): Promise<Candidate[]> {
  const { default: AppDataSource } = await import('../data-source');
  const { User } = await import('../../modules/users/entities/user.entity');
  const { Role } = await import('../../modules/roles/entities/role.entity');
  const { UserProfile } =
    await import('../../modules/user-profile/entities/user-profile.entity');

  await AppDataSource.initialize();
  try {
    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);
    const profileRepo = AppDataSource.getRepository(UserProfile);

    const ensureRole = async (name: RoleEnum, desc: string) => {
      let r = await roleRepo.findOne({ where: { ROLE_NAME: name } });
      if (!r) {
        r = await roleRepo.save(
          roleRepo.create({ ROLE_NAME: name, ROLE_DESCRIPTION: desc }),
        );
      }
      return r;
    };
    const candidateRole = await ensureRole(RoleEnum.CANDIDATE, 'ผู้สมัครสอบ');
    const staffRole = await ensureRole(RoleEnum.STAFF, 'เจ้าหน้าที่สถาบันภาษา');
    await ensureRole(RoleEnum.SUPER_ADMIN, 'ผู้ดูแลระบบสูงสุด');

    const hashed = await bcrypt.hash(PASSWORD, await bcrypt.genSalt());

    // upsert staff02 (เจ้าหน้าที่เปิดการสอบ → role staff)
    const upsertUser = async (
      email: string,
      role: typeof staffRole,
    ): Promise<InstanceType<typeof User>> => {
      const u = await userRepo.findOne({
        where: { USER_EMAIL: email },
        relations: ['ROLES_ID'],
        withDeleted: true,
      });
      if (u) {
        u.USER_PASSWORD = hashed;
        u.USER_STATUS = 'ACTIVE';
        u.DELETED_AT = null;
        u.ROLES_ID = [role];
        return userRepo.save(u);
      }
      return userRepo.save(
        userRepo.create({
          USER_EMAIL: email,
          USER_PASSWORD: hashed,
          USER_STATUS: 'ACTIVE',
          ROLES_ID: [role],
        }),
      );
    };
    await upsertUser(STAFF_EMAIL, staffRole);
    console.log(`✓ staff02 (${STAFF_EMAIL}) พร้อมใช้ (role staff)`);

    // upsert MSG_T_PERSON + PERSON_ROLES คู่กับ staff02 (login ยังใช้ User)
    const { MsgPerson } =
      await import('../../modules/msg-persons/entities/msg-person.entity');
    const personRepo = AppDataSource.getRepository(MsgPerson);
    let staffPerson = await personRepo.findOne({
      where: { PSN_ID: STAFF_PSN_ID },
      relations: ['ROLES'],
    });
    if (staffPerson) {
      staffPerson.PSN_EMAIL_BUU = STAFF_EMAIL;
      staffPerson.PSN_IDCARD = STAFF_PSN_IDCARD;
      staffPerson.PSN_USERNAME = 'staff02';
      staffPerson.PSN_FNAMETH = 'เจ้าหน้าที่';
      staffPerson.PSN_LNAMETH = 'เปิดสอบ';
      staffPerson.PSN_RETIRE = 'N';
      staffPerson.ROLES = [staffRole];
      await personRepo.save(staffPerson);
    } else {
      staffPerson = await personRepo.save(
        personRepo.create({
          PSN_ID: STAFF_PSN_ID,
          PSN_EMAIL_BUU: STAFF_EMAIL,
          PSN_IDCARD: STAFF_PSN_IDCARD,
          PSN_USERNAME: 'staff02',
          PSN_FNAMETH: 'เจ้าหน้าที่',
          PSN_LNAMETH: 'เปิดสอบ',
          PSN_RETIRE: 'N',
          ROLES: [staffRole],
        }),
      );
    }
    console.log(`✓ MSG_T_PERSON ${staffPerson.PSN_ID} + PERSON_ROLES (staff)`);

    // 100 candidates — ชื่อ-สกุลไม่ซ้ำ (deterministic ตาม index)
    const usedNames = new Set<string>();
    const candidates: Candidate[] = [];
    let maleIdx = 0;
    let femaleIdx = 0;

    for (let i = 1; i <= CANDIDATE_COUNT; i++) {
      const isMale = i % 2 === 0;
      const idx = isMale ? maleIdx++ : femaleIdx++;
      const fi = idx % 15;
      const li = Math.floor(idx / 15) % 15;
      const firstTh = (isMale ? MALE_FIRST : FEMALE_FIRST)[fi];
      const lastTh = LAST[li];
      const firstEn = (isMale ? EN_MALE_FIRST : EN_FEMALE_FIRST)[fi];
      const lastEn = EN_LAST[li];
      const fullName = `${firstTh} ${lastTh}`;
      if (usedNames.has(fullName)) {
        throw new Error(`ชื่อซ้ำ: ${fullName} (i=${i}) — เพิ่ม name pool`);
      }
      usedNames.add(fullName);

      const seq = String(i).padStart(3, '0');
      const email = `test${seq}@gmail.com`;
      const phone = `0${pick(['6', '8', '9'])}${randDigits(8)}`;
      const nationalId = `${pick(['1', '2', '3'])}${randDigits(12)}`;
      // USER_CODE: {ปีงบ พ.ศ.}{1 ไทย}{รัน 5 หลัก}
      const userCode = `25691${String(i).padStart(5, '0')}`;
      const dob = `${1995 + (i % 10)}-${pad2((i % 12) + 1)}-${pad2((i % 27) + 1)}`;
      const address = `${10 + i}/${i} หมู่ ${i % 9} ต.แสนสุข อ.เมือง จ.${pick(PROVINCE)}`;

      let u = await userRepo.findOne({
        where: { USER_EMAIL: email },
        relations: ['ROLES_ID'],
        withDeleted: true,
      });
      if (u) {
        u.USER_PASSWORD = hashed;
        u.USER_STATUS = 'ACTIVE';
        u.USER_CODE = userCode;
        u.USER_NATIONAL_ID = nationalId;
        u.DELETED_AT = null;
        u.ROLES_ID = [candidateRole];
        u = await userRepo.save(u);
      } else {
        u = await userRepo.save(
          userRepo.create({
            USER_EMAIL: email,
            USER_PASSWORD: hashed,
            USER_STATUS: 'ACTIVE',
            USER_CODE: userCode,
            USER_NATIONAL_ID: nationalId,
            ROLES_ID: [candidateRole],
          }),
        );
      }

      const profileData = {
        userId: u.USER_ID,
        userTitleTh: isMale ? 'นาย' : 'นางสาว',
        userFullnameTh: fullName,
        userTitleEn: isMale ? 'Mr.' : 'Ms.',
        userFullnameEn: `${firstEn} ${lastEn}`,
        userDateOfBirth: new Date(dob),
        userPhone: phone,
        userEducation: pick(EDUCATION),
        userFaculty: pick(FACULTY),
        userInstitution: pick(INSTITUTION),
        userCountry: 'ไทย',
        userAddress: address,
        userThaidSynced: false,
        deletedAt: null,
      };
      let profile = await profileRepo.findOne({
        where: { userId: u.USER_ID },
        withDeleted: true,
      });
      if (profile) {
        Object.assign(profile, profileData);
      } else {
        profile = profileRepo.create(profileData);
      }
      await profileRepo.save(profile);

      candidates.push({
        userId: u.USER_ID,
        email,
        fullName,
        phone,
        nationalId,
        address,
      });
    }

    // sync sequence ให้ตรงกับ USER_CODE ที่ seed ใส่เอง
    await AppDataSource.query(`
      INSERT INTO \`BUU_GET_T_USER_CODE_SEQ\` (\`UCS_FISCAL_YEAR_BE\`, \`UCS_PERSON_TYPE\`, \`UCS_LAST_NO\`)
      SELECT
        LEFT(\`USER_CODE\`, 4),
        SUBSTRING(\`USER_CODE\`, 5, 1),
        MAX(CAST(RIGHT(\`USER_CODE\`, 5) AS UNSIGNED))
      FROM \`BUU_GET_T_USER\`
      WHERE \`USER_CODE\` REGEXP '^[0-9]{10}$'
      GROUP BY LEFT(\`USER_CODE\`, 4), SUBSTRING(\`USER_CODE\`, 5, 1)
      ON DUPLICATE KEY UPDATE \`UCS_LAST_NO\` = GREATEST(\`UCS_LAST_NO\`, VALUES(\`UCS_LAST_NO\`))
    `);

    console.log(
      `✓ candidate users: ${candidates.length} คน (ชื่อไม่ซ้ำ ${usedNames.size})`,
    );
    return candidates;
  } finally {
    await AppDataSource.destroy();
  }
}

// ════════════ Phase 2: เปิด 10 การสอบ (ผ่าน API ในนาม staff02) ════════════
interface SeedExam {
  examId: number;
  fee: number;
  sessionIds: number[];
}

interface BackendExam {
  EXAM_ID: number;
  EXAM_MOODLE_COURSE_ID: string | null;
}

async function removeSeedExams(token: string): Promise<void> {
  const allExams = await api<BackendExam[]>('GET', '/exam', undefined, token);
  const seedExamIds = allExams
    .filter((exam) => exam.EXAM_MOODLE_COURSE_ID === SEED_TAG)
    .map((exam) => exam.EXAM_ID);

  if (seedExamIds.length === 0) return;

  await Promise.all(
    seedExamIds.map((examId) =>
      api<void>('DELETE', `/exam/${examId}`, undefined, token),
    ),
  );
  console.log(`✓ ลบข้อสอบ demo เดิม ${seedExamIds.length} รายการแล้ว`);
}

async function seedExams(token: string): Promise<SeedExam[]> {
  await removeSeedExams(token);

  // location จริงที่ capacity ≥ 40
  interface Loc {
    LOCATION_ID: number;
    LOCATION_SEAT_CAPACITY: number | null;
  }
  const locations = await api<Loc[]>(
    'GET',
    '/exam-locations',
    undefined,
    token,
  );
  const usableLocs = locations.filter(
    (l) => (l.LOCATION_SEAT_CAPACITY ?? 0) >= MIN_SEATS,
  );
  if (usableLocs.length === 0) {
    throw new Error(`ไม่มี location ที่ capacity ≥ ${MIN_SEATS}`);
  }
  console.log(
    `✓ location ใช้ได้ (cap ≥ ${MIN_SEATS}): ${usableLocs.length} ห้อง`,
  );

  const result: SeedExam[] = [];

  const now = Date.now();
  const day = 86400000;
  for (let i = 1; i <= EXAM_COUNT; i++) {
    const fee = pick(EXAM_FEES);
    const examDate = new Date(now + (20 + rand(160)) * day);
    const examDateStr = examDate.toISOString().slice(0, 10);
    const regStart = new Date(now - 10 * day).toISOString();
    const regEnd = new Date(examDate.getTime() - 7 * day).toISOString();

    const exam = await api<{ EXAM_ID: number }>(
      'POST',
      '/exam',
      {
        EXAM_NAME: `${pick(EXAM_NAMES)} ครั้งที่ ${i}/2569`,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FORMAT: pick(['กระดาษ', 'คอมพิวเตอร์']),
        EXAM_FEE: fee,
        EXAM_DATE: examDateStr,
        EXAM_REG_START_DATE: regStart,
        EXAM_REG_END_DATE: regEnd,
        EXAM_PAY_START_DATE: regStart,
        EXAM_PAY_END_DATE: regEnd,
        EXAM_PUBLISHED: true,
        EXAM_ROUND: String(i),
        EXAM_FISCAL_YEAR: '2569',
        EXAM_MOODLE_COURSE_ID: SEED_TAG,
      },
      token,
    );

    // 1–2 sessions ต่อ exam, แต่ละ session ผูก location จริง + ตั้ง SS_CAPACITY ตามห้อง
    const sessionCount = 1 + rand(2);
    const sessionIds: number[] = [];
    const times = [
      ['09:00:00', '12:00:00'],
      ['13:00:00', '16:00:00'],
    ];
    for (let s = 0; s < sessionCount; s++) {
      const loc = pick(usableLocs);
      const capacity = loc.LOCATION_SEAT_CAPACITY ?? MIN_SEATS;
      const session = await api<{ SS_ID: number }>(
        'POST',
        '/exam-sessions',
        {
          EXAM_ID: exam.EXAM_ID,
          SS_START_TIME: times[s][0],
          SS_END_TIME: times[s][1],
          SS_CAPACITY: capacity,
          SS_SESSION_STATUS: 1, // OPEN
        },
        token,
      );
      await api(
        'POST',
        '/exam-session-locations',
        {
          SS_ID: session.SS_ID,
          LOCATION_ID: loc.LOCATION_ID,
          SS_NAME: `ห้องสอบ ${i}-${s + 1}`,
        },
        token,
      );
      sessionIds.push(session.SS_ID);
    }

    result.push({ examId: exam.EXAM_ID, fee, sessionIds });
    console.log(
      `  ✓ เปิดการสอบ [${exam.EXAM_ID}] fee=${fee} sessions=${sessionIds.length}`,
    );
  }
  return result;
}

// ════════════ Phase 3: enroll + pay (random) ════════════
async function enrollAndPay(
  candidates: Candidate[],
  exams: SeedExam[],
  token: string,
): Promise<void> {
  let enrolled = 0;
  let paid = 0;
  const errors: string[] = [];

  for (const cand of candidates) {
    // สุ่ม 2–5 การสอบ (ไม่ซ้ำ)
    const count = ENROLL_MIN + rand(ENROLL_MAX - ENROLL_MIN + 1);
    const shuffled = [...exams].sort(() => Math.random() - 0.5).slice(0, count);

    for (const exam of shuffled) {
      const sessionId = exam.sessionIds[rand(exam.sessionIds.length)];
      let ermId: number;
      try {
        const e = await api<{ ERM_ID: number }>(
          'POST',
          '/exam-enrollments',
          {
            USER_ID: cand.userId,
            SESSION_ID: sessionId,
            PHYSICAL_STATUS: 'ทั่วไป',
          },
          token,
        );
        ermId = e.ERM_ID;
        enrolled++;
      } catch (err) {
        const m = (err as Error).message;
        if (!m.includes('ลงทะเบียนในรอบเวลานี้')) {
          errors.push(`[${cand.email}] enroll ${exam.examId}: ${m}`);
        }
        continue;
      }
      try {
        await api(
          'POST',
          '/transactions/pending-payment',
          {
            ERM_ID: ermId,
            TRANX_AMOUNT: exam.fee,
            RC_TAX_ID: cand.nationalId,
            RC_NAME: cand.fullName,
            RC_PHONE: cand.phone,
            RC_ADDRESS: cand.address,
          },
          token,
        );
        paid++;
      } catch (err) {
        errors.push(
          `[${cand.email}] pay erm ${ermId}: ${(err as Error).message}`,
        );
      }
    }
  }

  console.log(`\n===== สรุป enroll/pay =====`);
  console.log(
    `ลงทะเบียนสำเร็จ: ${enrolled} | จ่ายสำเร็จ: ${paid} | error: ${errors.length}`,
  );
  errors.slice(0, 20).forEach((e) => console.log('  ' + e));
}

async function main(): Promise<void> {
  console.log('=== DEMO SEED เริ่มทำงาน ===\n');
  const candidates = await seedUsers();

  const login = await api<{ accessToken: string; user: { role: string } }>(
    'POST',
    '/auth/login',
    { email: STAFF_EMAIL, password: PASSWORD },
  );
  console.log(`✓ login staff02 (role=${login.user.role})`);

  const exams = await seedExams(login.accessToken);
  console.log(`✓ การสอบที่เปิด: ${exams.length} รายการ\n`);

  await enrollAndPay(candidates, exams, login.accessToken);
  console.log('\n=== DEMO SEED เสร็จสิ้น ===');
}

main().catch((err) => {
  console.error('✗ seed failed:', err);
  process.exit(1);
});
