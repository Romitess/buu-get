/**
 * Seed — เติมที่นั่งสอบให้เต็มทุก session + จ่ายเงินแล้ว (idempotent)
 *
 * พฤติกรรม:
 *   - ตรวจความจุ SS_CAPACITY ของแต่ละ session ใน exam เป้าหมาย
 *   - สร้าง candidate เพิ่มถ้าไม่พอ (email: fill{examId}_{nnn}@example.com)
 *   - ข้ามคนที่มี enrollment active อยู่แล้วใน exam (UNPAID/PAID/SEAT_*)
 *   - เติมทีละ session จนเต็ม (ไม่หยุดทั้ง exam เมื่อรอบเดียวเต็ม)
 *   - POST /exam-enrollments → POST /transactions/pending-payment (ตั้ง PAID ทันที)
 *
 * ต้องเปิด backend ไว้ก่อนรัน (อ่าน PORT จาก env)
 *
 *   npm run seed:enroll-exam-paid -- --examId=452
 *   npm run seed:enroll-exam-paid              (default examId=28)
 */
import '../../config/load-env';

import * as bcrypt from 'bcrypt';
import type { DataSource, Repository } from 'typeorm';
import { RoleEnum } from '../../modules/roles/enums/role.enum';
import { ExamEnrollmentStatus } from '../../modules/exam-enrollments/entities/exam-enrollment.entity';

const API_PORT = process.env.PORT ?? '3000';
const BASE_URL =
  process.env.SEED_API_BASE_URL ?? `http://localhost:${API_PORT}/api`;
const STAFF_EMAIL = process.env.SEED_STAFF_EMAIL ?? 'staff02@go.buu.ac.th';
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD ?? 'password123';
const DEFAULT_EXAM_ID = 28;
const FALLBACK_PHONE = '0800000000';
const FALLBACK_ADDRESS = 'มหาวิทยาลัยบูรพา จ.ชลบุรี';
const CANDIDATE_PASSWORD = 'password123';

interface Candidate {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  taxId: string;
  address: string;
}

interface SessionFillPlan {
  sessionId: number;
  startTime: string | null;
  endTime: string | null;
  capacity: number;
  activeBefore: number;
  seatsNeeded: number;
  enrolledThisRun: number;
  paidThisRun: number;
}

function parseExamId(argv: string[]): number {
  const flag = argv.find((a) => a.startsWith('--examId='));
  if (flag) {
    const n = Number(flag.split('=')[1]);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(`examId ไม่ถูกต้อง: ${flag}`);
    }
    return n;
  }
  const envId = Number(process.env.SEED_EXAM_ID);
  if (Number.isFinite(envId) && envId > 0) {
    return envId;
  }
  return DEFAULT_EXAM_ID;
}

function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

function normalizePhone(phone: string | null | undefined): string {
  const d = digitsOnly(phone);
  if (d.length === 10) {
    return d;
  }
  if (d.length === 9 && d.startsWith('8')) {
    return `0${d}`;
  }
  return FALLBACK_PHONE;
}

function normalizeTaxId(
  nationalId: string | null | undefined,
  passport: string | null | undefined,
  userId: number,
): string {
  const nid = digitsOnly(nationalId);
  if (nid.length > 0 && nid.length <= 15) {
    return nid.slice(0, 15);
  }
  const pp = (passport ?? '').trim();
  if (pp.length > 0) {
    return pp.slice(0, 15);
  }
  return `SEED${String(userId).padStart(10, '0')}`.slice(0, 15);
}

