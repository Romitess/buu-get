import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class DailyRevenueReportQueryDto {
  @ApiProperty({ description: 'วันที่ใบเสร็จเริ่มต้น (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'วันที่ใบเสร็จสิ้นสุด (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'ชื่อการสอบ' })
  @IsOptional()
  @IsString()
  examName?: string;

  @ApiPropertyOptional({ description: 'รหัสแหล่งเงิน' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fundSourceId?: number;
}
