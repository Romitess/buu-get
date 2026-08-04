import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInExamEnrollmentDto {
  @ApiProperty({
    example: '2024-05-01T09:00:00+07:00',
    required: false,
    description: 'เวลาที่เข้าสอบ — ถ้าไม่ส่งใช้เวลาปัจจุบัน',
  })
  @IsOptional()
  @IsDateString()
  ERM_ATTEND_CHECK_IN_TIME?: string;
}
