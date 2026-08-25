import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { doExamTimeRangesOverlap } from '../../common/utils/exam-schedule.util';
import { ExamSessionLocation } from './entities/exam-session-location.entity';
import { ExamLocation } from '../exam-locations/entities/exam-location.entity';
import { ExamSession } from '../exam-sessions/entities/exam-session.entity';
import { CreateExamSessionLocationDto } from './dto/create-exam-session-location.dto';
import { UpdateExamSessionLocationDto } from './dto/update-exam-session-location.dto';

@Injectable()
export class ExamSessionLocationsService {
  constructor(
    @InjectRepository(ExamSessionLocation)
    private readonly sessionLocationRepository: Repository<ExamSessionLocation>,
    @InjectRepository(ExamLocation)
    private readonly locationRepository: Repository<ExamLocation>,
    @InjectRepository(ExamSession)
    private readonly sessionRepository: Repository<ExamSession>,
  ) {}

  private async validateLocationAndSession(
    locationId: number,
    sessionId: number,
  ): Promise<{
    SS_START_TIME: string;
    SS_END_TIME: string;
    EXAM_DATE: string;
  }> {
    const location = await this.locationRepository.findOne({
      where: { LOCATION_ID: locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Exam Location with ID ${locationId} not found`,
      );
    }

    const session = await this.sessionRepository.findOne({
      where: { SS_ID: sessionId },
      relations: ['EXAM'],
    });
    if (!session) {
      throw new NotFoundException(
        `Exam Session with ID ${sessionId} not found`,
      );
    }

    const examDate = session.EXAM?.EXAM_DATE;
    if (!examDate || !session.SS_START_TIME || !session.SS_END_TIME) {
      throw new BadRequestException(
        'Exam session must have exam date and start/end time before assigning a location',
      );
    }

    return {
      SS_START_TIME: session.SS_START_TIME,
      SS_END_TIME: session.SS_END_TIME,
      EXAM_DATE: examDate,
    };
  }

  /** ห้ามใช้ห้องเดียวกันในช่วงเวลาที่ทับซ้อนกัน (ข้าม exam / ข้าม session) */
  private async assertLocationNotOverlapping(
    locationId: number,
    sessionId: number,
    startTime: string,
    endTime: string,
    examDate: string,
    excludeSlId?: number,
  ): Promise<void> {
    const qb = this.sessionLocationRepository
      .createQueryBuilder('sl')
      .innerJoinAndSelect('sl.SESSION', 's')
      .innerJoin('s.EXAM', 'e')
      .where('sl.LOCATION_ID = :locationId', { locationId })
      .andWhere('s.SS_ID != :sessionId', { sessionId })
      .andWhere('e.EXAM_DATE = :examDate', { examDate })
      .andWhere('sl.DELETED_AT IS NULL')
      .andWhere('s.DELETED_AT IS NULL')
      .andWhere('e.DELETED_AT IS NULL');

    if (excludeSlId !== undefined) {
      qb.andWhere('sl.SL_ID != :excludeSlId', { excludeSlId });
    }

    const conflicts = await qb.getMany();

    const hasOverlap = conflicts.some((row) =>
      doExamTimeRangesOverlap(
        startTime,
        endTime,
        row.SESSION?.SS_START_TIME,
        row.SESSION?.SS_END_TIME,
      ),
    );

    if (hasOverlap) {
      throw new ConflictException(
        'ห้องสอบนี้ถูกใช้งานในช่วงเวลาที่ทับซ้อนกันแล้ว',
      );
    }
  }

  async create(
    dto: CreateExamSessionLocationDto,
  ): Promise<ExamSessionLocation> {
    const sessionMeta = await this.validateLocationAndSession(
      dto.LOCATION_ID,
      dto.SS_ID,
    );

    await this.assertLocationNotOverlapping(
      dto.LOCATION_ID,
      dto.SS_ID,
      sessionMeta.SS_START_TIME,
      sessionMeta.SS_END_TIME,
      sessionMeta.EXAM_DATE,
    );

    const existing = await this.sessionLocationRepository.findOne({
      where: { LOCATION_ID: dto.LOCATION_ID, SS_ID: dto.SS_ID },
    });
    if (existing) {
      throw new ConflictException(
        `Session ${dto.SS_ID} is already linked to location ${dto.LOCATION_ID}`,
      );
    }

    // API-seeded links often omit layout snapshot — copy from location so seat UI works
    const location = await this.locationRepository.findOne({
      where: { LOCATION_ID: dto.LOCATION_ID },
      relations: ['SEATS'],
    });
    if (!location) {
      throw new NotFoundException(
        `Exam Location with ID ${dto.LOCATION_ID} not found`,
      );
    }

    const seatStatusLabel = (status: number): string => {
      if (status === 1) return 'BROKEN';
      if (status === 2) return 'BLOCKED';
      return 'AVAILABLE';
    };

    const seatsSnapshot =
      dto.SEATS_SNAPSHOT ??
      (location.SEATS ?? []).map((seat) => ({
        label: seat.LS_SEAT_LABEL,
        status: seatStatusLabel(Number(seat.LS_SEAT_STATUS ?? 0)),
        sortorder: seat.LS_SORT_ORDER ?? null,
      }));

    const sessionLocation = this.sessionLocationRepository.create({
      ...dto,
      TOTAL_ROWS: dto.TOTAL_ROWS ?? location.LOCATION_TOTAL_ROWS ?? null,
      TOTAL_COLS: dto.TOTAL_COLS ?? location.LOCATION_TOTAL_COLS ?? null,
      LOCATION_SEAT_DIRECTION:
        dto.LOCATION_SEAT_DIRECTION ?? location.LOCATION_SEAT_DIRECTION,
      LOCATION_SEAT_CAPACITY:
        dto.LOCATION_SEAT_CAPACITY ??
        location.LOCATION_SEAT_CAPACITY ??
        (location.SEATS?.length || null),
      SEATS_SNAPSHOT: seatsSnapshot,
    });
    return await this.sessionLocationRepository.save(sessionLocation);
  }

  async findAllByLocation(locationId: number): Promise<ExamSessionLocation[]> {
    const location = await this.locationRepository.findOne({
      where: { LOCATION_ID: locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Exam Location with ID ${locationId} not found`,
      );
    }

    return await this.sessionLocationRepository.find({
      where: { LOCATION_ID: locationId },
      relations: ['SESSION', 'SESSION.EXAM'],
      order: { CREATED_AT: 'ASC' },
    });
  }

  async findAllBySession(sessionId: number): Promise<ExamSessionLocation[]> {
    const session = await this.sessionRepository.findOne({
      where: { SS_ID: sessionId },
    });
    if (!session) {
      throw new NotFoundException(
        `Exam Session with ID ${sessionId} not found`,
      );
    }

    return await this.sessionLocationRepository.find({
      where: { SS_ID: sessionId },
      relations: ['LOCATION', 'LOCATION.SEATS'],
      order: { CREATED_AT: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ExamSessionLocation> {
    const sl = await this.sessionLocationRepository.findOne({
      where: { SL_ID: id },
      relations: ['LOCATION', 'SESSION'],
    });
    if (!sl) {
      throw new NotFoundException(`Session Location with ID ${id} not found`);
    }
    return sl;
  }

  async update(
    id: number,
    dto: UpdateExamSessionLocationDto,
  ): Promise<ExamSessionLocation> {
    const sl = await this.findOne(id);
    const locationId = dto.LOCATION_ID ?? sl.LOCATION_ID;
    const sessionId = dto.SS_ID ?? sl.SS_ID;

    const sessionMeta = await this.validateLocationAndSession(
      locationId,
      sessionId,
    );

    await this.assertLocationNotOverlapping(
      locationId,
      sessionId,
      sessionMeta.SS_START_TIME,
      sessionMeta.SS_END_TIME,
      sessionMeta.EXAM_DATE,
      id,
    );

    Object.assign(sl, dto);
    return await this.sessionLocationRepository.save(sl);
  }

  async remove(id: number): Promise<void> {
    const sl = await this.findOne(id);
    await this.sessionLocationRepository.softRemove(sl);
  }
}
