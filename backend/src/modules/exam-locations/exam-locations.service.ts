import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExamLocation,
  LocationAislePosition,
  SeatDirection,
} from './entities/exam-location.entity';
import { CreateExamLocationDto } from './dto/create-exam-location.dto';
import { CreateExamLocationWithSeatsDto } from './dto/create-exam-location-with-seats.dto';
import { UpdateExamLocationDto } from './dto/update-exam-location.dto';
import {
  ExamLocationSeat,
  LocationSeatStatus,
} from '../exam-location-seats/entities/exam-location-seat.entity';

type LocationWriteDto =
  | CreateExamLocationDto
  | CreateExamLocationWithSeatsDto
  | UpdateExamLocationDto;

interface ExamLocationResponseAliases {
  SEAT_DIRECTION: SeatDirection;
  AISLE_AFTER_COLS: number[];
  AISLE_AFTER_ROWS: number[];
}

type ExamLocationResponse = ExamLocation & ExamLocationResponseAliases;

@Injectable()
export class ExamLocationsService {
  constructor(
    @InjectRepository(ExamLocation)
    private readonly examLocationRepository: Repository<ExamLocation>,
  ) {}

  async create(dto: CreateExamLocationDto): Promise<ExamLocationResponse> {
    const location = this.examLocationRepository.create(
      this.normalizeLocationWriteDto(dto),
    );
    return this.withResponseAliases(
      await this.examLocationRepository.save(location),
    );
  }

  async createWithSeats(
    dto: CreateExamLocationWithSeatsDto,
  ): Promise<{ locationId: number; seatCount: number }> {
    const { seatStatuses, ...locationDto } = dto;

    return this.examLocationRepository.manager.transaction(async (manager) => {
      const location = await manager.save(
        manager.create(
          ExamLocation,
          this.normalizeLocationWriteDto(locationDto),
        ),
      );
      const rows = location.LOCATION_TOTAL_ROWS ?? 0;
      const cols = location.LOCATION_TOTAL_COLS ?? 0;
      const seats: Omit<
        ExamLocationSeat,
        | 'LS_ID'
        | 'CREATED_AT'
        | 'UPDATED_AT'
        | 'DELETED_AT'
        | 'LOCATION'
        | 'BLOCKED_SEATS'
      >[] = [];
      for (let row = 1; row <= rows; row += 1) {
        for (let col = 1; col <= cols; col += 1) {
          const label = this.getSeatLabel(
            row,
            col,
            location.LOCATION_SEAT_DIRECTION,
          );
          const status =
            seatStatuses?.[label] ?? seatStatuses?.[`${row}-${col}`];

          seats.push({
            LOCATION_ID: location.LOCATION_ID,
            LS_ROW_NO: row,
            LS_COL_NO: col,
            LS_SEAT_LABEL: label,
            LS_SORT_ORDER: this.getSeatSortOrder(
              row,
              col,
              rows,
              cols,
              location.LOCATION_SEAT_DIRECTION,
            ),
            LS_SEAT_STATUS: this.isSeatStatus(status)
              ? status
              : LocationSeatStatus.AVAILABLE,
          });
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

  private getSeatSortOrder(
    row: number,
    col: number,
    rows: number,
    cols: number,
    direction: SeatDirection,
  ): number {
    return direction === SeatDirection.VERTICAL
      ? (col - 1) * rows + row
      : (row - 1) * cols + col;
  }

  private isSeatStatus(value: unknown): value is LocationSeatStatus {
    return (
      value === LocationSeatStatus.AVAILABLE ||
      value === LocationSeatStatus.BROKEN ||
      value === LocationSeatStatus.BLOCKED
    );
  }

  async findAll(): Promise<ExamLocationResponse[]> {
    const locations = await this.examLocationRepository.find({
      order: { LOCATION_ID: 'ASC' },
    });
    return locations.map((location) => this.withResponseAliases(location));
  }

  async findOne(id: number): Promise<ExamLocationResponse> {
    const location = await this.examLocationRepository.findOne({
      where: { LOCATION_ID: id },
      relations: ['SEATS'],
    });

    if (!location) {
      throw new NotFoundException(`Exam Location with ID ${id} not found`);
    }

    return this.withResponseAliases(location);
  }

  async update(
    id: number,
    dto: UpdateExamLocationDto,
  ): Promise<ExamLocationResponse> {
    const location = await this.findOne(id);
    const updated = this.examLocationRepository.merge(
      location,
      this.normalizeLocationWriteDto(dto),
    );
    return this.withResponseAliases(
      await this.examLocationRepository.save(updated),
    );
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);
    await this.examLocationRepository.softRemove(location);
  }

  private normalizeLocationWriteDto(
    dto: LocationWriteDto,
  ): Partial<ExamLocation> {
    const {
      SEAT_DIRECTION,
      AISLE_AFTER_COLS,
      AISLE_AFTER_ROWS,
      LOCATION_AISLE_AFTER_COL,
      ...locationDto
    } = dto;

    const normalized: Partial<ExamLocation> = { ...locationDto };
    const direction = locationDto.LOCATION_SEAT_DIRECTION ?? SEAT_DIRECTION;
    const aislePositions = this.normalizeAislePositions(
      LOCATION_AISLE_AFTER_COL,
      AISLE_AFTER_ROWS,
      AISLE_AFTER_COLS,
    );

    if (direction) {
      normalized.LOCATION_SEAT_DIRECTION = direction;
    }

    if (aislePositions !== undefined) {
      normalized.LOCATION_AISLE_AFTER_COL = aislePositions;
    }

    return normalized;
  }

  private normalizeAislePositions(
    positions?: LocationAislePosition[] | null,
    rowIndexes?: number[],
    columnIndexes?: number[],
  ): LocationAislePosition[] | undefined {
    if (positions) {
      return this.sortAislePositions(
        positions.map((position) => ({
          type: position.type,
          index: position.index,
        })),
      );
    }

    if (!rowIndexes && !columnIndexes) {
      return undefined;
    }

    return this.sortAislePositions([
      ...(rowIndexes ?? []).map((index) => ({
        type: 'row' as const,
        index,
      })),
      ...(columnIndexes ?? []).map((index) => ({
        type: 'column' as const,
        index,
      })),
    ]);
  }

  private sortAislePositions(
    positions: LocationAislePosition[],
  ): LocationAislePosition[] {
    return positions.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'row' ? -1 : 1;
      }

      return a.index - b.index;
    });
  }

  private splitAislePositions(
    positions: ExamLocation['LOCATION_AISLE_AFTER_COL'],
  ): { rows: number[]; cols: number[] } {
    if (!positions) {
      return { rows: [], cols: [] };
    }

    const rows: number[] = [];
    const cols: number[] = [];

    positions.forEach((position) => {
      if (typeof position === 'number') {
        cols.push(position);
        return;
      }

      if (position.type === 'row') {
        rows.push(position.index);
        return;
      }

      cols.push(position.index);
    });

    return {
      rows: rows.sort((a, b) => a - b),
      cols: cols.sort((a, b) => a - b),
    };
  }

  private withResponseAliases(location: ExamLocation): ExamLocationResponse {
    const { rows, cols } = this.splitAislePositions(
      location.LOCATION_AISLE_AFTER_COL,
    );

    return Object.assign(location, {
      SEAT_DIRECTION: location.LOCATION_SEAT_DIRECTION,
      AISLE_AFTER_COLS: cols,
      AISLE_AFTER_ROWS: rows,
    });
  }
}
