import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { LocationSeatStatus } from '../../exam-location-seats/entities/exam-location-seat.entity';
import { CreateExamLocationDto } from './create-exam-location.dto';

export class CreateExamLocationWithSeatsDto extends CreateExamLocationDto {
  @ApiProperty({
    example: {
      A1: LocationSeatStatus.BROKEN,
      B1: LocationSeatStatus.BLOCKED,
    },
    description:
      'Seat status map by seat label or row-column key. 0=AVAILABLE, 1=BROKEN, 2=BLOCKED',
    required: false,
  })
  @IsOptional()
  @IsObject()
  seatStatuses?: Record<string, LocationSeatStatus>;
}
