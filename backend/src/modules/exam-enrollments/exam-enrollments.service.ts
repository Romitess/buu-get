import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Not, In, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
  ExamVerifyStatus,
} from './entities/exam-enrollment.entity';
import { CreateExamEnrollmentDto } from './dto/create-exam-enrollment.dto';
import { UpdateExamEnrollmentDto } from './dto/update-exam-enrollment.dto';
import { BulkSeatAssignmentDto } from './dto/bulk-seat-assignment.dto';
import { RequestFixDto } from './dto/request-fix.dto';
import {
  ExamLocationSeat,
  LocationSeatStatus,
} from '../exam-location-seats/entities/exam-location-seat.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';

import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';
import { ExamPasscode } from '../exam/entities/exam-passcode.entity';
import { User } from '../users/entities/user.entity';
import { UserPhysicalStatus } from '../user-profile/entities/user-profile.entity';
import { EXAM_TYPE } from '../exam/constants/exam.constants';
import { getProfileFixEmailTemplate } from './templates/profile-fix-email.template';
import { ExamPasscodeLog } from '../exam/entities/exam-passcode-log.entity';
import { TestTakerIdService } from './test-taker-id.service';

@Injectable()
export class ExamEnrollmentsService {
  constructor(
    @InjectRepository(ExamEnrollment)
    private readonly examEnrollmentRepository: Repository<ExamEnrollment>,
    @InjectRepository(ExamSession)
    private readonly examSessionRepository: Repository<ExamSession>,
    @InjectRepository(ExamSessionLocation)
    private readonly examSessionLocationRepository: Repository<ExamSessionLocation>,
    @InjectRepository(ExamLocationSeat)
    private readonly examLocationSeatRepository: Repository<ExamLocationSeat>,
    @InjectRepository(ExamPasscode)
    private readonly examPasscodeRepository: Repository<ExamPasscode>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly platformGatewayService: PlatformGatewayService,
    @InjectRepository(ExamPasscodeLog)
    private readonly examPasscodeLogRepository: Repository<ExamPasscodeLog>,
    private readonly dataSource: DataSource,
    private readonly testTakerIdService: TestTakerIdService,
  ) {}

