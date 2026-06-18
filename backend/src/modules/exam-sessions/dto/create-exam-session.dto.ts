import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamSessionStatus } from '../entities/exam-session.entity';

export class CreateExamSessionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  EXAM_ID: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'รหัสสถานที่จัดสอบ (FK)',
  })
  @IsOptional()
  @IsNumber()
  LOCATION_ID?: number;

  @ApiProperty({ example: '09:00', required: false })
  @IsOptional()
  @IsString()
  SS_START_TIME?: string;

  @ApiProperty({ example: '12:00', required: false })
  @IsOptional()
  @IsString()
  SS_END_TIME?: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  SS_CAPACITY?: number;

  @ApiProperty({
    example: ExamSessionStatus.DRAFT,
    required: false,
    enum: ExamSessionStatus,
    enumName: 'ExamSessionStatus',
    description:
      '0:DRAFT, 1:OPEN, 2:SEAT_ALLOCATED, 3:VOUCHER_SENT, 4:COMPLETED, 5:CANCELLED',
  })
  @IsOptional()
  @IsEnum(ExamSessionStatus)
  SS_SESSION_STATUS?: ExamSessionStatus;
}
