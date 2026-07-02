import { IsInt, IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeatDirection } from '../../exam-locations/entities/exam-location.entity';

export class CreateExamSessionLocationDto {
  @ApiProperty({ example: 1, description: 'รหัสสถานที่จัดสอบ (FK)' })
  @IsInt()
  LOCATION_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสรอบสอบ (FK)' })
  @IsInt()
  SS_ID: number;

  @ApiProperty({
    example: 'อ.สมชาย',
    required: false,
    description: 'ชื่อกรรมการคุมสอบประจำห้องสอบ',
  })
  @IsOptional()
  @IsString()
  SS_NAME?: string | null;

  @ApiProperty({ example: 10, required: false, description: 'จำนวนแถวทั้งหมด' })
  @IsOptional()
  @IsInt()
  TOTAL_ROWS?: number | null;

  @ApiProperty({
    example: 5,
    required: false,
    description: 'จำนวนคอลัมน์ทั้งหมด',
  })
  @IsOptional()
  @IsInt()
  TOTAL_COLS?: number | null;

  @ApiProperty({
    example: { after_cols: [4], after_rows: [3] },
    required: false,
    description: 'ข้อมูลทางเดินหลังจากคอลัมน์/แถว',
  })
  @IsOptional()
  @IsObject()
  AISLE_AFTER?: { after_cols: number[]; after_rows: number[] } | null;

  @ApiProperty({
    example: SeatDirection.HORIZONTAL,
    enum: SeatDirection,
    required: false,
    description: 'ทิศทางการจัดเรียงที่นั่ง',
  })
  @IsOptional()
  @IsEnum(SeatDirection)
  LOCATION_SEAT_DIRECTION?: SeatDirection;

  @ApiProperty({
    example: 50,
    required: false,
    description: 'ความจุที่นั่งทั้งหมด',
  })
  @IsOptional()
  @IsInt()
  LOCATION_SEAT_CAPACITY?: number | null;

  @ApiProperty({
    example: [{ label: 'A1', status: 'AVAILABLE', sortorder: 1 }],
    required: false,
    description: 'ผังที่นั่ง snapshot',
  })
  @IsOptional()
  SEATS_SNAPSHOT?: Record<string, unknown> | Record<string, unknown>[] | null;
}