  async bulkAssignSeats(dto: BulkSeatAssignmentDto): Promise<ExamEnrollment[]> {
    const enrollmentIds = dto.assignments.map((item) => item.ermId);
    const seatIds = dto.assignments.map((item) => item.lsId);
    const sessionLocationIds = dto.assignments.map((item) => item.slId);
    const uniqueEnrollmentIds = new Set(enrollmentIds);

    if (uniqueEnrollmentIds.size !== enrollmentIds.length) {
      throw new BadRequestException('Duplicate enrollment in seat assignments');
    }

    const enrollments = await this.examEnrollmentRepository.find({
      where: { ERM_ID: In(enrollmentIds) },
    });
    if (enrollments.length !== enrollmentIds.length) {
      throw new NotFoundException(
        'One or more exam enrollments were not found',
      );
    }

    const [sessionLocations, seats, sessions] = await Promise.all([
      this.examSessionLocationRepository.find({
        where: { SL_ID: In(sessionLocationIds) },
      }),
      this.examLocationSeatRepository.find({
        where: { LS_ID: In(seatIds) },
      }),
      this.examSessionRepository.find({
        where: { SS_ID: In(dto.sessionIds) },
      }),
    ]);

    const enrollmentById = new Map(
      enrollments.map((enrollment) => [enrollment.ERM_ID, enrollment]),
    );
    const sessionLocationById = new Map(
      sessionLocations.map((location) => [location.SL_ID, location]),
    );
    const seatById = new Map(seats.map((seat) => [seat.LS_ID, seat]));
    const sessionIdSet = new Set(dto.sessionIds);
    const usedSessionSeats = new Set<string>();

    if (sessions.length !== sessionIdSet.size) {
      throw new NotFoundException('One or more exam sessions were not found');
    }

    for (const assignment of dto.assignments) {
      const enrollment = enrollmentById.get(assignment.ermId);
      const sessionLocation = sessionLocationById.get(assignment.slId);
      const seat = seatById.get(assignment.lsId);

      if (!enrollment || !sessionLocation || !seat) {
        throw new BadRequestException('Invalid seat assignment data');
      }
      if (!sessionIdSet.has(enrollment.SESSION_ID)) {
        throw new BadRequestException(
          'Enrollment session is not included in this request',
        );
      }
      if (sessionLocation.SS_ID !== enrollment.SESSION_ID) {
        throw new BadRequestException(
          'Session location does not belong to the enrollment session',
        );
      }
      if (seat.LOCATION_ID !== sessionLocation.LOCATION_ID) {
        throw new BadRequestException(
          'Seat does not belong to the selected session location',
        );
      }
      if (seat.LS_SEAT_STATUS !== LocationSeatStatus.AVAILABLE) {
        throw new BadRequestException('Seat is unavailable');
      }

      const sessionSeatKey = `${enrollment.SESSION_ID}:${assignment.lsId}`;
      if (usedSessionSeats.has(sessionSeatKey)) {
        throw new ConflictException('Duplicate seat assignment in session');
      }
      usedSessionSeats.add(sessionSeatKey);
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.update(
        ExamEnrollment,
        { ERM_ID: In(enrollmentIds) },
        { LS_ID: null, SL_ID: null },
      );

      const updatedEnrollments = dto.assignments.map((assignment) => {
        const enrollment = enrollmentById.get(assignment.ermId)!;
        enrollment.LS_ID = assignment.lsId;
        enrollment.SL_ID = assignment.slId;
        if (enrollment.ERM_STATUS < ExamEnrollmentStatus.SEAT_ASSIGNED) {
          enrollment.ERM_STATUS = ExamEnrollmentStatus.SEAT_ASSIGNED;
        }
        return enrollment;
      });

      await manager.save(ExamEnrollment, updatedEnrollments);
      await this.testTakerIdService.assign(manager, enrollmentIds);
      await manager.update(
        ExamSession,
        { SS_ID: In(dto.sessionIds) },
        { SS_SESSION_STATUS: ExamSessionStatus.SEAT_ALLOCATED },
      );
      return await manager.find(ExamEnrollment, {
        where: { ERM_ID: In(enrollmentIds) },
      });
    });
  }

  async create(
    createExamEnrollmentDto: CreateExamEnrollmentDto,
  ): Promise<ExamEnrollment> {
    const { USER_ID, SESSION_ID, PASSCODE, PHYSICAL_STATUS } =
      createExamEnrollmentDto;

    const session = await this.examSessionRepository.findOne({
      where: { SS_ID: SESSION_ID },
      relations: ['ENROLLMENTS', 'EXAM'],
    });

    if (!session) {
      throw new NotFoundException(
        `Exam Session with ID ${SESSION_ID} not found`,
      );
    }

    const user = await this.userRepository.findOne({
      where: { USER_ID },
      relations: ['PROFILE'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${USER_ID} not found`);
    }

    const sisterSessions = await this.examSessionRepository.find({
      where: {
        EXAM_ID: session.EXAM_ID,
        SS_START_TIME: session.SS_START_TIME,
        SS_END_TIME: session.SS_END_TIME,
      },
      relations: ['ENROLLMENTS', 'EXAM'],
    });

    let targetSession = session;
    let activeEnrollments = (session.ENROLLMENTS || []).filter(
      (e) => e.ERM_STATUS !== ExamEnrollmentStatus.CANCELLED,
    );

    if (
      session.SS_CAPACITY > 0 &&
      activeEnrollments.length >= session.SS_CAPACITY
    ) {
      let foundAvailable = false;
      for (const sister of sisterSessions) {
        if (sister.SS_ID === session.SS_ID) {
          continue;
        }
        const sisterActive = (sister.ENROLLMENTS || []).filter(
          (e) => e.ERM_STATUS !== ExamEnrollmentStatus.CANCELLED,
        );
        if (
          sister.SS_CAPACITY > 0 &&
          sisterActive.length < sister.SS_CAPACITY
        ) {
          targetSession = sister;
          activeEnrollments = sisterActive;
          foundAvailable = true;
          break;
        }
      }
      if (!foundAvailable) {
        throw new BadRequestException('FULL');
      }
    }

    let validPasscode: ExamPasscode | null = null as ExamPasscode | null;

    if (targetSession.EXAM?.EXAM_TYPE === EXAM_TYPE.SPECIAL) {
      if (!PASSCODE) {
        throw new BadRequestException(
          'Passcode is required for special exam rounds',
        );
      }

      validPasscode = await this.examPasscodeRepository.findOne({
        where: {
          EXAM_ID: targetSession.EXAM_ID,
          NATIONAL_ID: user.USER_NATIONAL_ID || '',
          PASSCODE: PASSCODE,
        },
      });

      if (!validPasscode) {
        throw new BadRequestException(
          'Invalid passcode for this user and exam',
        );
      }
    }

    const existingEnrollment = await this.examEnrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .where('enrollment.USER_ID = :userId', { userId: USER_ID })
      .andWhere('session.EXAM_ID = :examId', { examId: targetSession.EXAM_ID })
      .andWhere('session.SS_START_TIME = :startTime', {
        startTime: targetSession.SS_START_TIME,
      })
      .andWhere('session.SS_END_TIME = :endTime', {
        endTime: targetSession.SS_END_TIME,
      })
      .andWhere('enrollment.ERM_STATUS IN (:...activeStatuses)', {
        activeStatuses: [
          ExamEnrollmentStatus.UNPAID,
          ExamEnrollmentStatus.PAID,
          ExamEnrollmentStatus.SEAT_ASSIGNED,
          ExamEnrollmentStatus.SEAT_PUBLISHED,
        ],
      })
      .getOne();

    if (existingEnrollment) {
      throw new ConflictException(`คุณได้ลงทะเบียนในรอบเวลานี้ไปแล้ว`);
    }

    createExamEnrollmentDto.SESSION_ID = targetSession.SS_ID;
    const enrollment = this.examEnrollmentRepository.create(
      createExamEnrollmentDto,
    );
    let statusToSave = PHYSICAL_STATUS || 'ทั่วไป';
    if (statusToSave === 'ไม่มีข้อมูลข้างต้น') {
      statusToSave = 'ทั่วไป';
    }
    enrollment.ERM_PHYSICAL_STATUS = statusToSave as UserPhysicalStatus;
    if (targetSession.EXAM?.EXAM_TYPE === EXAM_TYPE.SPECIAL) {
      enrollment.ERM_STATUS = ExamEnrollmentStatus.PAID;
      enrollment.ERM_VERIFY_STATUS = ExamVerifyStatus.UNCHECKED;
    }
    const saved = await this.examEnrollmentRepository.save(enrollment);

    if (targetSession.EXAM?.EXAM_TYPE === EXAM_TYPE.SPECIAL && validPasscode) {
      const prefix = user.PROFILE?.userTitleTh || '';
      const fullname = user.PROFILE?.userFullnameTh || '';
      const fullName = `${prefix} ${fullname}`.trim() || user.USER_NATIONAL_ID;

      const log = this.examPasscodeLogRepository.create({
        EXAM_ID: targetSession.EXAM_ID,
        PASSCODE_ID: validPasscode.PASSCODE_ID,
        FULL_NAME: fullName ?? '',
        PASSCODE: validPasscode.PASSCODE,
      });
      await this.examPasscodeLogRepository.save(log);
    }

    return await this.findOne(saved.ERM_ID);
  }

  async findAll(): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentRepository.find({
      relations: [
        'SESSION',
        'SESSION.EXAM',
        'USER',
        'USER.PROFILE',
        'USER.IMAGE',
        'LOCATION_SEAT',
        'TRANSACTION',
        'TRANSACTION.RECEIPTS',
      ],
    });
  }

  async findByExamId(examId: number): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentRepository.find({
      where: {
        SESSION: { EXAM_ID: examId },
      },
      relations: [
        'USER',
        'USER.PROFILE',
        'USER.IMAGE',
        'SESSION',
        'SESSION.EXAM',
        'SESSION.SESSION_LOCATIONS',
        'SESSION.SESSION_LOCATIONS.LOCATION',
        'SESSION_LOCATION',
        'SESSION_LOCATION.LOCATION',
        'ATTENDANCES',
        'VOUCHERS',
        'LOCATION_SEAT',
      ],
      order: { CREATED_AT: 'ASC' },
    });
  }

  async findByUserId(userId: number): Promise<ExamEnrollment[]> {
    return await this.examEnrollmentRepository.find({
      where: { USER_ID: userId },
      relations: [
        'USER',
        'USER.PROFILE',
        'USER.IMAGE',
        'SESSION',
        'SESSION.EXAM',
        'SESSION.SESSION_LOCATIONS',
        'SESSION.SESSION_LOCATIONS.LOCATION',
        'SESSION_LOCATION',
        'SESSION_LOCATION.LOCATION',
        'TRANSACTION',
        'TRANSACTION.BANK_RECONCILES',
        'TRANSACTION.RECEIPTS',
        'VOUCHERS',
        'SCORE',
        'SCORE.CERTIFICATES',
        'LOCATION_SEAT',
      ],
      order: { CREATED_AT: 'DESC' },
    });
  }

  async findMatchedEnrollments(refs: string[]): Promise<ExamEnrollment[]> {
    if (!refs || refs.length === 0) return [];

    const numericRefs = refs
      .map((r) => parseInt(r, 10))
      .filter((n) => !isNaN(n));

    const ermIdCondition = numericRefs.length > 0 ? numericRefs : [-1];

    return await this.examEnrollmentRepository.find({
      where: [
        { ERM_ID: In(ermIdCondition) },
        { USER: { USER_NATIONAL_ID: In(refs) } },
      ],
      relations: [
        'USER',
        'USER.PROFILE',
        'USER.IMAGE',
        'SESSION',
        'SESSION.EXAM',
        'SESSION.SESSION_LOCATIONS',
        'SESSION.SESSION_LOCATIONS.LOCATION',
        'LOCATION_SEAT',
      ],
    });
  }

  async findOne(id: number): Promise<ExamEnrollment> {
    const enrollment = await this.examEnrollmentRepository.findOne({
      where: { ERM_ID: id },
      relations: [
        'SESSION',
        'SESSION.EXAM',
        'SESSION.SESSION_LOCATIONS',
        'SESSION.SESSION_LOCATIONS.LOCATION',
        'SESSION_LOCATION',
        'SESSION_LOCATION.LOCATION',
        'USER',
        'USER.PROFILE',
        'USER.IMAGE',
        'VOUCHERS',
        'LOCATION_SEAT',
      ],
    });

    if (!enrollment) {
      throw new NotFoundException(`Exam Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  async update(
    id: number,
    updateExamEnrollmentDto: UpdateExamEnrollmentDto,
  ): Promise<ExamEnrollment> {
    const enrollment = await this.findOne(id);
    await this.validateSeatAssignment(enrollment, updateExamEnrollmentDto);

    if (
      updateExamEnrollmentDto.LS_ID !== undefined &&
      updateExamEnrollmentDto.LS_ID !== null
    ) {
      const duplicate = await this.examEnrollmentRepository.findOne({
        where: {
          SESSION_ID: enrollment.SESSION_ID,
          LS_ID: updateExamEnrollmentDto.LS_ID,
          ERM_ID: Not(id),
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `ที่นั่งนี้ถูกใช้งานไปแล้วโดยผู้สมัครท่านอื่น`,
        );
      }
    }

    // Sync relations with scalar columns to prevent TypeORM's loaded FK relations from overriding DTO updates
    if (updateExamEnrollmentDto.LS_ID !== undefined) {
      enrollment.LS_ID = updateExamEnrollmentDto.LS_ID;
      enrollment.LOCATION_SEAT = updateExamEnrollmentDto.LS_ID
        ? ({ LS_ID: updateExamEnrollmentDto.LS_ID } as ExamLocationSeat)
        : (null as unknown as ExamLocationSeat);
    }

    if (updateExamEnrollmentDto.SL_ID !== undefined) {
      enrollment.SL_ID = updateExamEnrollmentDto.SL_ID;
      enrollment.SESSION_LOCATION = updateExamEnrollmentDto.SL_ID
        ? ({ SL_ID: updateExamEnrollmentDto.SL_ID } as ExamSessionLocation)
        : (null as unknown as ExamSessionLocation);
    }

    const updated = this.examEnrollmentRepository.merge(
      enrollment,
      updateExamEnrollmentDto,
    );

    const saved = await this.examEnrollmentRepository.save(updated);
    const currentStatus: ExamEnrollmentStatus = Number(saved.ERM_STATUS);

    if (saved.LS_ID && currentStatus === ExamEnrollmentStatus.PAID) {
      saved.ERM_STATUS = ExamEnrollmentStatus.SEAT_ASSIGNED;
      await this.examEnrollmentRepository.save(saved);
    } else if (
      !saved.LS_ID &&
      currentStatus === ExamEnrollmentStatus.SEAT_ASSIGNED
    ) {
      saved.ERM_STATUS = ExamEnrollmentStatus.PAID;
      await this.examEnrollmentRepository.save(saved);
    }

    return await this.findOne(saved.ERM_ID);
  }

  private async validateSeatAssignment(
    enrollment: ExamEnrollment,
    updateExamEnrollmentDto: UpdateExamEnrollmentDto,
  ): Promise<void> {
    if (
      updateExamEnrollmentDto.LS_ID === undefined &&
      updateExamEnrollmentDto.SL_ID === undefined
    ) {
      return;
    }

    const nextSeatId =
      updateExamEnrollmentDto.LS_ID !== undefined
        ? updateExamEnrollmentDto.LS_ID
        : enrollment.LS_ID;
    const nextSessionLocationId =
      updateExamEnrollmentDto.SL_ID !== undefined
        ? updateExamEnrollmentDto.SL_ID
        : enrollment.SL_ID;

    if (!nextSeatId && !nextSessionLocationId) return;

    if (nextSeatId && !nextSessionLocationId) {
      throw new BadRequestException('SL_ID is required when assigning a seat');
    }

    if (!nextSeatId && nextSessionLocationId) {
      throw new BadRequestException(
        'LS_ID is required when assigning a session location',
      );
    }

    const sessionLocation = await this.examSessionLocationRepository.findOne({
      where: { SL_ID: Number(nextSessionLocationId) },
    });

    if (!sessionLocation) {
      throw new BadRequestException('Invalid session location');
    }

    if (sessionLocation.SS_ID !== enrollment.SESSION_ID) {
      throw new BadRequestException(
        'Session location does not belong to this enrollment session',
      );
    }

    const seat = await this.examLocationSeatRepository.findOne({
      where: { LS_ID: Number(nextSeatId) },
    });

    if (!seat) {
      throw new BadRequestException('Invalid seat');
    }

    if (seat.LOCATION_ID !== sessionLocation.LOCATION_ID) {
      throw new BadRequestException(
        'Seat does not belong to the selected session location',
      );
    }
  }

  async remove(id: number): Promise<void> {
    const enrollment = await this.findOne(id);
    await this.examEnrollmentRepository.softRemove(enrollment);
  }

  async allocateSeats(sessionId: number): Promise<ExamEnrollment[]> {
    const enrollments = await this.examEnrollmentRepository.find({
      where: {
        SESSION_ID: sessionId,
        ERM_STATUS: ExamEnrollmentStatus.PAID,
      },
      order: {
        CREATED_AT: 'ASC',
      },
    });

    if (enrollments.length === 0) {
      throw new NotFoundException(
        `No paid enrollments found for session ${sessionId}`,
      );
    }

    const updatedEnrollments = enrollments.map((enrollment) => {
      enrollment.ERM_STATUS = ExamEnrollmentStatus.SEAT_ASSIGNED;
      return enrollment;
    });

    const savedEnrollments =
      await this.examEnrollmentRepository.save(updatedEnrollments);

    return savedEnrollments;
  }

  async requestFix(
    id: number,
    dto: RequestFixDto,
  ): Promise<{ success: boolean }> {
    const enrollment = await this.findOne(id);
    if (!enrollment) {
      throw new NotFoundException(`Exam Enrollment with ID ${id} not found`);
    }

    enrollment.ERM_VERIFY_STATUS = ExamVerifyStatus.WAIT_FIXED;
    await this.examEnrollmentRepository.save(enrollment);

    if (enrollment.USER?.PROFILE) {
      const remarkText = [dto.reasons?.join(', '), dto.notes]
        .filter(Boolean)
        .join(' - ');
      enrollment.USER.PROFILE.userRemark =
        remarkText || 'กรุณาแก้ไขข้อมูลส่วนตัว';
      await this.examEnrollmentRepository.manager.save(enrollment.USER.PROFILE);
    }

    const prefix = enrollment.USER?.PROFILE?.userTitleTh || '';
    const fullname = enrollment.USER?.PROFILE?.userFullnameTh || '';
    const fullName = `${prefix} ${fullname}`.trim() || 'ผู้สมัครสอบ';
    const email = enrollment.USER?.USER_EMAIL;
    const examName = enrollment.SESSION?.EXAM?.EXAM_NAME || 'BUU-GET Exam';
    const regId = `EX-2025-${String(enrollment.ERM_ID).padStart(5, '0')}`;

    if (!email) {
      console.warn(
        `[MailService] No email found for user ID ${enrollment.USER_ID}. Email will not be sent.`,
      );
      return { success: true };
    }

    const htmlContent = getProfileFixEmailTemplate({
      fullName,
      examName,
      regId,
      reasons: dto.reasons,
      notes: dto.notes,
      fixDeadline: dto.fixDeadline,
      profileUrl: dto.profileUrl,
    });

    const subject = `[แจ้งเตือนแก้ไขข้อมูลการสมัครสอบ] - ${examName}`;

    this.platformGatewayService
      .sendEmail('BUU-GET', email, subject, htmlContent)
      .then(() => {
        console.log(
          '[MailService] Profile Fix Email sent successfully via BUU Gateway!',
        );
      })
      .catch((err: unknown) => {
        console.error(
          '[MailService] Error sending Profile Fix email via BUU Gateway:',
          err,
        );
      });

    return { success: true };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCronCancelExpiredEnrollments() {
    // 30 minutes in milliseconds
    const expirationTime = new Date(Date.now() - 30 * 60 * 1000);

    // Optimize: Single SQL UPDATE query instead of SELECT then UPDATE
    const result = await this.examEnrollmentRepository.update(
      {
        ERM_STATUS: ExamEnrollmentStatus.UNPAID,
        CREATED_AT: LessThan(expirationTime),
      },
      { ERM_STATUS: ExamEnrollmentStatus.CANCELLED },
    );

    if (result.affected && result.affected > 0) {
      console.log(
        `[Cron] Automatically cancelled ${result.affected} expired unpaid enrollments.`,
      );
    }
  }
}
