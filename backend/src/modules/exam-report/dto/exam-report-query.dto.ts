import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * พารามิเตอร์กรองรายงานการสอบ (ช่วง จาก - ถึง)
 * ปีอ้างอิงจาก Exam.EXAM_DATE
 */
export class ExamReportQueryDto {
  @ApiPropertyOptional({ description: 'ปีเริ่มต้น (ค.ศ. เช่น 2025)' })
  @IsString()
  @IsOptional()
  fromYear?: string;

  @ApiPropertyOptional({ description: 'เดือนเริ่มต้น (01-12)' })
  @IsString()
  @IsOptional()
  fromMonth?: string;

  @ApiPropertyOptional({ description: 'รอบสอบเริ่มต้น' })
  @IsString()
  @IsOptional()
  fromRound?: string;

  @ApiPropertyOptional({ description: 'ปีสิ้นสุด (ค.ศ. เช่น 2026)' })
  @IsString()
  @IsOptional()
  toYear?: string;

  @ApiPropertyOptional({ description: 'เดือนสิ้นสุด (01-12)' })
  @IsString()
  @IsOptional()
  toMonth?: string;

  @ApiPropertyOptional({ description: 'รอบสอบสิ้นสุด' })
  @IsString()
  @IsOptional()
  toRound?: string;
}
