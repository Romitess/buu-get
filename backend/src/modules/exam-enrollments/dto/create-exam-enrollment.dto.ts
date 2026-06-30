import {
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  ExamEnrollmentStatus,
  ExamVerifyStatus,
} from '../entities/exam-enrollment.entity';

export class CreateExamEnrollmentDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  USER_ID: number;

  @ApiProperty({
    example: 1,
    description: 'รหัส Session-Location (FK)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  SL_ID?: number;

  @ApiProperty({
    example: '123456',
    description: 'รหัสเข้าสอบ (สำหรับรอบพิเศษ)',
    required: false,
  })
  @IsOptional()
  PASSCODE?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  SESSION_ID: number;

  @ApiProperty({
    example: 'A-01',
    description: 'เลขที่นั่งสอบ/รหัสที่นั่งสอบ',
    required: false,
  })
  @IsOptional()
  @IsString()
  ERM_SEAT_LABEL?: string | null;

  @ApiProperty({
    example: 1,
    description: 'ลำดับการเรียงที่นั่ง',
    required: false,
  })
  @IsOptional()
  @IsInt()
  ERM_SORT_ORDER?: number | null;

  @ApiProperty({
    example: ExamEnrollmentStatus.UNPAID,
    required: false,
    enum: ExamEnrollmentStatus,
    description:
      '0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:SEAT_PUBLISHED, 4:ATTENDED, 5:CANCELLED',
  })
  @IsOptional()
  @IsEnum(ExamEnrollmentStatus)
  ERM_STATUS?: ExamEnrollmentStatus;

  @ApiProperty({ example: '2024-05-01T09:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  ERM_AT?: string;

  @ApiProperty({
    example: ExamVerifyStatus.UNCHECKED,
    required: false,
    enum: ExamVerifyStatus,
    description: '0:UNCHECKED, 1:PASS, 2:WAIT_FIXED, 3:CANCELLED',
  })
  @IsOptional()
  @IsEnum(ExamVerifyStatus)
  ERM_VERIFY_STATUS?: ExamVerifyStatus;

  @ApiProperty({ example: 'พระภิกษุ / สามเณร', required: false })
  @IsOptional()
  @IsString()
  PHYSICAL_STATUS?: string;
}
