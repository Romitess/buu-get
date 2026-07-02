import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional } from 'class-validator';
import { LocationSeatStatus } from '../entities/exam-location-seat.entity';

export class GenerateExamLocationSeatsDto {
  @ApiProperty({
    example: ['A1', 'B2'],
    description: 'Backward-compatible list of broken seat labels',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  brokenSeats?: string[];

  @ApiProperty({
    example: {
      A1: LocationSeatStatus.BROKEN,
      B1: LocationSeatStatus.BLOCKED,
    },
    description:
      'Seat status map by seat label. 0=AVAILABLE, 1=BROKEN, 2=BLOCKED',
    required: false,
  })
  @IsOptional()
  @IsObject()
  seatStatuses?: Record<string, LocationSeatStatus>;
}
