import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  CheckInAssistEvent,
  CheckInAssistEventType,
} from './entities/check-in-assist-event.entity';
import {
  CheckInAssistSession,
  CheckInAssistSessionMode,
  CheckInAssistSessionStatus,
} from './entities/check-in-assist-session.entity';
import { CreateCheckInAssistSessionDto } from './dto/create-check-in-assist-session.dto';
import {
  AssistCandidateSummaryDto,
  AssistEventDto,
  AssistExpectedRoomDto,
  CheckInAssistSessionMetaDto,
  CloseAssistSessionResponseDto,
  CreateCheckInAssistSessionResponseDto,
  ListAssistEventsResponseDto,
  MyCheckInRoomDto,
  RoomStationResponseDto,
} from './dto/check-in-assist-response.dto';
import { ExamEnrollmentsService } from '../exam-enrollments/exam-enrollments.service';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { Exam } from '../exam/entities/exam.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { ExamSessionLocationProctor } from '../exam-session-locations/entities/exam-session-location-proctor.entity';
import { AuthenticatedUser, userHasAnyRole } from 'src/common/utils/authz.util';
import { ENROLLMENT_ADMIN_ROLES } from 'src/common/constants/role-groups';
import {
  isValidAssistScanCode,
  normalizeAssistScanCode,
} from './utils/normalize-assist-scan-code.util';
import { getBangkokDateOnly } from 'src/common/utils/calendar-date.util';
import { RoleEnum } from '../roles/enums/role.enum';

const SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const ROOM_STATION_GRACE_MS = 2 * 60 * 60 * 1000;
const EVENTS_BATCH_LIMIT = 50;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class CheckInAssistService {
  constructor(
    @InjectRepository(CheckInAssistSession)
    private readonly sessionRepository: Repository<CheckInAssistSession>,
    @InjectRepository(CheckInAssistEvent)
    private readonly eventRepository: Repository<CheckInAssistEvent>,
    @InjectRepository(ExamEnrollment)
    private readonly enrollmentRepository: Repository<ExamEnrollment>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamSessionLocation)
    private readonly sessionLocationRepository: Repository<ExamSessionLocation>,
    @InjectRepository(ExamSessionLocationProctor)
    private readonly proctorAssignmentRepository: Repository<ExamSessionLocationProctor>,
    private readonly examEnrollmentsService: ExamEnrollmentsService,
    private readonly dataSource: DataSource,
  ) {}

  async createSession(
    user: AuthenticatedUser,
    dto: CreateCheckInAssistSessionDto,
  ): Promise<CreateCheckInAssistSessionResponseDto> {
    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: dto.examId },
    });
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${dto.examId} not found`);
    }

    const joinToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = this.sessionRepository.create({
      EXAM_ID: dto.examId,
      HOST_USER_ID: user.userId,
      JOIN_TOKEN: joinToken,
      STATUS: CheckInAssistSessionStatus.ACTIVE,
      MODE: CheckInAssistSessionMode.HOST_ASSIST,
      SL_ID: null,
      EXPIRES_AT: expiresAt,
    });
    session.setSessionIds(dto.sessionIds);

    const saved = await this.sessionRepository.save(session);
    return {
      casId: saved.CAS_ID,
      joinToken: saved.JOIN_TOKEN,
      expiresAt: this.toExpiresAtDate(saved.EXPIRES_AT).toISOString(),
    };
  }

  async listMyRooms(
    user: AuthenticatedUser,
    dateRaw?: string,
  ): Promise<MyCheckInRoomDto[]> {
    const isAdmin = userHasAnyRole(user, ENROLLMENT_ADMIN_ROLES);
    const date =
      isAdmin && dateRaw && DATE_ONLY_PATTERN.test(dateRaw)
        ? dateRaw
        : getBangkokDateOnly();

    const qb = this.sessionLocationRepository
      .createQueryBuilder('sl')
      .innerJoinAndSelect('sl.SESSION', 'session')
      .innerJoinAndSelect('session.EXAM', 'exam')
      .leftJoinAndSelect('sl.LOCATION', 'location')
      .leftJoinAndSelect('sl.PROCTORS', 'proctors')
      .leftJoinAndSelect('proctors.USER', 'proctorUser')
      .leftJoinAndSelect('proctorUser.PROFILE', 'proctorProfile')
      .where('exam.EXAM_DATE = :date', { date })
      .andWhere('sl.DELETED_AT IS NULL')
      .andWhere('session.DELETED_AT IS NULL')
      .andWhere('exam.DELETED_AT IS NULL');

    if (!isAdmin) {
      qb.innerJoin(
        ExamSessionLocationProctor,
        'assignment',
        'assignment.SL_ID = sl.SL_ID AND assignment.USER_ID = :userId',
        { userId: user.userId },
      );
    }

    const rooms = await qb.orderBy('session.SS_START_TIME', 'ASC').getMany();
    const slIds = rooms.map((room) => room.SL_ID);
    const counts = await this.loadAttendanceCounts(slIds);
    const activeStations = await this.loadActiveStationsForUser(
      user.userId,
      slIds,
    );

    return rooms.map((room) => {
      const count = counts.get(room.SL_ID) ?? { total: 0, attended: 0 };
      return {
        slId: room.SL_ID,
        examId: room.SESSION?.EXAM_ID ?? room.SESSION?.EXAM?.EXAM_ID ?? 0,
        examName: room.SESSION?.EXAM?.EXAM_NAME ?? '',
        sessionStart: room.SESSION?.SS_START_TIME ?? null,
        sessionEnd: room.SESSION?.SS_END_TIME ?? null,
        locationName: room.LOCATION?.LOCATION_NAME ?? '',
        roomNo: room.LOCATION?.LOCATION_ROOM_NO ?? null,
        floorNo: room.LOCATION?.LOCATION_FLOOR_NO ?? null,
        proctorNames: this.collectProctorNames(room),
        totalCount: count.total,
        attendedCount: count.attended,
        activeStationCasId: activeStations.get(room.SL_ID) ?? null,
      };
    });
  }

  async openRoomStation(
    user: AuthenticatedUser,
    slId: number,
  ): Promise<RoomStationResponseDto> {
    const room = await this.loadSessionLocationForStation(slId);
    await this.assertCanOpenRoom(user, room);

    const existing = await this.sessionRepository.findOne({
      where: {
        HOST_USER_ID: user.userId,
        SL_ID: slId,
        MODE: CheckInAssistSessionMode.ROOM_STATION,
        STATUS: CheckInAssistSessionStatus.ACTIVE,
      },
      order: { CREATED_AT: 'DESC' },
    });

    if (existing) {
      try {
        this.assertSessionUsable(existing);
        return this.toRoomStationResponse(existing, room);
      } catch {
        existing.STATUS = CheckInAssistSessionStatus.CLOSED;
        await this.sessionRepository.save(existing);
      }
    }

    const examId = room.SESSION?.EXAM_ID ?? room.SESSION?.EXAM?.EXAM_ID;
    if (!examId) {
      throw new NotFoundException(
        `Exam for session location ${slId} not found`,
      );
    }

    const session = this.sessionRepository.create({
      EXAM_ID: examId,
      HOST_USER_ID: user.userId,
      JOIN_TOKEN: randomBytes(32).toString('hex'),
      STATUS: CheckInAssistSessionStatus.ACTIVE,
      MODE: CheckInAssistSessionMode.ROOM_STATION,
      SL_ID: slId,
      EXPIRES_AT: this.computeRoomStationExpiry(
        room.SESSION?.EXAM?.EXAM_DATE,
        room.SESSION?.SS_END_TIME,
      ),
    });
    session.setSessionIds([room.SS_ID]);
    const saved = await this.sessionRepository.save(session);
    return this.toRoomStationResponse(saved, room);
  }

  async getRoomStation(
    casId: number,
    user: AuthenticatedUser,
  ): Promise<RoomStationResponseDto> {
    const session = await this.findSessionById(casId);
    this.assertSessionUsable(session);
    this.assertRoomStationHost(session, user);
    if (!session.SL_ID) {
      throw new NotFoundException(`Room station ${casId} not found`);
    }
    const room = await this.loadSessionLocationForStation(session.SL_ID);
    return this.toRoomStationResponse(session, room);
  }

  async getSessionByToken(
    joinToken: string,
  ): Promise<CheckInAssistSessionMetaDto> {
    const session = await this.findSessionByToken(joinToken);
    this.assertSessionUsable(session);

    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: session.EXAM_ID },
    });

    return {
      casId: session.CAS_ID,
      examId: session.EXAM_ID,
      examName: exam?.EXAM_NAME,
      status: session.STATUS,
      expiresAt: this.toExpiresAtDate(session.EXPIRES_AT).toISOString(),
    };
  }

  async listEvents(
    casId: number,
    afterSeq: number,
  ): Promise<ListAssistEventsResponseDto> {
    const session = await this.findSessionById(casId);
    this.assertSessionUsable(session);

    const qb = this.eventRepository
      .createQueryBuilder('event')
      .where('event.CAS_ID = :casId', { casId })
      .orderBy('event.SEQ', 'ASC')
      .take(EVENTS_BATCH_LIMIT);

    if (afterSeq > 0) {
      qb.andWhere('event.SEQ > :afterSeq', { afterSeq });
    }

    const filtered = await qb.getMany();

    const latestSeq =
      filtered.length > 0 ? filtered[filtered.length - 1].SEQ : afterSeq;

    return {
      events: filtered.map((event) => this.toAssistEventDto(event)),
      latestSeq,
    };
  }

  async submitScan(
    casId: number,
    user: AuthenticatedUser,
    rawCode: string,
  ): Promise<AssistEventDto> {
    const session = await this.findSessionById(casId);
    this.assertSessionUsable(session);
    if (this.isRoomStation(session)) {
      this.assertRoomStationHost(session, user);
    }

    const normalized = normalizeAssistScanCode(rawCode);
    if (!isValidAssistScanCode(normalized)) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.INVALID_CODE,
        scannedCode: rawCode.trim().slice(0, 64),
        scannerUserId: user.userId,
        ermId: null,
      });
    }

    const enrollment = await this.resolveEnrollment(
      session.EXAM_ID,
      this.isRoomStation(session) ? [] : this.parseSessionIds(session),
      normalized,
      this.isRoomStation(session),
    );

    if (!enrollment) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.NOT_FOUND,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: null,
      });
    }

    const candidateSummary = this.buildCandidateSummary(enrollment);

    if (enrollment.ERM_STATUS === ExamEnrollmentStatus.ATTENDED) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.ALREADY_CHECKED_IN,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
        candidate: {
          ...candidateSummary,
          attendanceStatus: ExamEnrollmentStatus.ATTENDED,
        },
      });
    }

    if (
      enrollment.ERM_STATUS === ExamEnrollmentStatus.UNPAID ||
      enrollment.ERM_STATUS === ExamEnrollmentStatus.CANCELLED
    ) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.NOT_FOUND,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
      });
    }

    if (this.isRoomStation(session) && enrollment.SL_ID !== session.SL_ID) {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.WRONG_ROOM,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
        candidate: candidateSummary,
        expectedRoom: this.buildExpectedRoom(enrollment),
      });
    }

    try {
      const checkedIn =
        this.isRoomStation(session) && session.SL_ID != null
          ? await this.examEnrollmentsService.checkIn(
              enrollment.ERM_ID,
              {},
              { expectedSlId: session.SL_ID },
            )
          : await this.examEnrollmentsService.checkIn(enrollment.ERM_ID, {});
      const refreshedSummary = this.buildCandidateSummary(checkedIn);
      return this.appendEvent(session, {
        type: CheckInAssistEventType.CHECKED_IN,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: checkedIn.ERM_ID,
        candidate: {
          ...refreshedSummary,
          attendanceStatus: ExamEnrollmentStatus.ATTENDED,
        },
      });
    } catch {
      return this.appendEvent(session, {
        type: CheckInAssistEventType.NOT_FOUND,
        scannedCode: normalized,
        scannerUserId: user.userId,
        ermId: enrollment.ERM_ID,
      });
    }
  }

  async closeSession(
    casId: number,
    user: AuthenticatedUser,
  ): Promise<CloseAssistSessionResponseDto> {
    const session = await this.findSessionById(casId);
    if (session.HOST_USER_ID !== user.userId) {
      throw new BadRequestException('เฉพาะ host เท่านั้นที่ปิด session นี้ได้');
    }

    session.STATUS = CheckInAssistSessionStatus.CLOSED;
    await this.sessionRepository.save(session);
    return { status: CheckInAssistSessionStatus.CLOSED };
  }

  private isRoomStation(session: CheckInAssistSession): boolean {
    return session.MODE === CheckInAssistSessionMode.ROOM_STATION;
  }

  private assertRoomStationHost(
    session: CheckInAssistSession,
    user: AuthenticatedUser,
  ): void {
    if (!this.isRoomStation(session)) {
      throw new BadRequestException('session นี้ไม่ใช่สถานีเช็คอินประจำห้อง');
    }
    if (session.HOST_USER_ID !== user.userId) {
      throw new ForbiddenException('เฉพาะผู้เปิดนี้เท่านั้นที่ใช้งานได้');
    }
  }

  private async assertCanOpenRoom(
    user: AuthenticatedUser,
    room: ExamSessionLocation,
  ): Promise<void> {
    if (userHasAnyRole(user, ENROLLMENT_ADMIN_ROLES)) {
      return;
    }

    if (!userHasAnyRole(user, [RoleEnum.PROCTOR])) {
      throw new ForbiddenException('ไม่มีสิทธิ์เปิดเช็คอินห้องนี้');
    }

    const examDate = room.SESSION?.EXAM?.EXAM_DATE;
    if (!examDate || examDate !== getBangkokDateOnly()) {
      throw new ForbiddenException('กรรมการคุมสอบเปิดได้เฉพาะการสอบวันนี้');
    }

    const assigned = await this.proctorAssignmentRepository.findOne({
      where: { SL_ID: room.SL_ID, USER_ID: user.userId },
    });
    if (!assigned) {
      throw new ForbiddenException('คุณไม่ได้รับมอบหมายให้คุมห้องสอบนี้');
    }
  }

  private async loadSessionLocationForStation(
    slId: number,
  ): Promise<ExamSessionLocation> {
    const room = await this.sessionLocationRepository.findOne({
      where: { SL_ID: slId },
      relations: [
        'SESSION',
        'SESSION.EXAM',
        'LOCATION',
        'PROCTORS',
        'PROCTORS.USER',
        'PROCTORS.USER.PROFILE',
      ],
    });
    if (!room) {
      throw new NotFoundException(`Session Location with ID ${slId} not found`);
    }
    return room;
  }

  private async toRoomStationResponse(
    session: CheckInAssistSession,
    room: ExamSessionLocation,
  ): Promise<RoomStationResponseDto> {
    const counts = await this.loadAttendanceCounts([room.SL_ID]);
    const count = counts.get(room.SL_ID) ?? { total: 0, attended: 0 };
    return {
      casId: session.CAS_ID,
      expiresAt: this.toExpiresAtDate(session.EXPIRES_AT).toISOString(),
      slId: room.SL_ID,
      examId: room.SESSION?.EXAM_ID ?? room.SESSION?.EXAM?.EXAM_ID ?? 0,
      examName: room.SESSION?.EXAM?.EXAM_NAME ?? '',
      sessionStart: room.SESSION?.SS_START_TIME ?? null,
      sessionEnd: room.SESSION?.SS_END_TIME ?? null,
      locationName: room.LOCATION?.LOCATION_NAME ?? '',
      roomNo: room.LOCATION?.LOCATION_ROOM_NO ?? null,
      floorNo: room.LOCATION?.LOCATION_FLOOR_NO ?? null,
      proctorNames: this.collectProctorNames(room),
      totalCount: count.total,
      attendedCount: count.attended,
    };
  }

  private collectProctorNames(room: ExamSessionLocation): string[] {
    const fromAssignments = (room.PROCTORS ?? [])
      .map((assignment) => {
        const profile = assignment.USER?.PROFILE;
        const name =
          `${profile?.userTitleTh ?? ''} ${profile?.userFullnameTh ?? ''}`.trim();
        return name;
      })
      .filter((name) => name.length > 0);

    if (fromAssignments.length > 0) {
      return fromAssignments;
    }

    return (room.SS_NAME ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }

  private async loadAttendanceCounts(
    slIds: number[],
  ): Promise<Map<number, { total: number; attended: number }>> {
    const result = new Map<number, { total: number; attended: number }>();
    if (slIds.length === 0) {
      return result;
    }

    const rows = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.SL_ID', 'SL_ID')
      .addSelect(
        `SUM(CASE WHEN enrollment.ERM_STATUS NOT IN (:unpaid, :cancelled) THEN 1 ELSE 0 END)`,
        'total',
      )
      .addSelect(
        `SUM(CASE WHEN enrollment.ERM_STATUS = :attended THEN 1 ELSE 0 END)`,
        'attended',
      )
      .where('enrollment.SL_ID IN (:...slIds)', { slIds })
      .setParameters({
        unpaid: ExamEnrollmentStatus.UNPAID,
        cancelled: ExamEnrollmentStatus.CANCELLED,
        attended: ExamEnrollmentStatus.ATTENDED,
      })
      .groupBy('enrollment.SL_ID')
      .getRawMany<{ SL_ID: number; total: string; attended: string }>();

    for (const row of rows) {
      result.set(Number(row.SL_ID), {
        total: Number(row.total) || 0,
        attended: Number(row.attended) || 0,
      });
    }
    return result;
  }

  private async loadActiveStationsForUser(
    userId: number,
    slIds: number[],
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>();
    if (slIds.length === 0) {
      return result;
    }

    const stations = await this.sessionRepository.find({
      where: {
        HOST_USER_ID: userId,
        MODE: CheckInAssistSessionMode.ROOM_STATION,
        STATUS: CheckInAssistSessionStatus.ACTIVE,
        SL_ID: In(slIds),
      },
    });

    for (const station of stations) {
      if (!station.SL_ID) continue;
      try {
        this.assertSessionUsable(station);
        result.set(station.SL_ID, station.CAS_ID);
      } catch {
        // expired/closed — skip
      }
    }
    return result;
  }

  private computeRoomStationExpiry(
    examDate: string | undefined,
    ssEndTime: string | undefined,
  ): Date {
    const fourHours = new Date(Date.now() + SESSION_TTL_MS);
    if (!examDate || !ssEndTime) {
      return fourHours;
    }

    const normalizedTime =
      ssEndTime.length === 5 ? `${ssEndTime}:00` : ssEndTime;
    const endPlusGrace = new Date(`${examDate}T${normalizedTime}+07:00`);
    if (Number.isNaN(endPlusGrace.getTime())) {
      return fourHours;
    }
    endPlusGrace.setTime(endPlusGrace.getTime() + ROOM_STATION_GRACE_MS);
    return endPlusGrace.getTime() > fourHours.getTime()
      ? endPlusGrace
      : fourHours;
  }

  private async findSessionById(casId: number): Promise<CheckInAssistSession> {
    const session = await this.sessionRepository.findOne({
      where: { CAS_ID: casId },
    });
    if (!session) {
      throw new NotFoundException(`Assist session ${casId} not found`);
    }
    return session;
  }

  private async findSessionByToken(
    joinToken: string,
  ): Promise<CheckInAssistSession> {
    const session = await this.sessionRepository.findOne({
      where: { JOIN_TOKEN: joinToken },
    });
    if (!session) {
      throw new NotFoundException('Assist session not found');
    }
    return session;
  }

  private parseSessionIds(session: CheckInAssistSession): number[] {
    try {
      const parsed = JSON.parse(session.SESSION_IDS_JSON) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);
    } catch {
      return [];
    }
  }

  private toExpiresAtDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }

  private assertSessionUsable(session: CheckInAssistSession): void {
    if (session.STATUS === CheckInAssistSessionStatus.CLOSED) {
      throw new GoneException('Assist session is closed');
    }
    const expiresAt = this.toExpiresAtDate(session.EXPIRES_AT);
    if (
      Number.isNaN(expiresAt.getTime()) ||
      expiresAt.getTime() <= Date.now()
    ) {
      throw new GoneException('Assist session has expired');
    }
  }

  private async resolveEnrollment(
    examId: number,
    sessionIds: number[],
    code: string,
    entireExam: boolean,
  ): Promise<ExamEnrollment | null> {
    if (!entireExam && sessionIds.length === 0) {
      return null;
    }

    const qb = this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .innerJoinAndSelect('enrollment.SESSION', 'session')
      .leftJoinAndSelect('session.EXAM', 'exam')
      .leftJoinAndSelect('enrollment.USER', 'user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .leftJoinAndSelect('user.IMAGE', 'image')
      .leftJoinAndSelect('enrollment.VOUCHERS', 'vouchers')
      .leftJoinAndSelect('enrollment.SESSION_LOCATION', 'sessionLocation')
      .leftJoinAndSelect('sessionLocation.LOCATION', 'location')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('enrollment.ERM_STATUS != :cancelled', {
        cancelled: ExamEnrollmentStatus.CANCELLED,
      })
      .andWhere(
        new Brackets((inner) => {
          inner
            .where('user.USER_NATIONAL_ID = :code', { code })
            .orWhere('user.USER_PASSPORT_NO = :code', { code })
            .orWhere('enrollment.ERM_TEST_TAKER = :code', { code });
        }),
      );

    if (!entireExam) {
      qb.andWhere('enrollment.SESSION_ID IN (:...sessionIds)', { sessionIds });
    }

    return qb.getOne();
  }

  private formatSessionTime(
    start?: string | null,
    end?: string | null,
  ): string | null {
    const toHhMm = (value?: string | null): string | null => {
      if (!value) return null;
      return value.slice(0, 5);
    };
    const startLabel = toHhMm(start);
    const endLabel = toHhMm(end);
    if (startLabel && endLabel) {
      return `${startLabel}–${endLabel}`;
    }
    return startLabel ?? endLabel;
  }

  private buildRoomLabel(enrollment: ExamEnrollment): string | null {
    const location = enrollment.SESSION_LOCATION?.LOCATION;
    if (!location?.LOCATION_NAME) {
      return null;
    }
    return location.LOCATION_ROOM_NO
      ? `${location.LOCATION_NAME} ห้อง ${location.LOCATION_ROOM_NO}`
      : location.LOCATION_NAME;
  }

  private buildCandidateSummary(
    enrollment: ExamEnrollment,
  ): AssistCandidateSummaryDto {
    const profile = enrollment.USER?.PROFILE;
    const examRound = enrollment.SESSION?.EXAM?.EXAM_ROUND ?? null;
    const fiscalYear = enrollment.SESSION?.EXAM?.EXAM_FISCAL_YEAR ?? null;
    const testSession =
      examRound && fiscalYear
        ? `${examRound}/${fiscalYear}`
        : examRound || fiscalYear || null;

    return {
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.USER?.USER_NATIONAL_ID ?? undefined,
      passportNo: enrollment.USER?.USER_PASSPORT_NO ?? null,
      testTakerCode: enrollment.ERM_TEST_TAKER ?? null,
      titleTh: profile?.userTitleTh ?? '-',
      fullnameTh: profile?.userFullnameTh ?? '-',
      titleEn: profile?.userTitleEn ?? null,
      fullnameEn: profile?.userFullnameEn ?? null,
      seatNumber: enrollment.ERM_SEAT_LABEL ?? '-',
      profileImage: enrollment.USER?.IMAGE?.USER_IMAGE_URL ?? null,
      voucherNo: enrollment.VOUCHERS?.[0]?.VC_CODE ?? null,
      examType: enrollment.SESSION?.EXAM?.EXAM_TYPE ?? null,
      testSession,
      attendanceStatus: enrollment.ERM_STATUS,
      roomLabel: this.buildRoomLabel(enrollment),
      floorNo: enrollment.SESSION_LOCATION?.LOCATION?.LOCATION_FLOOR_NO ?? null,
      sessionTime: this.formatSessionTime(
        enrollment.SESSION?.SS_START_TIME,
        enrollment.SESSION?.SS_END_TIME,
      ),
      checkedInAt: enrollment.ERM_ATTEND_CHECK_IN_TIME
        ? new Date(enrollment.ERM_ATTEND_CHECK_IN_TIME).toISOString()
        : null,
    };
  }

  private buildExpectedRoom(
    enrollment: ExamEnrollment,
  ): AssistExpectedRoomDto | null {
    if (enrollment.SL_ID == null) {
      return null;
    }
    const location = enrollment.SESSION_LOCATION?.LOCATION;
    return {
      slId: enrollment.SL_ID,
      locationName: location?.LOCATION_NAME ?? '-',
      roomNo: location?.LOCATION_ROOM_NO ?? null,
      floorNo: location?.LOCATION_FLOOR_NO ?? null,
      seatNumber: enrollment.ERM_SEAT_LABEL ?? '-',
      sessionStart: enrollment.SESSION?.SS_START_TIME ?? null,
      sessionEnd: enrollment.SESSION?.SS_END_TIME ?? null,
    };
  }

  private async appendEvent(
    session: CheckInAssistSession,
    input: {
      type: CheckInAssistEventType;
      scannedCode: string;
      scannerUserId: number;
      ermId: number | null;
      candidate?: AssistCandidateSummaryDto | undefined;
      expectedRoom?: AssistExpectedRoomDto | null;
    },
  ): Promise<AssistEventDto> {
    return this.dataSource.transaction(async (manager) => {
      const lockedSession = await manager.findOne(CheckInAssistSession, {
        where: { CAS_ID: session.CAS_ID },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedSession) {
        throw new NotFoundException(
          `Assist session ${session.CAS_ID} not found`,
        );
      }
      this.assertSessionUsable(lockedSession);

      const maxSeqRow = await manager
        .createQueryBuilder(CheckInAssistEvent, 'event')
        .select('MAX(event.SEQ)', 'maxSeq')
        .where('event.CAS_ID = :casId', { casId: session.CAS_ID })
        .getRawOne<{ maxSeq: string | null }>();

      const nextSeq = (Number(maxSeqRow?.maxSeq ?? 0) || 0) + 1;
      const payload =
        input.candidate || input.expectedRoom !== undefined
          ? JSON.stringify({
              candidate: input.candidate,
              expectedRoom: input.expectedRoom ?? null,
            })
          : null;
      const createdAt = new Date();

      const saved = await manager.save(
        manager.create(CheckInAssistEvent, {
          CAS_ID: session.CAS_ID,
          SEQ: nextSeq,
          EVENT_TYPE: input.type,
          SCANNED_CODE: input.scannedCode,
          ERM_ID: input.ermId,
          SCANNER_USER_ID: input.scannerUserId,
          PAYLOAD_JSON: payload,
          CREATED_AT: createdAt,
        }),
      );

      return this.toAssistEventDto(saved, createdAt);
    });
  }

  private toAssistEventDto(
    event: CheckInAssistEvent,
    fallbackCreatedAt?: Date,
  ): AssistEventDto {
    let candidate: AssistCandidateSummaryDto | undefined;
    let expectedRoom: AssistExpectedRoomDto | null | undefined;
    if (event.PAYLOAD_JSON) {
      try {
        const parsed = JSON.parse(event.PAYLOAD_JSON) as Record<
          string,
          unknown
        >;
        if (parsed && typeof parsed === 'object' && 'ermId' in parsed) {
          candidate = parsed as unknown as AssistCandidateSummaryDto;
        } else {
          candidate = parsed.candidate as AssistCandidateSummaryDto | undefined;
          expectedRoom =
            (parsed.expectedRoom as AssistExpectedRoomDto | null | undefined) ??
            undefined;
        }
      } catch {
        candidate = undefined;
      }
    }

    const createdAt =
      event.CREATED_AT instanceof Date
        ? event.CREATED_AT
        : event.CREATED_AT
          ? new Date(event.CREATED_AT)
          : (fallbackCreatedAt ?? new Date());

    return {
      seq: event.SEQ,
      type: event.EVENT_TYPE,
      scannedCode: event.SCANNED_CODE,
      scannerUserId: event.SCANNER_USER_ID,
      at: createdAt.toISOString(),
      ...(candidate ? { candidate } : {}),
      ...(expectedRoom !== undefined ? { expectedRoom } : {}),
    };
  }
}
