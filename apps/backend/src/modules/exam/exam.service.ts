import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreatePasscodesDto } from './dto/create-passcodes.dto';
import { NotifyExamChangesDto } from './dto/notify-exam-changes.dto';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';
import { PasscodeLogResponseDto } from './dto/passcode-log-response.dto';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { ExamSession } from '../exam-sessions/entities/exam-session.entity';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { getExamChangeEmailTemplate } from './templates/exam-change-email.template';
import { MoodleSyncService } from '../moodle/moodle-sync.service';
import { normalizePeriodEndDate } from '../../common/utils/period-date.util';
import { ScoreRubricsService } from '../score-rubrics/score-rubrics.service';
import { ExamScoresService } from '../exam-scores/exam-scores.service';

@Injectable()
export class ExamService {
  private readonly logger = new Logger(ExamService.name);

  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamPasscode)
    private readonly examPasscodeRepository: Repository<ExamPasscode>,
    @InjectRepository(ExamPasscodeLog)
    private readonly examPasscodeLogRepository: Repository<ExamPasscodeLog>,
    private readonly moodleSyncService: MoodleSyncService,

    @InjectRepository(ExamEnrollment)
    private readonly examEnrollmentRepository: Repository<ExamEnrollment>,
    private readonly platformGatewayService: PlatformGatewayService,
    private readonly scoreRubricsService: ScoreRubricsService,
    private readonly examScoresService: ExamScoresService,
  ) {}

  async create(
    createExamDto: CreateExamDto,
    actingUserId: number,
  ): Promise<Exam> {
    this.normalizeExamPeriodEndDates(createExamDto);
    await this.scoreRubricsService.assertRubricUsable(createExamDto.SRB_ID);
    const exam = this.examRepository.create(createExamDto);
    const saved = await this.examRepository.save(exam);
    // ไม่บล็อก HTTP response — สร้างคอร์ส Moodle แบบพื้นหลังแล้ว map EXAM_MOODLE_COURSE_ID
    // (ล้มเหลวจะ log ไว้ใน syncCourseToMoodle แต่ไม่ทำให้สร้างรอบสอบ fail)
    void this.syncCourseToMoodle(saved, actingUserId).catch((err: unknown) => {
      this.logger.error(
        `Background Moodle sync failed for exam ${saved.EXAM_ID}`,
        err instanceof Error ? err.stack : String(err),
      );
    });
    return saved;
  }

  /**
   * สร้างคอร์สใน Moodle แล้ว map EXAM_MOODLE_COURSE_ID (เรียกหลัง save — ไม่ค้าง transaction)
   * ถ้าล้มเหลวจะ log ไว้แต่ไม่ทำให้การสร้างรอบสอบล้มเหลว
   */
  private async syncCourseToMoodle(
    exam: Exam,
    actingUserId: number,
  ): Promise<void> {
    try {
      const toUnix = (d?: Date | string | null): number | undefined =>
        d ? Math.floor(new Date(d).getTime() / 1000) : undefined;
      const moodleCourseId = await this.moodleSyncService.createCourse(
        {
          fullname: exam.EXAM_NAME,
          shortname: `BUUGET-${exam.EXAM_ID}-R${exam.EXAM_ROUND}`,
          categoryid: this.moodleSyncService.courseCategoryId,
          startdate: toUnix(exam.EXAM_REG_START_DATE) ?? toUnix(exam.EXAM_DATE),
          enddate: toUnix(exam.EXAM_DATE),
        },
        { userId: actingUserId, refType: 'course', refId: exam.EXAM_ID },
      );
      exam.EXAM_MOODLE_COURSE_ID = String(moodleCourseId);
      await this.examRepository.update(
        { EXAM_ID: exam.EXAM_ID },
        { EXAM_MOODLE_COURSE_ID: String(moodleCourseId) },
      );
    } catch (error) {
      console.error(
        `[Moodle] สร้างคอร์สไม่สำเร็จสำหรับ EXAM_ID ${exam.EXAM_ID}:`,
        error,
      );
    }
  }

  /**
   * เซ็ต virtual property SESSION.LOCATION เองหลังโหลด เพราะเมื่อใช้
   * relationLoadStrategy: 'query' relation จะถูกโหลดแยกหลัง @AfterLoad ทำงานไปแล้ว
   * hook populateLocation() ของ entity จึงไม่ทันเซ็ตค่าให้ (ทำให้สถานที่ขึ้น TBA)
   */
  private populateSessionLocations(exams: Exam[]): void {
    for (const exam of exams) {
      for (const session of exam.SESSIONS ?? []) {
        session.populateLocation();
      }
    }
  }

  /**
   * นับผู้สมัครที่ยังไม่ยกเลิกแบบ aggregate แทนการโหลด ENROLLMENTS ทั้งก้อน
   * แล้วแปะ ACTIVE_ENROLLMENT_COUNT / ENROLLMENT_SL_COUNTS ให้ FE ใช้
   */
  private async attachEnrollmentCounts(exams: Exam[]): Promise<void> {
    const sessionIds = exams.flatMap(
      (exam) => exam.SESSIONS?.map((session) => session.SS_ID) ?? [],
    );
    if (sessionIds.length === 0) {
      return;
    }

    const rows = await this.examEnrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.SESSION_ID', 'SESSION_ID')
      .addSelect('enrollment.SL_ID', 'SL_ID')
      .addSelect('COUNT(*)', 'CNT')
      .where('enrollment.SESSION_ID IN (:...sessionIds)', { sessionIds })
      .andWhere('enrollment.ERM_STATUS != :cancelled', {
        cancelled: ExamEnrollmentStatus.CANCELLED,
      })
      .groupBy('enrollment.SESSION_ID')
      .addGroupBy('enrollment.SL_ID')
      .getRawMany<{ SESSION_ID: number; SL_ID: number | null; CNT: string }>();

    const activeBySession = new Map<number, number>();
    const slCountsBySession = new Map<number, Record<string, number>>();

    for (const row of rows) {
      const sessionId = Number(row.SESSION_ID);
      const count = Number(row.CNT) || 0;
      activeBySession.set(
        sessionId,
        (activeBySession.get(sessionId) ?? 0) + count,
      );

      const slKey = row.SL_ID == null ? 'null' : String(row.SL_ID);
      const slCounts = slCountsBySession.get(sessionId) ?? {};
      slCounts[slKey] = count;
      slCountsBySession.set(sessionId, slCounts);
    }

    for (const exam of exams) {
      for (const session of exam.SESSIONS ?? []) {
        const activeCount = activeBySession.get(session.SS_ID) ?? 0;
        const slCounts = slCountsBySession.get(session.SS_ID) ?? {};
        const sessionWithCounts = session as ExamSession & {
          ACTIVE_ENROLLMENT_COUNT?: number;
          ENROLLMENT_SL_COUNTS?: Record<string, number>;
        };
        sessionWithCounts.ACTIVE_ENROLLMENT_COUNT = activeCount;
        sessionWithCounts.ENROLLMENT_SL_COUNTS = slCounts;
        // ไม่โหลด ENROLLMENTS ทั้งก้อน — ส่ง array ว่างเพื่อไม่ให้ FE อ่าน undefined แล้วพัง
        session.ENROLLMENTS = [];
      }
    }
  }

  private async assertExamExists(examId: number): Promise<void> {
    const exists = await this.examRepository.exists({
      where: { EXAM_ID: examId },
    });
    if (!exists) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }
  }

  /** โหลด exam สำหรับ update/softRemove โดยไม่ดึง seats/enrollments/passcodes */
  private async findOneForMutation(id: number): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: id },
      relations: ['SESSIONS', 'FUND_SOURCE'],
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }
    return exam;
  }

  async findAll(): Promise<Exam[]> {
    const exams = await this.examRepository.find({
      // โหลด relation แบบแยก query ต่อ relation แทน JOIN เดียว เพื่อเลี่ยง
      // cartesian product ที่ทำให้ query ช้ามาก
      relationLoadStrategy: 'query',
      order: {
        CREATED_AT: 'DESC',
      },
      relations: [
        'SESSIONS',
        'SESSIONS.SESSION_LOCATIONS',
        'SESSIONS.SESSION_LOCATIONS.LOCATION',
      ],
      select: {
        EXAM_ID: true,
        EXAM_NAME: true,
        EXAM_ROUND: true,
        EXAM_TYPE: true,
        EXAM_FORMAT: true,
        EXAM_FEE: true,
        EXAM_DATE: true,
        EXAM_REG_START_DATE: true,
        EXAM_REG_END_DATE: true,
        EXAM_PAY_START_DATE: true,
        EXAM_PAY_END_DATE: true,
        EXAM_PUBLISHED: true,
        EXAM_MOODLE_COURSE_ID: true,
        CREATED_AT: true,
        UPDATED_AT: true,
        FUND_SOURCE_ID: true,
        SESSIONS: {
          SS_ID: true,
          EXAM_ID: true,
          SS_START_TIME: true,
          SS_END_TIME: true,
          SS_CAPACITY: true,
          SS_SESSION_STATUS: true,
          SESSION_LOCATIONS: {
            SL_ID: true,
            LOCATION_ID: true,
            SS_ID: true,
            SS_NAME: true,
            LOCATION: {
              LOCATION_ID: true,
              LOCATION_NAME: true,
              LOCATION_ROOM_NO: true,
              LOCATION_SEAT_CAPACITY: true,
            },
          },
        },
      },
    });

    this.populateSessionLocations(exams);
    await this.attachEnrollmentCounts(exams);
    return exams;
  }

  async findOne(
    id: number,
    options?: { includeSeats?: boolean },
  ): Promise<Exam> {
    const includeSeats = options?.includeSeats === true;
    const relations = [
      'SESSIONS',
      'SESSIONS.SESSION_LOCATIONS',
      'SESSIONS.SESSION_LOCATIONS.LOCATION',
      'FUND_SOURCE',
      'PASSCODES',
      'SCORE_RUBRIC',
      'SCORE_RUBRIC.ITEMS',
    ];
    if (includeSeats) {
      relations.push('SESSIONS.SESSION_LOCATIONS.LOCATION.SEATS');
    }

    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: id },
      // โหลด relation แบบแยก query — ไม่โหลด ENROLLMENTS ทั้งก้อน (ใช้ aggregate)
      // SEATS โหลดเฉพาะเมื่อ includeSeats (หน้าจัดที่นั่ง / สร้างรอบสอบ)
      relationLoadStrategy: 'query',
      relations,
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    this.populateSessionLocations([exam]);
    await this.attachEnrollmentCounts([exam]);
    return exam;
  }

  async findOneWithSeats(id: number): Promise<Exam> {
    return this.findOne(id, { includeSeats: true });
  }

  //การบันทึกประวัติการใช้ log
  async logPasscodeUsage(
    examId: number,
    passcodeId: number,
    fullName: string,
    passcode: string,
  ): Promise<ExamPasscodeLog> {
    const log = this.examPasscodeLogRepository.create({
      EXAM_ID: examId,
      PASSCODE_ID: passcodeId,
      FULL_NAME: fullName,
      PASSCODE: passcode,
    });
    return await this.examPasscodeLogRepository.save(log);
  }

  //การดูประวัติการใช้ log
  async getPasscodeHistory(examId: number): Promise<PasscodeLogResponseDto[]> {
    await this.assertExamExists(examId);

    const logs = await this.examPasscodeLogRepository.find({
      where: { EXAM_ID: examId },
      order: { USED_AT: 'DESC' },
    });

    return logs.map((log) => {
      const usedAt = new Date(log.USED_AT);
      return {
        logId: log.LOG_ID,
        fullName: log.FULL_NAME,
        passcode: log.PASSCODE,
        usedDate: usedAt.toISOString().split('T')[0] ?? '',
        usedTime: usedAt.toTimeString().split(' ')[0] ?? '',
      };
    });
  }

  async update(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
    this.normalizeExamPeriodEndDates(updateExamDto);
    const exam = await this.findOneForMutation(id);

    if (
      updateExamDto.SRB_ID !== undefined &&
      updateExamDto.SRB_ID !== exam.SRB_ID
    ) {
      const hasScores = await this.examScoresService.examHasSavedScores(id);
      if (hasScores) {
        throw new ConflictException(
          'ไม่สามารถเปลี่ยนชุดเกณฑ์คะแนนได้ เนื่องจากมีคะแนนที่บันทึกแล้ว',
        );
      }
      await this.scoreRubricsService.assertRubricUsable(updateExamDto.SRB_ID);
    }

    const updated = this.examRepository.merge(exam, updateExamDto);
    return await this.examRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    await this.assertExamExists(id);
    // ExamPasscode ไม่มี soft delete — ลบ hard delete ก่อน softRemove exam
    await this.examPasscodeLogRepository.delete({ EXAM_ID: id });
    await this.examPasscodeRepository.delete({ EXAM_ID: id });

    const exam = await this.findOneForMutation(id);
    await this.examRepository.softRemove(exam);
  }

  /**
   * ห้ามแก้รายชื่อ/passcode เมื่อมีผู้ลงทะเบียน (ที่ไม่ยกเลิก) ในรอบสอบแล้ว
   * เพื่อไม่ให้ลบ-สร้าง passcode ใหม่กระทบผู้ที่สมัครไปแล้ว
   */
  private async assertPasscodesEditable(examId: number): Promise<void> {
    const activeEnrollmentCount = await this.examEnrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS != :cancelled', {
        cancelled: ExamEnrollmentStatus.CANCELLED,
      })
      .getCount();

    if (activeEnrollmentCount > 0) {
      throw new ConflictException(
        'ไม่สามารถแก้ไขรายชื่อผู้มีสิทธิ์สอบได้ เนื่องจากมีผู้ลงทะเบียนในรอบสอบนี้แล้ว',
      );
    }
  }

  async createPasscodes(
    examId: number,
    createPasscodesDto: CreatePasscodesDto,
  ): Promise<ExamPasscode[]> {
    await this.assertExamExists(examId);
    await this.assertPasscodesEditable(examId);

    // Delete existing passcodes for this exam to prevent duplicates if editing
    await this.examPasscodeRepository.delete({ EXAM_ID: examId });

    const passcodes = createPasscodesDto.passcodes.map((p) => {
      const nationalId = p.nationalId?.trim() || p.passportNo?.trim();
      const fullName = p.fullName?.trim() || p.fullNameEn?.trim();

      if (!nationalId || !fullName) {
        throw new BadRequestException(
          'Passcode item must include either nationalId or passportNo, and either fullName or fullNameEn.',
        );
      }

      return this.examPasscodeRepository.create({
        EXAM_ID: examId,
        NATIONAL_ID: nationalId,
        FULL_NAME: fullName,
        PASSCODE: p.passcode,
      });
    });

    return await this.examPasscodeRepository.save(passcodes);
  }

  /** จำนวนอีเมลที่ส่งพร้อมกันต่อรอบ เพื่อไม่ให้ยิง request พร้อมกันมากเกินไป */
  private static readonly EMAIL_SEND_CONCURRENCY = 25;

  /**
   * แจ้งเตือนผู้เข้าสอบทุกคนในรอบสอบทางอีเมล เมื่อมีการแก้ไขรายละเอียดรอบสอบ
   * ตอบกลับทันทีและดำเนินการส่งอีเมลแบบเบื้องหลัง เพื่อให้ UI ลื่นไหล
   * ไม่ว่าจะมีผู้เข้าสอบมากแค่ไหน
   */
  notifyExamChanges(
    examId: number,
    dto: NotifyExamChangesDto,
  ): { success: boolean } {
    void this.dispatchExamChangeEmails(examId, dto).catch((err: unknown) => {
      this.logger.error(
        `Failed to dispatch exam change emails for exam ${examId}: ${String(
          err,
        )}`,
      );
    });
    return { success: true };
  }

  /**
   * โหลดผู้รับและส่งอีเมลแจ้งเตือนการเปลี่ยนแปลงรอบสอบแบบเบื้องหลัง
   * โดยทยอยส่งทีละชุด (batch) แบบขนาน เพื่อความเร็วและไม่ให้ระบบล้น
   */
  private async dispatchExamChangeEmails(
    examId: number,
    dto: NotifyExamChangesDto,
  ): Promise<void> {
    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: examId },
      select: { EXAM_ID: true, EXAM_NAME: true, EXAM_ROUND: true },
    });

    if (!exam) {
      this.logger.warn(
        `Skip exam change notification: exam ${examId} not found`,
      );
      return;
    }

    // โหลดผู้สมัครที่ยังลงทะเบียนอยู่ (ไม่นับที่ยกเลิก) ของทุก session ในรอบสอบนี้
    const enrollments = await this.examEnrollmentRepository.find({
      where: {
        SESSION: { EXAM_ID: examId },
        ERM_STATUS: Not(ExamEnrollmentStatus.CANCELLED),
      },
      relations: ['SESSION', 'USER', 'USER.PROFILE'],
      select: {
        ERM_ID: true,
        USER_ID: true,
        SESSION_ID: true,
        SESSION: { SS_ID: true, EXAM_ID: true },
        USER: {
          USER_ID: true,
          USER_EMAIL: true,
          PROFILE: {
            userProfileId: true,
            userTitleTh: true,
            userFullnameTh: true,
          },
        },
      },
    });

    // จัดกลุ่มตามอีเมล (ผู้รับไม่ซ้ำ) เพื่อไม่ให้ส่งซ้ำหากลงทะเบียนหลาย session
    const recipientByEmail = new Map<string, string>();
    for (const enrollment of enrollments) {
      const email = enrollment.USER?.USER_EMAIL?.trim();
      if (!email) {
        continue;
      }
      if (!recipientByEmail.has(email)) {
        const prefix = enrollment.USER?.PROFILE?.userTitleTh || '';
        const fullname = enrollment.USER?.PROFILE?.userFullnameTh || '';
        const fullName = `${prefix} ${fullname}`.trim() || 'ผู้เข้าสอบ';
        recipientByEmail.set(email, fullName);
      }
    }

    const recipients = [...recipientByEmail.entries()];
    if (recipients.length === 0) {
      return;
    }

    const examName = exam.EXAM_NAME || 'BUU-GET Exam';
    const examRound = exam.EXAM_ROUND || '';
    const subject = `[แจ้งเตือนการเปลี่ยนแปลงรอบสอบ] - ${examName}`;

    // ทยอยส่งทีละชุดแบบขนาน (allSettled เพื่อให้ผู้รับรายอื่นไม่หยุดเมื่อรายใดล้มเหลว)
    const batchSize = ExamService.EMAIL_SEND_CONCURRENCY;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(([email, fullName]) => {
          const htmlContent = getExamChangeEmailTemplate({
            fullName,
            examName,
            examRound,
            changes: dto.changes,
          });
          return this.platformGatewayService.sendEmail(
            'BUU-GET',
            email,
            subject,
            htmlContent,
          );
        }),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          sent += 1;
        } else {
          failed += 1;
          this.logger.error(
            `Failed to send exam change notification for exam ${examId}: ${String(
              result.reason,
            )}`,
          );
        }
      }
    }

    this.logger.log(
      `Exam change notifications for exam ${examId}: sent ${sent}, failed ${failed}, total ${recipients.length}`,
    );
  }

  private normalizeExamPeriodEndDates(
    dto: CreateExamDto | UpdateExamDto,
  ): void {
    if (dto.EXAM_REG_END_DATE !== undefined) {
      dto.EXAM_REG_END_DATE = normalizePeriodEndDate(dto.EXAM_REG_END_DATE);
    }
    if (dto.EXAM_PAY_END_DATE !== undefined) {
      dto.EXAM_PAY_END_DATE = normalizePeriodEndDate(dto.EXAM_PAY_END_DATE);
    }
  }
}
