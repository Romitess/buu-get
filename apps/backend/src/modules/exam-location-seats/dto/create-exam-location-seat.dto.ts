import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationSeatStatus } from '../entities/exam-location-seat.entity';

export class CreateExamLocationSeatDto {
  @ApiProperty({ example: 1, description: 'รหัสสถานที่จัดสอบ (FK)' })
  @IsInt()
  LOCATION_ID: number;

  @ApiProperty({ example: 1, description: 'แถวที่' })
  @IsInt()
  @Min(1)
  LS_ROW_NO: number;

  @ApiProperty({ example: 1, description: 'คอลัมน์ที่' })
  @IsInt()
  @Min(1)
  LS_COL_NO: number;

  @ApiProperty({
    example: 'A1',
    description: 'Label ที่นั่ง',
    required: false,
  })
  @IsOptional()
  @IsString()
  LS_SEAT_LABEL?: string;

  @ApiProperty({
    example: LocationSeatStatus.AVAILABLE,
    enum: LocationSeatStatus,
    description: 'สถานะที่นั่ง (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)',
    required: false,
  })
  @IsOptional()
  @IsEnum(LocationSeatStatus)
  LS_SEAT_STATUS?: LocationSeatStatus;

  @ApiProperty({
    example: 1,
    description: 'ลำดับการเรียง',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  LS_SORT_ORDER?: number;
}
