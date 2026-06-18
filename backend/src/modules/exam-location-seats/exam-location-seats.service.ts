import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExamLocationSeat,
  LocationSeatStatus,
} from './entities/exam-location-seat.entity';
import {
  ExamLocation,
  SeatDirection,
} from '../exam-locations/entities/exam-location.entity';
import { CreateExamLocationSeatDto } from './dto/create-exam-location-seat.dto';
import { UpdateExamLocationSeatDto } from './dto/update-exam-location-seat.dto';

@Injectable()
export class ExamLocationSeatsService {
  constructor(
    @InjectRepository(ExamLocationSeat)
    private readonly seatRepository: Repository<ExamLocationSeat>,
    @InjectRepository(ExamLocation)
    private readonly locationRepository: Repository<ExamLocation>,
  ) {}

  private async validateLocation(locationId: number): Promise<ExamLocation> {
    const location = await this.locationRepository.findOne({
      where: { LOCATION_ID: locationId },
    });
    if (!location) {
      throw new NotFoundException(
        `Exam Location with ID ${locationId} not found`,
      );
    }
    return location;
  }

  async create(dto: CreateExamLocationSeatDto): Promise<ExamLocationSeat> {
    await this.validateLocation(dto.LOCATION_ID);

    const existing = await this.seatRepository.findOne({
      where: {
        LOCATION_ID: dto.LOCATION_ID,
        LS_ROW_NO: dto.LS_ROW_NO,
        LS_COL_NO: dto.LS_COL_NO,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Seat at row ${dto.LS_ROW_NO}, col ${dto.LS_COL_NO} already exists in location ${dto.LOCATION_ID}`,
      );
    }

    if (dto.LS_SEAT_LABEL) {
      const labelConflict = await this.seatRepository.findOne({
        where: {
          LOCATION_ID: dto.LOCATION_ID,
          LS_SEAT_LABEL: dto.LS_SEAT_LABEL,
        },
      });
      if (labelConflict) {
        throw new ConflictException(
          `Seat label '${dto.LS_SEAT_LABEL}' already exists in location ${dto.LOCATION_ID}`,
        );
      }
    }

    const seat = this.seatRepository.create(dto);
    return await this.seatRepository.save(seat);
  }

  async findAll(locationId: number): Promise<ExamLocationSeat[]> {
    await this.validateLocation(locationId);
    return await this.seatRepository.find({
      where: { LOCATION_ID: locationId },
      order: { LS_SORT_ORDER: 'ASC', LS_ROW_NO: 'ASC', LS_COL_NO: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ExamLocationSeat> {
    const seat = await this.seatRepository.findOne({
      where: { LS_ID: id },
      relations: ['LOCATION'],
    });
    if (!seat) {
      throw new NotFoundException(`Exam Location Seat with ID ${id} not found`);
    }
    return seat;
  }

  async update(
    id: number,
    dto: UpdateExamLocationSeatDto,
  ): Promise<ExamLocationSeat> {
    const seat = await this.findOne(id);

    if (dto.LS_SEAT_LABEL && dto.LS_SEAT_LABEL !== seat.LS_SEAT_LABEL) {
      const labelConflict = await this.seatRepository.findOne({
        where: {
          LOCATION_ID: seat.LOCATION_ID,
          LS_SEAT_LABEL: dto.LS_SEAT_LABEL,
        },
      });
      if (labelConflict) {
        throw new ConflictException(
          `Seat label '${dto.LS_SEAT_LABEL}' already exists in location ${seat.LOCATION_ID}`,
        );
      }
    }

    const updated = this.seatRepository.merge(seat, dto);
    return await this.seatRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const seat = await this.findOne(id);
    await this.seatRepository.softRemove(seat);
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

  private getTargetSeatStatus(
    label: string,
    brokenSet: Set<string>,
    seatStatuses?: Record<string, LocationSeatStatus>,
  ): LocationSeatStatus {
    const mappedStatus = seatStatuses?.[label];

    if (
      mappedStatus === LocationSeatStatus.AVAILABLE ||
      mappedStatus === LocationSeatStatus.BROKEN ||
      mappedStatus === LocationSeatStatus.BLOCKED
    ) {
      return mappedStatus;
    }

    return brokenSet.has(label)
      ? LocationSeatStatus.BROKEN
      : LocationSeatStatus.AVAILABLE;
  }

  async generateSeats(
    locationId: number,
    brokenSeats: string[] = [],
    seatStatuses?: Record<string, LocationSeatStatus>,
  ): Promise<ExamLocationSeat[]> {
    const location = await this.validateLocation(locationId);

    if (!location.LOCATION_TOTAL_ROWS || !location.LOCATION_TOTAL_COLS) {
      throw new BadRequestException(
        `Location ${locationId} does not have LOCATION_TOTAL_ROWS or LOCATION_TOTAL_COLS configured`,
      );
    }

    const maxRows = location.LOCATION_TOTAL_ROWS;
    const maxCols = location.LOCATION_TOTAL_COLS;

    const existingSeats = await this.seatRepository.find({
      where: { LOCATION_ID: locationId },
      withDeleted: true,
    });

    const seatsToSoftDelete: ExamLocationSeat[] = [];
    const existingSeatsMap = new Map<string, ExamLocationSeat>();

    existingSeats.forEach((seat) => {
      if (seat.LS_ROW_NO > maxRows || seat.LS_COL_NO > maxCols) {
        if (!seat.DELETED_AT) {
          seatsToSoftDelete.push(seat);
        }
      } else {
        existingSeatsMap.set(`${seat.LS_ROW_NO}-${seat.LS_COL_NO}`, seat);
      }
    });

    if (seatsToSoftDelete.length > 0) {
      await this.seatRepository.softRemove(seatsToSoftDelete);
    }

    const brokenSet = new Set(brokenSeats);
    const seatsToInsert: {
      LOCATION_ID: number;
      LS_ROW_NO: number;
      LS_COL_NO: number;
      LS_SEAT_LABEL: string;
      LS_SORT_ORDER: number;
      LS_SEAT_STATUS: LocationSeatStatus;
    }[] = [];
    const seatsToUpdate: ExamLocationSeat[] = [];
    const seatsToRelabel = new Map<number, string>();
    let sortOrder = 1;

    for (let row = 1; row <= maxRows; row++) {
      for (let col = 1; col <= maxCols; col++) {
        const key = `${row}-${col}`;
        const label = this.getSeatLabel(row, col, location.SEAT_DIRECTION);
        const targetStatus = this.getTargetSeatStatus(
          label,
          brokenSet,
          seatStatuses,
        );

        const seat = existingSeatsMap.get(key);

        if (!seat) {
          seatsToInsert.push({
            LOCATION_ID: locationId,
            LS_ROW_NO: row,
            LS_COL_NO: col,
            LS_SEAT_LABEL: label,
            LS_SORT_ORDER: sortOrder,
            LS_SEAT_STATUS: targetStatus,
          });
        } else {
          let changed = false;

          if (seat.DELETED_AT !== null) {
            seat.DELETED_AT = null;
            changed = true;
          }
          if (seat.LS_SEAT_STATUS !== targetStatus) {
            seat.LS_SEAT_STATUS = targetStatus;
            changed = true;
          }
          if (seat.LS_SEAT_LABEL !== label) {
            seatsToRelabel.set(seat.LS_ID, label);
            seat.LS_SEAT_LABEL = label;
            changed = true;
          }
          if (seat.LS_SORT_ORDER !== sortOrder) {
            seat.LS_SORT_ORDER = sortOrder;
            changed = true;
          }

          if (changed) {
            seatsToUpdate.push(seat);
          }
        }
        sortOrder++;
      }
    }

    if (seatsToInsert.length > 0) {
      await this.seatRepository.save(this.seatRepository.create(seatsToInsert));
    }
    if (seatsToUpdate.length > 0) {
      if (seatsToRelabel.size > 0) {
        await Promise.all(
          Array.from(seatsToRelabel.keys()).map((seatId) =>
            this.seatRepository.update(seatId, {
              LS_SEAT_LABEL: `__TMP_${seatId}`,
            }),
          ),
        );
      }
      await this.seatRepository.save(seatsToUpdate);
    }

    return await this.findAll(locationId);
  }
}
