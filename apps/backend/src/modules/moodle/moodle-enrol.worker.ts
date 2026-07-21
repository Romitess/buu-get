import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { MoodleSyncService } from './moodle-sync.service';
import { MoodleEnrolmentInput } from './types/moodle.types';

const RUN_LIMIT = 200;
const CHUNK_SIZE = 100;

/**
 * Background worker — enrol ผู้สมัครที่ชำระเงินแล้วเข้าคอร์ส Moodle เป็น batch
 * (Moodle manual enrol คืน null จึงเก็บ Moodle course id ไว้ที่ ERM_MOODLE_ENROLL_ID เป็นตัวอ้างอิงว่า enrol แล้ว)
 */
@Injectable()
export class MoodleEnrolWorker {
  private readonly logger = new Logger(MoodleEnrolWorker.name);
  private isRunning = false;

  constructor(
    @InjectRepository(ExamEnrollment)
    private readonly enrollmentRepository: Repository<ExamEnrollment>,
    private readonly moodleSync: MoodleSyncService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncPendingEnrolments(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    try {
      const pending = await this.enrollmentRepository
        .createQueryBuilder('e')
        .innerJoinAndSelect('e.USER', 'u')
        .innerJoinAndSelect('e.SESSION', 's')
        .innerJoinAndSelect('s.EXAM', 'ex')
        .where('e.ERM_MOODLE_ENROLL_ID IS NULL')
        .andWhere('e.ERM_STATUS >= :paid', {
          paid: ExamEnrollmentStatus.PAID,
        })
        .andWhere('e.ERM_STATUS != :cancelled', {
          cancelled: ExamEnrollmentStatus.CANCELLED,
        })
        .andWhere('u.USER_MOODLE_ID IS NOT NULL')
        .andWhere('ex.EXAM_MOODLE_COURSE_ID IS NOT NULL')
        .take(RUN_LIMIT)
        .getMany();

      if (pending.length === 0) {
        return;
      }

      for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
        const chunk = pending.slice(i, i + CHUNK_SIZE);
        await this.processChunk(chunk);
      }
    } catch (error) {
      this.logger.error(
        'sync enrol ไป Moodle ล้มเหลว',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async processChunk(chunk: ExamEnrollment[]): Promise<void> {
    const enrolments: MoodleEnrolmentInput[] = [];
    // courseId(Moodle) → enrollment ids ที่ต้อง mark หลัง enrol สำเร็จ
    const courseToEnrollmentIds = new Map<number, number[]>();

    for (const enrollment of chunk) {
      const moodleUserId = enrollment.USER?.USER_MOODLE_ID;
      const rawCourseId = enrollment.SESSION?.EXAM?.EXAM_MOODLE_COURSE_ID;
      const moodleCourseId = rawCourseId ? Number(rawCourseId) : NaN;
      if (!moodleUserId || !moodleCourseId || Number.isNaN(moodleCourseId)) {
        continue;
      }
      enrolments.push({
        roleid: this.moodleSync.studentRoleId,
        userid: moodleUserId,
        courseid: moodleCourseId,
      });
      const ids = courseToEnrollmentIds.get(moodleCourseId) ?? [];
      ids.push(enrollment.ERM_ID);
      courseToEnrollmentIds.set(moodleCourseId, ids);
    }

    if (enrolments.length === 0) {
      return;
    }

    const first = chunk[0];
    await this.moodleSync.enrolUsers(enrolments, {
      userId: first.USER_ID,
      refType: 'enrolment',
      refId: first.ERM_ID,
      moodleRefId: 0,
    });

    // enrol สำเร็จ → เก็บ Moodle course id ไว้เป็นตัวอ้างอิง (กันถูกหยิบมา enrol ซ้ำ)
    await Promise.all(
      [...courseToEnrollmentIds.entries()].map(([moodleCourseId, ermIds]) =>
        this.enrollmentRepository.update(
          { ERM_ID: In(ermIds), ERM_MOODLE_ENROLL_ID: IsNull() },
          { ERM_MOODLE_ENROLL_ID: moodleCourseId },
        ),
      ),
    );

    this.logger.log(
      `enrol ไป Moodle สำเร็จ ${enrolments.length} รายการ (${courseToEnrollmentIds.size} คอร์ส)`,
    );
  }
}
