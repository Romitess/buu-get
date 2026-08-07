/**
 * Seed — คละประเภทผู้สมัคร (applicant type) ของ enrollment ใน exam เป้าหมาย
 *
 * อัปเดตแถวที่มีอยู่แล้ว (ไม่ลบ / ไม่สร้าง enrollment ใหม่):
 *   - ERM_PHYSICAL_STATUS → พระภิกษุ/นักบวช, ทุพพลภาพ, ตั้งครรภ์, พิการรณ์, ทั่วไป
 *   - USER_PASSPORT_NO (แท็ก SEED{examId}P…) สำหรับช่อง ชาวต่างชาติ เมื่อสถานะ = ทั่วไป
 *
 * ประเภทที่หน้าจัดที่นั่งใช้กรอง (use-exam-seat-management):
 *   พระภิกษุ / นักบวช | บุคคลทุพพลภาพ | ผู้ตั้งครรภ์ | ผู้พิการรณ์ | ชาวต่างชาติ | ชาวไทย
 *
 * Idempotent: จัดตามลำดับ ERM_ID ในแต่ละ session ซ้ำได้
 *
 *   npm run seed:mix-applicant-types -- --examId=452
 *   npm run seed:mix-applicant-types              (default examId=452)
 */
import '../../config/load-env';

import type { DataSource } from 'typeorm';
import { ExamEnrollmentStatus } from '../../modules/exam-enrollments/entities/exam-enrollment.entity';
import { UserPhysicalStatus } from '../../modules/user-profile/entities/user-profile.entity';

const DEFAULT_EXAM_ID = 452;

/** เป้าหมายต่อ session (ผลรวมต้องเท่าความจุที่ต้องการ — ส่วนเกิน/ขาดจะปรับเป็นชาวไทย) */
interface TypeSlot {
  label: string;
  physicalStatus: UserPhysicalStatus;
  /** true = ทั่วไป + มี passport → UI แสดงเป็น ชาวต่างชาติ */
  foreigner: boolean;
  count: number;
}

const PER_SESSION_PLAN: TypeSlot[] = [
  {
    label: 'พระภิกษุ / นักบวช',
    physicalStatus: UserPhysicalStatus.MONK,
    foreigner: false,
    count: 4,
  },
  {
    label: 'บุคคลทุพพลภาพ',
    physicalStatus: UserPhysicalStatus.DISABLED,
    foreigner: false,
    count: 3,
  },
  {
    label: 'ผู้ตั้งครรภ์',
    physicalStatus: UserPhysicalStatus.PREGNANT,
    foreigner: false,
    count: 3,
  },
  {
    label: 'ผู้พิการรณ์',
    physicalStatus: UserPhysicalStatus.DISABLED_TYPO,
    foreigner: false,
    count: 3,
  },
  {
    label: 'ชาวต่างชาติ',
    physicalStatus: UserPhysicalStatus.GENERAL,
    foreigner: true,
    count: 10,
  },
  {
    label: 'ชาวไทย',
    physicalStatus: UserPhysicalStatus.GENERAL,
    foreigner: false,
    count: 27,
  },
];

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

function seedPassport(examId: number, userId: number): string {
  // unique, ≤50 chars, แท็กให้ลบกลับได้ตอน re-run เป็นคนไทย
  return `SEED${examId}P${userId}`;
}

function isSeedPassport(
  examId: number,
  passport: string | null | undefined,
): boolean {
  if (!passport) return false;
  return passport.startsWith(`SEED${examId}P`);
}

function expandPlan(total: number): TypeSlot[] {
  const plan = PER_SESSION_PLAN.map((s) => ({ ...s }));
  const planned = plan.reduce((sum, s) => sum + s.count, 0);
  const thai = plan.find((s) => s.label === 'ชาวไทย');
  if (!thai) {
    throw new Error('แผนต้องมีช่อง ชาวไทย');
  }
  if (planned < total) {
    thai.count += total - planned;
  } else if (planned > total) {
    const overflow = planned - total;
    if (thai.count >= overflow) {
      thai.count -= overflow;
    } else {
      throw new Error(
        `จำนวน enrollment (${total}) น้อยกว่าแผนขั้นต่ำที่ไม่ใช่ชาวไทย`,
      );
    }
  }
  return plan.filter((s) => s.count > 0);
}

function assignSlots(total: number): TypeSlot[] {
  const plan = expandPlan(total);
  const slots: TypeSlot[] = [];
  for (const slot of plan) {
    for (let i = 0; i < slot.count; i += 1) {
      slots.push(slot);
    }
  }
  return slots;
}

function applicantLabel(
  physicalStatus: UserPhysicalStatus,
  hasPassport: boolean,
): string {
  if (physicalStatus === UserPhysicalStatus.GENERAL) {
    return hasPassport ? 'ชาวต่างชาติ' : 'ชาวไทย';
  }
  return physicalStatus;
}

