import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SeatLabelFormat } from '../entities/exam-location.entity';

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
    example: SeatLabelFormat.ROW_COL,
    enum: SeatLabelFormat,
    description: 'รูปแบบ Label ที่นั่ง (ROW_COL, RUNNING_NUMBER, CUSTOM)',
    required: false,
  })
  @IsOptional()
  @IsEnum(SeatLabelFormat)
  SEAT_LABEL_FORMAT?: SeatLabelFormat;

  @ApiProperty({
    example: 0,
    description: 'สถานะการแบ่งที่นั่ง (0: NORMAL, 1: SPLIT)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  LOCATION_IS_SPLIT?: number;
}
