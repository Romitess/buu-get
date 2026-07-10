import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Not, In, LessThan, Brackets } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
  ExamVerifyStatus,
} from './entities/exam-enrollment.entity';
import { CreateExamEnrollmentDto } from './dto/create-exam-enrollment.dto';
import { UpdateExamEnrollmentDto } from './dto/update-exam-enrollment.dto';
import {
  BulkSeatAssignmentDto,
  SeatAssignmentItemDto,
} from './dto/bulk-seat-assignment.dto';
import { RequestFixDto } from './dto/request-fix.dto';
import { ExamEnrollmentQueryDto } from './dto/exam-enrollment-query.dto';
import { ExamLocationSeat } from '../exam-location-seats/entities/exam-location-seat.entity';
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
import { ExecutiveTestTakerQueryDto } from './dto/executive-test-taker-query.dto';
import {
  ExecutiveTestTakerPage,
  ExecutiveTestTakerRow,
} from './interfaces/executive-test-taker.interface';
import {
  ExamHistoryRow,
  ExecutiveExamHistoryResponse,
} from './interfaces/executive-exam-history.interface';

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

    const [sessionLocations, sessions] = await Promise.all([
      this.examSessionLocationRepository.find({
        where: { SL_ID: In(sessionLocationIds) },
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
    const sessionIdSet = new Set(dto.sessionIds);
    const usedSessionSeats = new Set<string>();

    if (sessions.length !== sessionIdSet.size) {
      throw new NotFoundException('One or more exam sessions were not found');
    }

    await this.assertSeatEditingAllowed(enrollmentIds, dto.sessionIds);

    for (const assignment of dto.assignments) {
      const enrollment = enrollmentById.get(assignment.ermId);
      const sessionLocation = sessionLocationById.get(assignment.slId);

      if (!enrollment || !sessionLocation) {
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

      const sessionSeatKey = `${assignment.slId}:${assignment.seatLabel}`;
      if (usedSessionSeats.has(sessionSeatKey)) {
        throw new ConflictException('Duplicate seat assignment in session');
      }
      usedSessionSeats.add(sessionSeatKey);
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.update(
        ExamEnrollment,
        { ERM_ID: In(enrollmentIds) },
        { ERM_SEAT_LABEL: null, ERM_SORT_ORDER: null, SL_ID: null },
      );

      const updatedEnrollments = dto.assignments.map(
        (assignment: SeatAssignmentItemDto) => {
          const enrollment = enrollmentById.get(assignment.ermId)!;
          const rawSortOrder: unknown = assignment.sortOrder;
          const sortOrder: number | null =
            typeof rawSortOrder === 'number' ? rawSortOrder : null;

          enrollment.ERM_SEAT_LABEL = assignment.seatLabel;
          enrollment.ERM_SORT_ORDER = sortOrder;
          enrollment.SL_ID = assignment.slId;
          if (enrollment.ERM_STATUS < ExamEnrollmentStatus.SEAT_ASSIGNED) {
            enrollment.ERM_STATUS = ExamEnrollmentStatus.SEAT_ASSIGNED;
          }
          return enrollment;
        },
      );

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

  async findAll(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<ExamEnrollment>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.examEnrollmentRepository.findAndCount({
      relations: [
        'SESSION',
        'SESSION.EXAM',
        'USER',
        'USER.PROFILE',
        'USER.IMAGE',
        'TRANSACTION',
        'TRANSACTION.RECEIPTS',
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { ERM_ID: 'DESC' },
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findExecutiveTestTakers(
    query: ExecutiveTestTakerQueryDto,
  ): Promise<ExecutiveTestTakerPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    const queryBuilder = this.examEnrollmentRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.USER', 'user')
      .leftJoin('user.PROFILE', 'profile')
      .leftJoin('enrollment.SESSION', 'session')
      .innerJoin('enrollment.ATTENDANCES', 'attendance')
      .select('MIN(enrollment.ERM_ID)', 'enrollmentId')
      .addSelect('MIN(session.EXAM_ID)', 'examId')
      .addSelect('MIN(enrollment.ERM_TEST_TAKER)', 'testTakerId')
      .addSelect('MIN(enrollment.ERM_STATUS)', 'status')
      .addSelect('profile.userTitleTh', 'title')
      .addSelect('profile.userFullnameTh', 'fullName')
      .addSelect('COUNT(DISTINCT attendance.ATTEND_ID)', 'examRoundCount');

    if (search) {
      queryBuilder.andWhere(
        new Brackets((where) => {
          where
            .where('enrollment.ERM_TEST_TAKER LIKE :search')
            .orWhere('profile.userTitleTh LIKE :search')
            .orWhere('profile.userFullnameTh LIKE :search');
        }),
        { search: `%${search}%` },
      );
    }

    const totalResult = await queryBuilder
      .clone()
      .select('COUNT(DISTINCT enrollment.USER_ID)', 'total')
      .getRawOne<{ total: string }>();
    const total = Number(totalResult?.total ?? 0);
    const rawRows = await queryBuilder
      .groupBy('enrollment.USER_ID')
      .addGroupBy('profile.userTitleTh')
      .addGroupBy('profile.userFullnameTh')
      .orderBy('testTakerId', 'ASC')
      .addOrderBy('enrollmentId', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{
        enrollmentId: string;
        examId: string;
        testTakerId: string | null;
        title: string | null;
        fullName: string | null;
        examRoundCount: string;
        status: string;
      }>();

    const data: ExecutiveTestTakerRow[] = rawRows.map((row) => ({
      enrollmentId: Number(row.enrollmentId),
      examId: Number(row.examId),
      testTakerId: row.testTakerId,
      title: row.title,
      fullName: row.fullName,
      examRoundCount: Number(row.examRoundCount),
      status: Number(row.status),
    }));

    return { data, total };
  }

  async findExamHistoryByEnrollmentId(
    enrollmentId: number,
  ): Promise<ExecutiveExamHistoryResponse> {
    const enrollment = await this.examEnrollmentRepository.findOne({
      where: { ERM_ID: enrollmentId },
      relations: ['USER', 'USER.PROFILE', 'USER.IMAGE'],
    });

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }

    const userId = enrollment.USER_ID;

    const enrollments = await this.examEnrollmentRepository.find({
      where: { USER_ID: userId },
      relations: [
        'SESSION',
        'SESSION.EXAM',
        'ATTENDANCES',
        'SCORE',
        'SCORE.CERTIFICATES',
      ],
      order: { CREATED_AT: 'DESC' },
    });

    const attendedEnrollments = enrollments.filter(
      (e) => e.ATTENDANCES && e.ATTENDANCES.length > 0,
    );

    const examHistory: ExamHistoryRow[] = attendedEnrollments.map(
      (e, index) => {
        const exam = e.SESSION?.EXAM;
        const examRound = exam?.EXAM_ROUND || '-';

        let examDate = '-';
        if (exam?.EXAM_DATE) {
          const d = new Date(exam.EXAM_DATE);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const beYear = d.getFullYear() + 543;
          examDate = `${day}/${month}/${beYear}`;
        }

        const score = e.SCORE;
        const certificates = score?.CERTIFICATES || [];
        const hasCertificate = certificates.length > 0;
        const cert = hasCertificate ? certificates[0] : null;

        return {
          index: index + 1,
          examRound,
          examDate,
          langUseScore: score?.SC_LANG_USE_SCORE
            ? Number(score.SC_LANG_USE_SCORE)
            : null,
          readingScore: score?.SC_READING_SCORE
            ? Number(score.SC_READING_SCORE)
            : null,
          totalScore: score?.SC_TOTAL_SCORE
            ? Number(score.SC_TOTAL_SCORE)
            : null,
          bandLevel: score?.SC_BAND_LEVEL ?? null,
          hasCertificate,
          certificateId: cert ? cert.CERT_ID : null,
          certIssuedAt: cert?.CERT_ISSUED_AT
            ? cert.CERT_ISSUED_AT.toISOString()
            : null,
          certExpiresAt: cert?.CERT_EXPIRES_AT
            ? cert.CERT_EXPIRES_AT.toISOString()
            : null,
          certCode: cert ? cert.CERT_CODE : null,
        };
      },
    );

    return { examHistory };
  }

  async findByExamId(
    examId: number,
    query?: ExamEnrollmentQueryDto,
  ): Promise<
    | ExamEnrollment[]
    | { data: ExamEnrollment[]; total: number; totalPaid: number }
  > {
    if (!query || !query.page || !query.limit) {
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
        ],
        select: {
          ERM_ID: true,
          USER_ID: true,
          SESSION_ID: true,
          SL_ID: true,
          ERM_SEAT_LABEL: true,
          ERM_TEST_TAKER: true,
          ERM_STATUS: true,
          ERM_VERIFY_STATUS: true,
          ERM_PHYSICAL_STATUS: true,
          CREATED_AT: true,
          USER: {
            USER_ID: true,
            USER_NATIONAL_ID: true,
            USER_PASSPORT_NO: true,
            USER_EMAIL: true,
            USER_CODE: true,
            PROFILE: {
              userProfileId: true,
              userTitleTh: true,
              userFullnameTh: true,
              userTitleEn: true,
              userFullnameEn: true,
            },
            IMAGE: {
              USER_IMAGE_ID: true,
              USER_IMAGE_URL: true,
            },
          },
          SESSION: {
            SS_ID: true,
            EXAM_ID: true,
            SS_START_TIME: true,
            SS_END_TIME: true,
            EXAM: {
              EXAM_ID: true,
              EXAM_ROUND: true,
              EXAM_NAME: true,
              EXAM_TYPE: true,
            },
          },
          SESSION_LOCATION: {
            SL_ID: true,
            LOCATION_ID: true,
            LOCATION: {
              LOCATION_ID: true,
              LOCATION_NAME: true,
              LOCATION_ROOM_NO: true,
            },
          },
          ATTENDANCES: {
            ATTEND_ID: true,
            ERM_ID: true,
            ATTEND_STATUS: true,
            ATTEND_CHECK_IN_TIME: true,
          },
          VOUCHERS: {
            VC_ID: true,
            ERM_ID: true,
            VC_CODE: true,
          },
        },
        order: { CREATED_AT: 'ASC' },
      });
    }

    const qb = this.examEnrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .leftJoinAndSelect('enrollment.USER', 'user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS != :cancelledStatus', {
        cancelledStatus: ExamEnrollmentStatus.CANCELLED,
      });

    let sessionIds: number[] = [];
    if (query.sessionId) {
      const selectedSession = await this.examSessionRepository.findOne({
        where: { SS_ID: query.sessionId },
      });
      if (selectedSession) {
        const sisterSessions = await this.examSessionRepository.find({
          where: {
            EXAM_ID: selectedSession.EXAM_ID,
            SS_START_TIME: selectedSession.SS_START_TIME,
            SS_END_TIME: selectedSession.SS_END_TIME,
          },
        });
        sessionIds = sisterSessions.map((s) => s.SS_ID);
      } else {
        sessionIds = [query.sessionId];
      }
    }

    if (sessionIds.length > 0) {
      qb.andWhere('enrollment.SESSION_ID IN (:...sessionIds)', {
        sessionIds,
      });
    }

    if (query.sessionLocationId) {
      qb.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('enrollment.SL_ID = :sessionLocationId', {
              sessionLocationId: query.sessionLocationId,
            })
            .orWhere(
              'enrollment.SL_ID IS NULL AND :sessionLocationId = (SELECT MIN(sl.SL_ID) FROM EXAM_T_SESSION_LOCATIONS sl WHERE sl.SS_ID = enrollment.SESSION_ID)',
              { sessionLocationId: query.sessionLocationId },
            );
        }),
      );
    }

    const statusMatches: number[] = [];
    const verifyMatches: number[] = [];
    const physicalMatches: number[] = [];

    if (query.search) {
      const searchLower = query.search.trim().toLowerCase();

      // Payment Status mapping
      if ('รอชำระเงิน'.includes(searchLower)) statusMatches.push(0);
      if ('ชำระเงินแล้ว'.includes(searchLower)) statusMatches.push(1);
      if ('จัดที่นั่งแล้ว'.includes(searchLower)) statusMatches.push(2);
      if ('ประกาศที่นั่งแล้ว'.includes(searchLower)) statusMatches.push(3);
      if ('เข้าสอบแล้ว'.includes(searchLower)) statusMatches.push(4);

      // Verify Status mapping
      if ('รอตรวจสอบ'.includes(searchLower)) verifyMatches.push(0);
      if ('ผ่าน'.includes(searchLower)) verifyMatches.push(1);
      if ('ให้แก้ไข'.includes(searchLower)) verifyMatches.push(2);

      // Physical Status mapping
      if (
        'พระภิกษุ'.includes(searchLower) ||
        'สามเณร'.includes(searchLower) ||
        'พระสงฆ์'.includes(searchLower)
      )
        physicalMatches.push(0);
      if ('นักบวช'.includes(searchLower)) physicalMatches.push(1);
      if ('ทุพพลภาพ'.includes(searchLower)) physicalMatches.push(2);
      if ('ตั้งครรภ์'.includes(searchLower)) physicalMatches.push(3);
      if ('พิการ'.includes(searchLower)) physicalMatches.push(4);
      if ('ทั่วไป'.includes(searchLower)) physicalMatches.push(5);

      qb.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('user.USER_NATIONAL_ID LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('user.USER_PASSPORT_NO LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('user.USER_EMAIL LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('user.USER_CODE LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userFullnameTh LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userFullnameEn LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userTitleTh LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userTitleEn LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            });

          if (statusMatches.length > 0) {
            innerQb.orWhere('enrollment.ERM_STATUS IN (:...statusMatches)', {
              statusMatches,
            });
          }
          if (verifyMatches.length > 0) {
            innerQb.orWhere(
              'enrollment.ERM_VERIFY_STATUS IN (:...verifyMatches)',
              { verifyMatches },
            );
          }
          if (physicalMatches.length > 0) {
            innerQb.orWhere(
              'enrollment.ERM_PHYSICAL_STATUS IN (:...physicalMatches)',
              { physicalMatches },
            );
          }
        }),
      );
    }

    // Clone qb logic to construct paid count query builder
    const paidQb = this.examEnrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .leftJoin('enrollment.USER', 'user')
      .leftJoin('user.PROFILE', 'profile')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS != :cancelledStatus', {
        cancelledStatus: ExamEnrollmentStatus.CANCELLED,
      })
      .andWhere('enrollment.ERM_STATUS >= :paidStatus', {
        paidStatus: ExamEnrollmentStatus.PAID,
      });

    if (sessionIds.length > 0) {
      paidQb.andWhere('enrollment.SESSION_ID IN (:...sessionIds)', {
        sessionIds,
      });
    }

    if (query.sessionLocationId) {
      paidQb.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('enrollment.SL_ID = :sessionLocationId', {
              sessionLocationId: query.sessionLocationId,
            })
            .orWhere(
              'enrollment.SL_ID IS NULL AND :sessionLocationId = (SELECT MIN(sl.SL_ID) FROM EXAM_T_SESSION_LOCATIONS sl WHERE sl.SS_ID = enrollment.SESSION_ID)',
              { sessionLocationId: query.sessionLocationId },
            );
        }),
      );
    }

    if (query.search) {
      paidQb.andWhere(
        new Brackets((innerQb) => {
          innerQb
            .where('user.USER_NATIONAL_ID LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('user.USER_PASSPORT_NO LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('user.USER_EMAIL LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('user.USER_CODE LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userFullnameTh LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userFullnameEn LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userTitleTh LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            })
            .orWhere('profile.userTitleEn LIKE :searchPattern', {
              searchPattern: `%${query.search}%`,
            });

          if (statusMatches.length > 0) {
            innerQb.orWhere('enrollment.ERM_STATUS IN (:...statusMatches)', {
              statusMatches,
            });
          }
          if (verifyMatches.length > 0) {
            innerQb.orWhere(
              'enrollment.ERM_VERIFY_STATUS IN (:...verifyMatches)',
              { verifyMatches },
            );
          }
          if (physicalMatches.length > 0) {
            innerQb.orWhere(
              'enrollment.ERM_PHYSICAL_STATUS IN (:...physicalMatches)',
              { physicalMatches },
            );
          }
        }),
      );
    }

    const skip = (query.page - 1) * query.limit;

    let sortColumn = 'enrollment.CREATED_AT';
    let sortOrder: 'ASC' | 'DESC' = 'ASC';

    if (query.sortBy) {
      const mapping: Record<string, string> = {
        titleTh: 'profile.userTitleTh',
        fullnameTh: 'profile.userFullnameTh',
        remark: 'enrollment.ERM_PHYSICAL_STATUS',
        paymentStatus: 'enrollment.ERM_STATUS',
        verifyStatus: 'enrollment.ERM_VERIFY_STATUS',
        createdAt: 'enrollment.CREATED_AT',
      };
      const sortBy = query.sortBy;
      if (Object.prototype.hasOwnProperty.call(mapping, sortBy)) {
        sortColumn = mapping[sortBy];
      }
      if (query.descending !== undefined) {
        sortOrder =
          query.descending === 'true' || query.descending === true
            ? 'DESC'
            : 'ASC';
      }
    }

    qb.orderBy(sortColumn, sortOrder).skip(skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPaid = await paidQb.getCount();

    return {
      data,
      total,
      totalPaid,
    };
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
      updateExamEnrollmentDto.ERM_SEAT_LABEL !== undefined &&
      updateExamEnrollmentDto.ERM_SEAT_LABEL !== null &&
      updateExamEnrollmentDto.SL_ID !== undefined &&
      updateExamEnrollmentDto.SL_ID !== null
    ) {
      const duplicate = await this.examEnrollmentRepository.findOne({
        where: {
          SL_ID: updateExamEnrollmentDto.SL_ID,
          ERM_SEAT_LABEL: updateExamEnrollmentDto.ERM_SEAT_LABEL,
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
    if (updateExamEnrollmentDto.ERM_SEAT_LABEL !== undefined) {
      enrollment.ERM_SEAT_LABEL = updateExamEnrollmentDto.ERM_SEAT_LABEL;
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

    if (
      saved.SL_ID &&
      saved.ERM_SEAT_LABEL &&
      currentStatus === ExamEnrollmentStatus.PAID
    ) {
      saved.ERM_STATUS = ExamEnrollmentStatus.SEAT_ASSIGNED;
      await this.examEnrollmentRepository.save(saved);
    } else if (
      !saved.SL_ID &&
      !saved.ERM_SEAT_LABEL &&
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
      updateExamEnrollmentDto.ERM_SEAT_LABEL === undefined &&
      updateExamEnrollmentDto.SL_ID === undefined
    ) {
      return;
    }

    const nextSeatLabel =
      updateExamEnrollmentDto.ERM_SEAT_LABEL !== undefined
        ? updateExamEnrollmentDto.ERM_SEAT_LABEL
        : enrollment.ERM_SEAT_LABEL;
    const nextSessionLocationId =
      updateExamEnrollmentDto.SL_ID !== undefined
        ? updateExamEnrollmentDto.SL_ID
        : enrollment.SL_ID;

    if (!nextSeatLabel && !nextSessionLocationId) return;

    if (nextSeatLabel && !nextSessionLocationId) {
      throw new BadRequestException('SL_ID is required when assigning a seat');
    }

    if (!nextSeatLabel && nextSessionLocationId) {
      throw new BadRequestException(
        'ERM_SEAT_LABEL is required when assigning a session location',
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

    await this.assertSeatEditingAllowed(
      [enrollment.ERM_ID],
      [enrollment.SESSION_ID],
    );
  }

  private async assertSeatEditingAllowed(
    enrollmentIds: number[],
    sessionIds: number[],
  ): Promise<void> {
    const uniqueEnrollmentIds = [...new Set(enrollmentIds)];
    const uniqueSessionIds = [...new Set(sessionIds)];

    const [sessions, enrollments] = await Promise.all([
      uniqueSessionIds.length > 0
        ? this.examSessionRepository.find({
            where: { SS_ID: In(uniqueSessionIds) },
            select: ['SS_ID', 'SS_SESSION_STATUS'],
          })
        : Promise.resolve([]),
      uniqueEnrollmentIds.length > 0
        ? this.examEnrollmentRepository.find({
            where: { ERM_ID: In(uniqueEnrollmentIds) },
            relations: ['VOUCHERS'],
            select: ['ERM_ID', 'ERM_STATUS'],
          })
        : Promise.resolve([]),
    ]);

    if (
      sessions.some(
        (session) =>
          Number(session.SS_SESSION_STATUS) >=
          Number(ExamSessionStatus.VOUCHER_SENT),
      )
    ) {
      throw new ConflictException(
        'ไม่สามารถแก้ไขที่นั่งได้ เนื่องจากออก Test Voucher แล้ว',
      );
    }

    if (
      enrollments.some(
        (enrollment) =>
          Number(enrollment.ERM_STATUS) >=
          Number(ExamEnrollmentStatus.SEAT_PUBLISHED),
      )
    ) {
      throw new ConflictException(
        'ไม่สามารถแก้ไขที่นั่งได้ เนื่องจากออก Test Voucher แล้ว',
      );
    }

    if (
      enrollments.some((enrollment) => (enrollment.VOUCHERS?.length ?? 0) > 0)
    ) {
      throw new ConflictException(
        'ไม่สามารถแก้ไขที่นั่งได้ เนื่องจากออก Test Voucher แล้ว',
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