async function printDistribution(
  ds: DataSource,
  examId: number,
): Promise<void> {
  const rows: Array<{
    SESSION_ID: number;
    phys: number;
    with_passport: string;
    cnt: string;
  }> = await ds.query(
    `
    SELECT
      e.SESSION_ID,
      e.ERM_PHYSICAL_STATUS AS phys,
      SUM(
        CASE
          WHEN u.USER_PASSPORT_NO IS NOT NULL
           AND TRIM(u.USER_PASSPORT_NO) <> '' THEN 1
          ELSE 0
        END
      ) AS with_passport,
      COUNT(*) AS cnt
    FROM EXAM_T_ENROLLMENTS e
    INNER JOIN EXAM_T_SESSIONS s ON s.SS_ID = e.SESSION_ID
    INNER JOIN BUU_GET_T_USER u ON u.USER_ID = e.USER_ID
    WHERE s.EXAM_ID = ?
      AND e.DELETED_AT IS NULL
      AND e.ERM_STATUS <> ?
    GROUP BY e.SESSION_ID, e.ERM_PHYSICAL_STATUS
    ORDER BY e.SESSION_ID, e.ERM_PHYSICAL_STATUS
    `,
    [examId, ExamEnrollmentStatus.CANCELLED],
  );

  const PHYS_LABEL: Record<number, string> = {
    0: 'พระภิกษุ / นักบวช',
    2: 'บุคคลทุพพลภาพ',
    3: 'ผู้ตั้งครรภ์',
    4: 'ผู้พิการรณ์',
    5: 'ทั่วไป (→ ไทย/ต่างชาติ ตาม passport)',
  };

  for (const row of rows) {
    console.log(
      `  SS ${row.SESSION_ID} | phys=${row.phys} (${PHYS_LABEL[row.phys] ?? '?'}) | passport=${row.with_passport}/${row.cnt}`,
    );
  }
}

async function main(): Promise<void> {
  const examId = parseExamId(process.argv.slice(2));
  console.log(`=== MIX APPLICANT TYPES SEED (examId=${examId}) ===\n`);

  const { default: AppDataSource } = await import('../data-source');
  const { Exam } = await import('../../modules/exam/entities/exam.entity');
  const { ExamSession } =
    await import('../../modules/exam-sessions/entities/exam-session.entity');
  const { ExamEnrollment } =
    await import('../../modules/exam-enrollments/entities/exam-enrollment.entity');
  const { User } = await import('../../modules/users/entities/user.entity');

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
      throw new Error(`exam ${examId} ไม่มี session`);
    }

    console.log(
      `พบ ${sessions.length} session: ${sessions.map((s) => s.SS_ID).join(', ')}`,
    );
    console.log('— ก่อนอัปเดต —');
    await printDistribution(AppDataSource, examId);

    let totalUpdated = 0;
    const summary: Array<{
      sessionId: number;
      updated: number;
      byLabel: Record<string, number>;
    }> = [];

    for (const session of sessions) {
      const enrollments = await enrollmentRepo
        .createQueryBuilder('enrollment')
        .innerJoinAndSelect('enrollment.USER', 'user')
        .where('enrollment.SESSION_ID = :sessionId', {
          sessionId: session.SS_ID,
        })
        .andWhere('enrollment.ERM_STATUS != :cancelled', {
          cancelled: ExamEnrollmentStatus.CANCELLED,
        })
        .orderBy('enrollment.ERM_ID', 'ASC')
        .getMany();

      if (enrollments.length === 0) {
        console.log(`\n⚠ session ${session.SS_ID}: ไม่มี enrollment ข้าม`);
        continue;
      }

      const slots = assignSlots(enrollments.length);
      const byLabel: Record<string, number> = {};
      let updated = 0;

      for (let i = 0; i < enrollments.length; i += 1) {
        const enrollment = enrollments[i];
        const slot = slots[i];
        const user = enrollment.USER;
        const label = applicantLabel(slot.physicalStatus, slot.foreigner);
        byLabel[label] = (byLabel[label] ?? 0) + 1;

        let dirtyEnrollment = false;
        let dirtyUser = false;

        if (enrollment.ERM_PHYSICAL_STATUS !== slot.physicalStatus) {
          enrollment.ERM_PHYSICAL_STATUS = slot.physicalStatus;
          dirtyEnrollment = true;
        }

        if (slot.foreigner) {
          const passport = seedPassport(examId, user.USER_ID);
          if (user.USER_PASSPORT_NO !== passport) {
            // เคลียร์ passport แท็ก seed ของ user อื่นที่ชน unique (ไม่น่าเกิด)
            user.USER_PASSPORT_NO = passport;
            dirtyUser = true;
          }
        } else if (isSeedPassport(examId, user.USER_PASSPORT_NO)) {
          user.USER_PASSPORT_NO = null;
          dirtyUser = true;
        }

        if (dirtyEnrollment) {
          await enrollmentRepo.save(enrollment);
          updated += 1;
        }
        if (dirtyUser) {
          await userRepo.save(user);
          if (!dirtyEnrollment) {
            updated += 1;
          }
        }
      }

      totalUpdated += updated;
      summary.push({ sessionId: session.SS_ID, updated, byLabel });
      console.log(
        `\n✓ session ${session.SS_ID}: enrollments=${enrollments.length} rowsTouched≈${updated}`,
      );
      for (const [label, count] of Object.entries(byLabel)) {
        console.log(`    ${label}: ${count}`);
      }
    }

    console.log('\n— หลังอัปเดต —');
    await printDistribution(AppDataSource, examId);
    console.log(`\nรวมแถวที่แตะ (enrollment และ/หรือ user): ~${totalUpdated}`);
    console.log(
      'หมายเหตุ: ไม่แตะ ERM_STATUS / ที่นั่ง / ธุรกรรม — เฉพาะประเภทผู้สมัคร',
    );
    console.log(JSON.stringify({ summary }, null, 2));
  } finally {
    await AppDataSource.destroy();
  }

  console.log('\n=== MIX APPLICANT TYPES SEED เสร็จสิ้น ===');
}

main().catch((err) => {
  console.error('✗ seed failed:', err);
  process.exit(1);
});
