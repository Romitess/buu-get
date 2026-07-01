import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamBlockedSeat } from './entities/exam-blocked-seat.entity';
import { CreateExamBlockedSeatDto } from './dto/create-exam-blocked-seat.dto';
import { UpdateExamBlockedSeatDto } from './dto/update-exam-blocked-seat.dto';
import { ReplaceExamBlockedSeatItemDto } from './dto/replace-exam-blocked-seats.dto';

@Injectable()
export class ExamBlockedSeatsService {
  constructor(
    @InjectRepository(ExamBlockedSeat)
    private readonly blockedSeatRepository: Repository<ExamBlockedSeat>,
  ) {}

  async create(dto: CreateExamBlockedSeatDto): Promise<ExamBlockedSeat> {
    const blockedSeat = this.blockedSeatRepository.create(dto);
    return this.blockedSeatRepository.save(blockedSeat);
  }

  async findAll(sessionId?: number): Promise<ExamBlockedSeat[]> {
    if (sessionId) {
      return this.blockedSeatRepository.find({
        where: { SS_ID: sessionId },
        relations: ['LOCATION_SEAT', 'SESSION'],
      });
    }
    return this.blockedSeatRepository.find({
      relations: ['LOCATION_SEAT', 'SESSION'],
    });
  }

  async replaceForSession(
    sessionId: number,
    seats: ReplaceExamBlockedSeatItemDto[],
  ): Promise<ExamBlockedSeat[]> {
    return this.blockedSeatRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(ExamBlockedSeat);
      const existingSeats = await repository.find({
        where: { SS_ID: sessionId },
      });

      if (existingSeats.length > 0) {
        await repository.softRemove(existingSeats);
      }

      if (seats.length === 0) {
        return [];
      }

      const nextSeats = repository.create(
        seats.map((seat) => ({
          SS_ID: sessionId,
          LS_ID: seat.LS_ID,
          BLOCK_STATUS: seat.BLOCK_STATUS,
        })),
      );

      return repository.save(nextSeats);
    });
  }

  async findOne(id: number): Promise<ExamBlockedSeat> {
    const blockedSeat = await this.blockedSeatRepository.findOne({
      where: { BLOCK_ID: id },
      relations: ['LOCATION_SEAT', 'SESSION'],
    });
    if (!blockedSeat) {
      throw new NotFoundException(`Blocked seat with ID ${id} not found`);
    }
    return blockedSeat;
  }

  async update(
    id: number,
    dto: UpdateExamBlockedSeatDto,
  ): Promise<ExamBlockedSeat> {
    const blockedSeat = await this.findOne(id);
    Object.assign(blockedSeat, dto);
    return this.blockedSeatRepository.save(blockedSeat);
  }

  async remove(id: number): Promise<void> {
    const blockedSeat = await this.findOne(id);
    await this.blockedSeatRepository.softRemove(blockedSeat);
  }
}
