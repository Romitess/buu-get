import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamLocation } from './entities/exam-location.entity';
import { CreateExamLocationDto } from './dto/create-exam-location.dto';
import { CreateExamLocationWithSeatsDto } from './dto/create-exam-location-with-seats.dto';
import { UpdateExamLocationDto } from './dto/update-exam-location.dto';
import {
  ExamLocationSeat,
  LocationSeatStatus,
} from '../exam-location-seats/entities/exam-location-seat.entity';
import { SeatDirection } from './entities/exam-location.entity';

@Injectable()
export class ExamLocationsService {
  constructor(
    @InjectRepository(ExamLocation)
    private readonly examLocationRepository: Repository<ExamLocation>,
  ) {}

  async create(dto: CreateExamLocationDto): Promise<ExamLocation> {
    const location = this.examLocationRepository.create(dto);
    return await this.examLocationRepository.save(location);
  }

  async createWithSeats(
    dto: CreateExamLocationWithSeatsDto,
  ): Promise<{ locationId: number; seatCount: number }> {
    const { seatStatuses, ...locationDto } = dto;

    return this.examLocationRepository.manager.transaction(async (manager) => {
      const location = await manager.save(
        manager.create(ExamLocation, locationDto),
      );
      const rows = location.LOCATION_TOTAL_ROWS ?? 0;
      const cols = location.LOCATION_TOTAL_COLS ?? 0;
      const seats: Omit<
        ExamLocationSeat,
        'LS_ID' | 'CREATED_AT' | 'UPDATED_AT' | 'DELETED_AT' | 'LOCATION'
      >[] = [];
      let sortOrder = 1;

      for (let row = 1; row <= rows; row += 1) {
        for (let col = 1; col <= cols; col += 1) {
          const label = this.getSeatLabel(row, col, location.SEAT_DIRECTION);
          const status =
            seatStatuses?.[label] ?? seatStatuses?.[`${row}-${col}`];

          seats.push({
            LOCATION_ID: location.LOCATION_ID,
            LS_ROW_NO: row,
            LS_COL_NO: col,
            LS_SEAT_LABEL: label,
            LS_SORT_ORDER: sortOrder,
            LS_SEAT_STATUS: this.isSeatStatus(status)
              ? status
              : LocationSeatStatus.AVAILABLE,
          });
          sortOrder += 1;
        }
      }

      if (seats.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(ExamLocationSeat)
          .values(seats)
          .execute();
      }

      return { locationId: location.LOCATION_ID, seatCount: seats.length };
    });
  }

  private getSeatLabel(
    row: number,
    col: number,
    direction: SeatDirection,
  ): string {
    const rowLabel = String.fromCharCode(64 + row);
    const colLabel = String.fromCharCode(64 + col);

    return direction === SeatDirection.VERTICAL
      ? `${colLabel}${row}`
      : `${rowLabel}${col}`;
  }

  private isSeatStatus(value: unknown): value is LocationSeatStatus {
    return (
      value === LocationSeatStatus.AVAILABLE ||
      value === LocationSeatStatus.BROKEN ||
      value === LocationSeatStatus.BLOCKED
    );
  }

  async findAll(): Promise<ExamLocation[]> {
    return await this.examLocationRepository.find({
      order: { LOCATION_ID: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ExamLocation> {
    const location = await this.examLocationRepository.findOne({
      where: { LOCATION_ID: id },
      relations: ['SEATS', 'SESSION_LOCATIONS'],
    });

    if (!location) {
      throw new NotFoundException(`Exam Location with ID ${id} not found`);
    }

    return location;
  }

  async update(id: number, dto: UpdateExamLocationDto): Promise<ExamLocation> {
    const location = await this.findOne(id);
    const updated = this.examLocationRepository.merge(location, dto);
    return await this.examLocationRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await this.examLocationRepository.softRemove(location);
  }
}