async function api<T>(
  method: 'GET' | 'POST',
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
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      msg = Array.isArray(parsed.message)
        ? parsed.message.join(', ')
        : parsed.message || text;
    } catch {
      /* keep raw */
    }
    throw new Error(`${res.status} ${msg}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function ensureStaffLoginUser(ds: DataSource): Promise<void> {
  const { User } = await import('../../modules/users/entities/user.entity');
  const { Role } = await import('../../modules/roles/entities/role.entity');
  const { MsgPerson } =
    await import('../../modules/msg-persons/entities/msg-person.entity');

  const roleRepo = ds.getRepository(Role);
  const userRepo = ds.getRepository(User);
  const personRepo = ds.getRepository(MsgPerson);
  const STAFF_PSN_ID = 'DEMOSTAFF2';

  let staffRole = await roleRepo.findOne({
    where: { ROLE_NAME: RoleEnum.STAFF },
  });
  if (!staffRole) {
    staffRole = await roleRepo.save(
      roleRepo.create({
        ROLE_NAME: RoleEnum.STAFF,
        ROLE_DESCRIPTION: 'เจ้าหน้าที่สถาบันภาษา',
      }),
    );
  }

  const hashed = await bcrypt.hash(STAFF_PASSWORD, await bcrypt.genSalt());
  const existing = await userRepo.findOne({
    where: { USER_EMAIL: STAFF_EMAIL },
    relations: ['ROLES_ID'],
    withDeleted: true,
  });

  if (existing) {
    existing.USER_PASSWORD = hashed;
    existing.USER_STATUS = 'ACTIVE';
    existing.DELETED_AT = null;
    existing.ROLES_ID = [staffRole];
    await userRepo.save(existing);
  } else {
    await userRepo.save(
      userRepo.create({
        USER_EMAIL: STAFF_EMAIL,
        USER_PASSWORD: hashed,
        USER_STATUS: 'ACTIVE',
        ROLES_ID: [staffRole],
      }),
    );
  }
  console.log(`✓ ensure staff login: ${STAFF_EMAIL}`);

  const staffPerson = await personRepo.findOne({
    where: { PSN_ID: STAFF_PSN_ID },
    relations: ['ROLES'],
  });
  if (staffPerson) {
    staffPerson.PSN_EMAIL_BUU = STAFF_EMAIL;
    staffPerson.PSN_USERNAME = 'staff02';
    staffPerson.PSN_RETIRE = 'N';
    staffPerson.ROLES = [staffRole];
    await personRepo.save(staffPerson);
  } else {
    await personRepo.save(
      personRepo.create({
        PSN_ID: STAFF_PSN_ID,
        PSN_EMAIL_BUU: STAFF_EMAIL,
        PSN_USERNAME: 'staff02',
        PSN_FNAMETH: 'เจ้าหน้าที่',
        PSN_LNAMETH: 'เปิดสอบ',
        PSN_RETIRE: 'N',
        ROLES: [staffRole],
      }),
    );
  }
  console.log(`✓ ensure MSG_T_PERSON ${STAFF_PSN_ID} + PERSON_ROLES`);
}

async function countActiveInSession(
  enrollmentRepo: Repository<
    import('../../modules/exam-enrollments/entities/exam-enrollment.entity').ExamEnrollment
  >,
  sessionId: number,
): Promise<number> {
  return enrollmentRepo
    .createQueryBuilder('enrollment')
    .where('enrollment.SESSION_ID = :sessionId', { sessionId })
    .andWhere('enrollment.ERM_STATUS != :cancelled', {
      cancelled: ExamEnrollmentStatus.CANCELLED,
    })
    .getCount();
}

async function ensureEnoughCandidates(
  ds: DataSource,
  examId: number,
  needed: number,
  alreadyEnrolled: Set<number>,
): Promise<Candidate[]> {
  const { User } = await import('../../modules/users/entities/user.entity');
  const { Role } = await import('../../modules/roles/entities/role.entity');
  const { UserProfile } =
    await import('../../modules/user-profile/entities/user-profile.entity');

  const roleRepo = ds.getRepository(Role);
  const userRepo = ds.getRepository(User);
  const profileRepo = ds.getRepository(UserProfile);

  let candidateRole = await roleRepo.findOne({
    where: { ROLE_NAME: RoleEnum.CANDIDATE },
  });
  if (!candidateRole) {
    candidateRole = await roleRepo.save(
      roleRepo.create({
        ROLE_NAME: RoleEnum.CANDIDATE,
        ROLE_DESCRIPTION: 'ผู้สมัครสอบ',
      }),
    );
  }

  const candidatesRaw = await userRepo
    .createQueryBuilder('user')
    .innerJoin('user.ROLES_ID', 'role', 'role.ROLE_NAME = :role', {
      role: RoleEnum.CANDIDATE,
    })
    .leftJoinAndSelect('user.PROFILE', 'profile')
    .where('user.USER_STATUS = :status', { status: 'ACTIVE' })
    .orderBy('user.USER_ID', 'ASC')
    .getMany();

  const available: Candidate[] = candidatesRaw
    .filter((u) => !alreadyEnrolled.has(u.USER_ID))
    .map((u) => {
      const fullName =
        u.PROFILE?.userFullnameTh?.trim() ||
        u.PROFILE?.userFullnameEn?.trim() ||
        u.USER_EMAIL;
      return {
        userId: u.USER_ID,
        email: u.USER_EMAIL,
        fullName,
        phone: normalizePhone(u.PROFILE?.userPhone),
        taxId: normalizeTaxId(
          u.USER_NATIONAL_ID,
          u.USER_PASSPORT_NO,
          u.USER_ID,
        ),
        address: u.PROFILE?.userAddress?.trim() || FALLBACK_ADDRESS,
      };
    });

  console.log(
    `✓ candidates ACTIVE: ${candidatesRaw.length} | ว่างสำหรับ exam นี้: ${available.length} | ต้องการ: ${needed}`,
  );

  if (available.length >= needed) {
    return available;
  }

  const toCreate = needed - available.length;
  console.log(`→ สร้าง candidate เพิ่ม ${toCreate} คน (fill${examId}_*)`);
  const hashed = await bcrypt.hash(CANDIDATE_PASSWORD, await bcrypt.genSalt());

  for (let i = 1; available.length < needed; i += 1) {
    const seq = String(i).padStart(3, '0');
    const email = `fill${examId}_${seq}@example.com`;
    const fullName = `ผู้สมัครทดสอบ ${examId}-${seq}`;
    const phone = `08${String(10000000 + (examId % 100) * 1000 + i).slice(-8)}`;
    const nationalId =
      `9${String(examId).padStart(4, '0')}${String(i).padStart(8, '0')}`.slice(
        0,
        13,
      );

    let user = await userRepo.findOne({
      where: { USER_EMAIL: email },
      relations: ['ROLES_ID'],
      withDeleted: true,
    });

    if (user) {
      user.USER_PASSWORD = hashed;
      user.USER_STATUS = 'ACTIVE';
      user.USER_NATIONAL_ID = nationalId;
      user.DELETED_AT = null;
      user.ROLES_ID = [candidateRole];
      user = await userRepo.save(user);
    } else {
      user = await userRepo.save(
        userRepo.create({
          USER_EMAIL: email,
          USER_PASSWORD: hashed,
          USER_STATUS: 'ACTIVE',
          USER_NATIONAL_ID: nationalId,
          ROLES_ID: [candidateRole],
        }),
      );
    }

    if (alreadyEnrolled.has(user.USER_ID)) {
      continue;
    }

    const profileData = {
      userId: user.USER_ID,
      userTitleTh: 'นาย',
      userFullnameTh: fullName,
      userTitleEn: 'Mr.',
      userFullnameEn: `Fill Candidate ${examId}-${seq}`,
      userPhone: phone,
      userCountry: 'ไทย',
      userAddress: FALLBACK_ADDRESS,
      userThaidSynced: false,
      deletedAt: null,
    };

    let profile = await profileRepo.findOne({
      where: { userId: user.USER_ID },
      withDeleted: true,
    });
    if (profile) {
      Object.assign(profile, profileData);
    } else {
      profile = profileRepo.create(profileData);
    }
    await profileRepo.save(profile);

    if (!available.some((c) => c.userId === user.USER_ID)) {
      available.push({
        userId: user.USER_ID,
        email,
        fullName,
        phone,
        taxId: normalizeTaxId(nationalId, null, user.USER_ID),
        address: FALLBACK_ADDRESS,
      });
    }
  }

  console.log(`✓ candidates พร้อมใช้หลัง ensure: ${available.length}`);
  return available;
}

async function main(): Promise<void> {
  const examId = parseExamId(process.argv.slice(2));
  console.log(`=== ENROLL+PAY FILL-CAPACITY SEED (examId=${examId}) ===`);
  console.log(`API: ${BASE_URL}\n`);

  const { default: AppDataSource } = await import('../data-source');
  const { Exam } = await import('../../modules/exam/entities/exam.entity');
  const { ExamSession } =
    await import('../../modules/exam-sessions/entities/exam-session.entity');
  const { ExamEnrollment } =
    await import('../../modules/exam-enrollments/entities/exam-enrollment.entity');

  await AppDataSource.initialize();

  try {
    const examRepo = AppDataSource.getRepository(Exam);
    const sessionRepo = AppDataSource.getRepository(ExamSession);
    const enrollmentRepo = AppDataSource.getRepository(ExamEnrollment);

    const exam = await examRepo.findOne({ where: { EXAM_ID: examId } });
    if (!exam) {
      throw new Error(`ไม่พบ examId=${examId}`);
    }

    const sessions = await sessionRepo.find({
      where: { EXAM_ID: examId },
      order: { SS_ID: 'ASC' },
    });
    if (sessions.length === 0) {
      throw new Error(`examId=${examId} ไม่มี session`);
    }

    const fee = Number(exam.EXAM_FEE);
    const plans: SessionFillPlan[] = [];
    for (const session of sessions) {
      const capacity = Number(session.SS_CAPACITY) || 0;
      const activeBefore = await countActiveInSession(
        enrollmentRepo,
        session.SS_ID,
      );
      const seatsNeeded = Math.max(0, capacity - activeBefore);
      plans.push({
        sessionId: session.SS_ID,
        startTime: session.SS_START_TIME ?? null,
        endTime: session.SS_END_TIME ?? null,
        capacity,
        activeBefore,
        seatsNeeded,
        enrolledThisRun: 0,
        paidThisRun: 0,
      });
    }

    const totalNeeded = plans.reduce((sum, p) => sum + p.seatsNeeded, 0);
    console.log(
      `✓ exam [${exam.EXAM_ID}] "${exam.EXAM_NAME}" fee=${fee} published=${exam.EXAM_PUBLISHED}`,
    );
    console.log(
      `✓ reg ${String(exam.EXAM_REG_START_DATE)} → ${String(exam.EXAM_REG_END_DATE)} | examDate=${exam.EXAM_DATE}`,
    );
    for (const p of plans) {
      console.log(
        `  session ${p.sessionId} ${p.startTime}-${p.endTime} cap=${p.capacity} active=${p.activeBefore} need=${p.seatsNeeded}`,
      );
    }

    if (totalNeeded === 0) {
      console.log('\nทุก session เต็มอยู่แล้ว — จบงาน (idempotent)');
      return;
    }

    await ensureStaffLoginUser(AppDataSource);

    const alreadyEnrolledRows = await enrollmentRepo
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .select('enrollment.USER_ID', 'USER_ID')
      .distinct(true)
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS IN (:...activeStatuses)', {
        activeStatuses: [
          ExamEnrollmentStatus.UNPAID,
          ExamEnrollmentStatus.PAID,
          ExamEnrollmentStatus.SEAT_ASSIGNED,
          ExamEnrollmentStatus.SEAT_PUBLISHED,
          ExamEnrollmentStatus.ATTENDED,
          ExamEnrollmentStatus.MISSING,
        ],
      })
      .getRawMany<{ USER_ID: number }>();

    const alreadyEnrolled = new Set(
      alreadyEnrolledRows.map((r) => Number(r.USER_ID)),
    );
    console.log(
      `✓ enrolled อยู่แล้วใน exam ${examId}: ${alreadyEnrolled.size} คน`,
    );

    const candidates = await ensureEnoughCandidates(
      AppDataSource,
      examId,
      totalNeeded,
      alreadyEnrolled,
    );

    const login = await api<{ accessToken: string; user: { role: string } }>(
      'POST',
      '/auth/login',
      { email: STAFF_EMAIL, password: STAFF_PASSWORD },
    );
    console.log(
      `✓ login ${STAFF_EMAIL} (role=${login.user.role}) → เริ่มเติมทีละ session\n`,
    );

    const token = login.accessToken;
    let candidateCursor = 0;
    const errors: string[] = [];
    let skippedConflict = 0;

    for (const plan of plans) {
      if (plan.seatsNeeded === 0) {
        console.log(`✓ session ${plan.sessionId}: เต็มอยู่แล้ว ข้าม`);
        continue;
      }

      console.log(
        `→ เติม session ${plan.sessionId} (${plan.startTime}-${plan.endTime}) อีก ${plan.seatsNeeded} ที่นั่ง`,
      );

      while (plan.enrolledThisRun < plan.seatsNeeded) {
        if (candidateCursor >= candidates.length) {
          errors.push(
            `session ${plan.sessionId}: หมด candidate ก่อนเต็ม (ได้ ${plan.enrolledThisRun}/${plan.seatsNeeded})`,
          );
          break;
        }

        const cand = candidates[candidateCursor];
        candidateCursor += 1;

        let ermId: number;
        try {
          const enrollment = await api<{ ERM_ID: number; SESSION_ID?: number }>(
            'POST',
            '/exam-enrollments',
            {
              USER_ID: cand.userId,
              SESSION_ID: plan.sessionId,
              PHYSICAL_STATUS: 'ทั่วไป',
            },
            token,
          );
          ermId = enrollment.ERM_ID;
          plan.enrolledThisRun += 1;
        } catch (err) {
          const message = (err as Error).message;
          if (message.includes('ลงทะเบียนในรอบเวลานี้')) {
            skippedConflict += 1;
            continue;
          }
          if (message.includes('FULL')) {
            console.log(
              `⚠ session ${plan.sessionId} รายงาน FULL หลังจำนวนที่สมัครรอบนี้=${plan.enrolledThisRun}`,
            );
            break;
          }
          errors.push(
            `[${cand.email}] enroll ss=${plan.sessionId}: ${message}`,
          );
          continue;
        }

        try {
          await api(
            'POST',
            '/transactions/pending-payment',
            {
              ERM_ID: ermId,
              TRANX_AMOUNT: fee,
              RC_TAX_ID: cand.taxId,
              RC_NAME: cand.fullName.slice(0, 255),
              RC_PHONE: cand.phone,
              RC_ADDRESS: cand.address.slice(0, 500),
            },
            token,
          );
          plan.paidThisRun += 1;
        } catch (err) {
          errors.push(
            `[${cand.email}] pay erm=${ermId}: ${(err as Error).message}`,
          );
        }
      }

      const activeAfter = await countActiveInSession(
        enrollmentRepo,
        plan.sessionId,
      );
      console.log(
        `  ✓ session ${plan.sessionId}: +enroll=${plan.enrolledThisRun} +paid=${plan.paidThisRun} | active ตอนนี้ ${activeAfter}/${plan.capacity}`,
      );
    }

    console.log('\n===== สรุปต่อ session =====');
    for (const plan of plans) {
      const activeAfter = await countActiveInSession(
        enrollmentRepo,
        plan.sessionId,
      );
      const paidCount = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .where('enrollment.SESSION_ID = :sessionId', {
          sessionId: plan.sessionId,
        })
        .andWhere('enrollment.ERM_STATUS IN (:...paidStatuses)', {
          paidStatuses: [
            ExamEnrollmentStatus.PAID,
            ExamEnrollmentStatus.SEAT_ASSIGNED,
            ExamEnrollmentStatus.SEAT_PUBLISHED,
            ExamEnrollmentStatus.ATTENDED,
          ],
        })
        .getCount();
      const unpaidCount = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .where('enrollment.SESSION_ID = :sessionId', {
          sessionId: plan.sessionId,
        })
        .andWhere('enrollment.ERM_STATUS = :unpaid', {
          unpaid: ExamEnrollmentStatus.UNPAID,
        })
        .getCount();

      console.log(
        `  SS ${plan.sessionId} ${plan.startTime}-${plan.endTime}: active=${activeAfter}/${plan.capacity} paid+=${paidCount} unpaid=${unpaidCount} (+enroll=${plan.enrolledThisRun}, +paid=${plan.paidThisRun})`,
      );
    }

    console.log(`ข้าม conflict: ${skippedConflict}`);
    console.log(`error: ${errors.length}`);
    console.log(
      `สถานะชำระเงินที่ใช้: TRANX_PAYMENT_STATUS=PAID(3), ERM_STATUS=PAID(1) via POST /transactions/pending-payment`,
    );
    if (errors.length > 0) {
      console.log('\n— errors (สูงสุด 30 รายการ) —');
      errors.slice(0, 30).forEach((e) => console.log(`  ${e}`));
    }
  } finally {
    await AppDataSource.destroy();
  }

  console.log('\n=== ENROLL+PAY FILL-CAPACITY SEED เสร็จสิ้น ===');
}

main().catch((err) => {
  console.error('✗ seed failed:', err);
  process.exit(1);
});
