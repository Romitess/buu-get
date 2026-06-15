import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExamAttendStatus } from '../entities/exam-attendance.entity';

export class CreateExamAttendanceDto {
  @ApiProperty({ example: 1, description: 'รหัสผู้สมัคร' })
  @IsInt()
  @IsNotEmpty()
  ERM_ID: number;

  @ApiProperty({
    example: '2024-05-01T09:00:00+07:00',
    required: false,
    description: 'เวลาที่เข้าสอบ',
  })
  @IsOptional()
  @IsDateString()
  ATTEND_CHECK_IN_TIME?: Date;

  @ApiProperty({
    example: ExamAttendStatus.INTIME,
    enum: ExamAttendStatus,
    description: 'สถานะการเข้าสอบ (0:MISSING, 1:INTIME)',
  })
  @IsEnum(ExamAttendStatus)
  @IsNotEmpty()
  ATTEND_STATUS: ExamAttendStatus;
}
