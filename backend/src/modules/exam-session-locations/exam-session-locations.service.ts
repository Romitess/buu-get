import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {
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
    });
    if (!session) {
      throw new NotFoundException(
        `Exam Session with ID ${sessionId} not found`,
      );
    }
  }

  async create(
    dto: CreateExamSessionLocationDto,
  ): Promise<ExamSessionLocation> {
    await this.validateLocationAndSession(dto.LOCATION_ID, dto.SS_ID);

    const existing = await this.sessionLocationRepository.findOne({
      where: { LOCATION_ID: dto.LOCATION_ID, SS_ID: dto.SS_ID },
    });
    if (existing) {
      throw new ConflictException(
        `Session ${dto.SS_ID} is already linked to location ${dto.LOCATION_ID}`,
      );
    }

    const sessionLocation = this.sessionLocationRepository.create(dto);
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
    Object.assign(sl, dto);
    return await this.sessionLocationRepository.save(sl);
  }

  async remove(id: number): Promise<void> {
    const sl = await this.findOne(id);
    await this.sessionLocationRepository.softRemove(sl);
  }
}
