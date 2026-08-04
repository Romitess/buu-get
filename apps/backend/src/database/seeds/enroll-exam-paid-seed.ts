/**
 * Seed — นำผู้สมัคร (candidate) ที่มีอยู่ในระบบไปสมัครสอบ + จ่ายเงินแล้ว
 *
 * พฤติกรรม:
 *   - โหลด candidate ACTIVE ทั้งหมดจาก DB
 *   - ข้ามคนที่มี enrollment active อยู่แล้วใน exam เป้าหมาย (UNPAID/PAID/SEAT_*)
 *   - POST /exam-enrollments → POST /transactions/pending-payment (ตั้ง PAID ทันที)
 *
 * ต้องเปิด backend ไว้ก่อนรัน (อ่าน PORT จาก env)
 *
 *   npm run seed:enroll-exam-paid -- --examId=28
 *   npm run seed:enroll-exam-paid              (default examId=28)
 */
import '../../config/load-env';

import * as bcrypt from 'bcrypt';
import type { DataSource } from 'typeorm';
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

interface Candidate {
  userId: number;
  email: string;
  fullName: string;
  phone: string;
  taxId: string;
  address: string;
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

  const roleRepo = ds.getRepository(Role);
  const userRepo = ds.getRepository(User);

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
}

async function main(): Promise<void> {
  const examId = parseExamId(process.argv.slice(2));
  console.log(`=== ENROLL+PAY SEED (examId=${examId}) ===`);
  console.log(`API: ${BASE_URL}\n`);

  const { default: AppDataSource } = await import('../data-source');
  const { User } = await import('../../modules/users/entities/user.entity');
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
    const userRepo = AppDataSource.getRepository(User);

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
    console.log(
      `✓ exam [${exam.EXAM_ID}] "${exam.EXAM_NAME}" fee=${fee} sessions=${sessions
        .map((s) => `${s.SS_ID}(cap=${s.SS_CAPACITY})`)
        .join(', ')}`,
    );

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
        ],
      })
      .getRawMany<{ USER_ID: number }>();

    const alreadyEnrolled = new Set(
      alreadyEnrolledRows.map((r) => Number(r.USER_ID)),
    );
    console.log(
      `✓ enrolled อยู่แล้วใน exam ${examId}: ${alreadyEnrolled.size} คน`,
    );

    const candidatesRaw = await userRepo
      .createQueryBuilder('user')
      .innerJoin('user.ROLES_ID', 'role', 'role.ROLE_NAME = :role', {
        role: RoleEnum.CANDIDATE,
      })
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .where('user.USER_STATUS = :status', { status: 'ACTIVE' })
      .orderBy('user.USER_ID', 'ASC')
      .getMany();

    const candidates: Candidate[] = candidatesRaw
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
      `✓ candidates ACTIVE ทั้งหมด: ${candidatesRaw.length} | จะสมัครใหม่: ${candidates.length}`,
    );

    if (candidates.length === 0) {
      console.log('\nไม่มีผู้สมัครที่ต้องสมัครเพิ่ม — จบงาน');
      return;
    }

    const login = await api<{ accessToken: string; user: { role: string } }>(
      'POST',
      '/auth/login',
      { email: STAFF_EMAIL, password: STAFF_PASSWORD },
    );
    console.log(
      `✓ login ${STAFF_EMAIL} (role=${login.user.role}) → เริ่ม enroll+pay\n`,
    );

    const token = login.accessToken;
    const sessionIds = sessions.map((s) => s.SS_ID);
    let sessionCursor = 0;
    let enrolled = 0;
    let paid = 0;
    let skippedConflict = 0;
    let skippedFull = 0;
    let stoppedForFull = false;
    const errors: string[] = [];

    for (const cand of candidates) {
      if (stoppedForFull) {
        skippedFull += 1;
        continue;
      }

      const sessionId = sessionIds[sessionCursor % sessionIds.length];
      sessionCursor += 1;

      let ermId: number;
      try {
        const enrollment = await api<{ ERM_ID: number }>(
          'POST',
          '/exam-enrollments',
          {
            USER_ID: cand.userId,
            SESSION_ID: sessionId,
            PHYSICAL_STATUS: 'ทั่วไป',
          },
          token,
        );
        ermId = enrollment.ERM_ID;
        enrolled += 1;
      } catch (err) {
        const message = (err as Error).message;
        if (message.includes('ลงทะเบียนในรอบเวลานี้')) {
          skippedConflict += 1;
          continue;
        }
        if (message.includes('FULL')) {
          stoppedForFull = true;
          skippedFull += 1;
          console.log(
            `⚠ session เต็ม (FULL) — หยุดรับสมัครเพิ่ม (เหลือข้าม ${candidates.length - enrolled - skippedConflict - skippedFull + 1} คน)`,
          );
          continue;
        }
        errors.push(`[${cand.email}] enroll: ${message}`);
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
        paid += 1;
      } catch (err) {
        errors.push(
          `[${cand.email}] pay erm=${ermId}: ${(err as Error).message}`,
        );
      }
    }

    // สรุปสถานะหลัง seed
    const paidCount = await enrollmentRepo
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS IN (:...paidStatuses)', {
        paidStatuses: [
          ExamEnrollmentStatus.PAID,
          ExamEnrollmentStatus.SEAT_ASSIGNED,
          ExamEnrollmentStatus.SEAT_PUBLISHED,
        ],
      })
      .getCount();

    const unpaidCount = await enrollmentRepo
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS = :unpaid', {
        unpaid: ExamEnrollmentStatus.UNPAID,
      })
      .getCount();

    console.log('\n===== สรุป =====');
    console.log(`สมัครสำเร็จรอบนี้: ${enrolled}`);
    console.log(`จ่ายสำเร็จรอบนี้: ${paid}`);
    console.log(`ข้าม (conflict ระหว่างรัน): ${skippedConflict}`);
    console.log(`ข้ามเพราะที่นั่งเต็ม (FULL): ${skippedFull}`);
    console.log(`error: ${errors.length}`);
    console.log(`รวม PAID+ บน exam ${examId} ตอนนี้: ${paidCount}`);
    console.log(`รวม UNPAID บน exam ${examId} ตอนนี้: ${unpaidCount}`);
    if (errors.length > 0) {
      console.log('\n— errors (สูงสุด 30 รายการ) —');
      errors.slice(0, 30).forEach((e) => console.log(`  ${e}`));
    }
  } finally {
    await AppDataSource.destroy();
  }

  console.log('\n=== ENROLL+PAY SEED เสร็จสิ้น ===');
}

main().catch((err) => {
  console.error('✗ seed failed:', err);
  process.exit(1);
});
