import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';

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

  private getTargetSeatStatus(
    label: string,
    row: number,
    col: number,
    brokenSet: Set<string>,
    seatStatuses?: Record<string, LocationSeatStatus>,
    currentStatus?: LocationSeatStatus,
  ): LocationSeatStatus {
    const mappedStatus =
      seatStatuses?.[label] ?? seatStatuses?.[`${row}-${col}`];

    if (
      mappedStatus === LocationSeatStatus.AVAILABLE ||
      mappedStatus === LocationSeatStatus.BROKEN ||
      mappedStatus === LocationSeatStatus.BLOCKED
    ) {
      return mappedStatus;
    }

    return brokenSet.has(label)
      ? LocationSeatStatus.BROKEN
      : (currentStatus ?? LocationSeatStatus.AVAILABLE);
  }

  private async validateSeatsCanBeRemoved(
    manager: EntityManager,
    seatsToRemove: ExamLocationSeat[],
  ): Promise<void> {
    if (seatsToRemove.length === 0) {
      return;
    }

    const seatIds = seatsToRemove.map((seat) => seat.LS_ID);
    const assignedSeats = await manager
      .getRepository(ExamEnrollment)
      .createQueryBuilder('enrollment')
      .select('enrollment.LS_ID', 'LS_ID')
      .where('enrollment.LS_ID IN (:...seatIds)', { seatIds })
      .andWhere('enrollment.ERM_STATUS != :cancelledStatus', {
        cancelledStatus: ExamEnrollmentStatus.CANCELLED,
      })
      .andWhere('enrollment.DELETED_AT IS NULL')
      .getRawMany<{ LS_ID: number }>();

    if (assignedSeats.length === 0) {
      return;
    }

    const assignedSeatIds = new Set(
      assignedSeats.map((seat) => Number(seat.LS_ID)),
    );
    const assignedSeatLabels = seatsToRemove
      .filter((seat) => assignedSeatIds.has(seat.LS_ID))
      .map((seat) => seat.LS_SEAT_LABEL ?? `LS_ID ${seat.LS_ID}`);

    throw new BadRequestException(
      `Cannot remove assigned seats: ${assignedSeatLabels.join(', ')}`,
    );
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

    return await this.seatRepository.manager.transaction(
      async (manager): Promise<ExamLocationSeat[]> => {
        const seatRepository = manager.getRepository(ExamLocationSeat);

        const existingSeats = await seatRepository.find({
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

        await this.validateSeatsCanBeRemoved(manager, seatsToSoftDelete);

        if (existingSeats.length > 0) {
          await Promise.all(
            existingSeats.map((seat) =>
              seatRepository.update(seat.LS_ID, {
                LS_SEAT_LABEL: `__TMP_${seat.LS_ID}`,
              }),
            ),
          );
          existingSeats.forEach((seat) => {
            seat.LS_SEAT_LABEL = `__TMP_${seat.LS_ID}`;
          });
        }

        if (seatsToSoftDelete.length > 0) {
          await seatRepository.softRemove(seatsToSoftDelete);
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

        for (let row = 1; row <= maxRows; row++) {
          for (let col = 1; col <= maxCols; col++) {
            const key = `${row}-${col}`;
            const label = this.getSeatLabel(
              row,
              col,
              location.LOCATION_SEAT_DIRECTION,
            );
            const seat = existingSeatsMap.get(key);
            const targetStatus = this.getTargetSeatStatus(
              label,
              row,
              col,
              brokenSet,
              seatStatuses,
              seat?.LS_SEAT_STATUS,
            );

            if (!seat) {
              seatsToInsert.push({
                LOCATION_ID: locationId,
                LS_ROW_NO: row,
                LS_COL_NO: col,
                LS_SEAT_LABEL: label,
                LS_SORT_ORDER: this.getSeatSortOrder(
                  row,
                  col,
                  maxRows,
                  maxCols,
                  location.LOCATION_SEAT_DIRECTION,
                ),
                LS_SEAT_STATUS: targetStatus,
              });
            } else {
              seat.DELETED_AT = null;
              seat.LS_SEAT_STATUS = targetStatus;
              seat.LS_SEAT_LABEL = label;
              seat.LS_SORT_ORDER = this.getSeatSortOrder(
                row,
                col,
                maxRows,
                maxCols,
                location.LOCATION_SEAT_DIRECTION,
              );
              seatsToUpdate.push(seat);
            }
          }
        }

        if (seatsToUpdate.length > 0) {
          await seatRepository.save(seatsToUpdate);
        }
        if (seatsToInsert.length > 0) {
          await seatRepository.save(seatRepository.create(seatsToInsert));
        }

        return await seatRepository.find({
          where: { LOCATION_ID: locationId },
          order: { LS_SORT_ORDER: 'ASC', LS_ROW_NO: 'ASC', LS_COL_NO: 'ASC' },
        });
      },
    );
  }
}
