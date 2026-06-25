import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SeatDirection } from '../entities/exam-location.entity';

export class LocationAislePositionDto {
  @ApiProperty({ example: 'row', enum: ['row', 'column'] })
  @IsIn(['row', 'column'])
  type: 'row' | 'column';

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  index: number;
}

export class CreateExamLocationDto {
  @ApiProperty({ example: 'อาคารเรียนรวม', description: 'ชื่อสถานที่จัดสอบ' })
  @IsString()
  LOCATION_NAME: string;

  @ApiProperty({
    example: 'QS2-101',
    description: 'เลขที่ห้องสอบ',
    required: false,
  })
  @IsOptional()
  @IsString()
  LOCATION_ROOM_NO?: string;

  @ApiProperty({ example: 2, description: 'ชั้น', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  LOCATION_FLOOR_NO?: number;

  @ApiProperty({ example: 10, description: 'จำนวนแถวทั้งหมด', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  LOCATION_TOTAL_ROWS?: number;

  @ApiProperty({
    example: 5,
    description: 'จำนวนคอลัมน์ทั้งหมด',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  LOCATION_TOTAL_COLS?: number;

  @ApiProperty({
    example: 50,
    description: 'ความจุที่นั่งทั้งหมด',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  LOCATION_SEAT_CAPACITY?: number;

  @ApiProperty({
    example: SeatDirection.HORIZONTAL,
    description: 'ทิศทางการจัดเรียงที่นั่ง',
    enum: SeatDirection,
    required: false,
  })
  @IsOptional()
  @IsEnum(SeatDirection)
  LOCATION_SEAT_DIRECTION?: SeatDirection;

  @ApiProperty({
    example: SeatDirection.HORIZONTAL,
    description: 'Backward-compatible seat numbering direction',
    enum: SeatDirection,
    required: false,
  })
  @IsOptional()
  @IsEnum(SeatDirection)
  SEAT_DIRECTION?: SeatDirection;

  @ApiProperty({
    example: [
      { type: 'row', index: 3 },
      { type: 'column', index: 5 },
    ],
    description: 'Aisle positions after row or column indexes',
    required: false,
    type: [LocationAislePositionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationAislePositionDto)
  LOCATION_AISLE_AFTER_COL?: LocationAislePositionDto[];

  @ApiProperty({
    example: [5, 8],
    description:
      'Backward-compatible column indexes that have an aisle after them',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  AISLE_AFTER_COLS?: number[];

  @ApiProperty({
    example: [3],
    description:
      'Backward-compatible row indexes that have an aisle after them',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  AISLE_AFTER_ROWS?: number[];
}
