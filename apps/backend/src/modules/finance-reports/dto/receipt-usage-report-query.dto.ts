import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class ReceiptUsageReportQueryDto {
  @ApiPropertyOptional({ description: 'ปีงบประมาณของข้อสอบ' })
  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @ApiPropertyOptional({ description: 'วันที่ใบเสร็จเริ่มต้น (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'วันที่ใบเสร็จสิ้นสุด (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'รหัสแหล่งเงิน' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fundSourceId?: number;

  @ApiPropertyOptional({ description: 'ชื่อการสอบ' })
  @IsOptional()
  @IsString()
  examName?: string;

  @ApiPropertyOptional({ description: 'ชื่อผู้ชำระเงิน' })
  @IsOptional()
  @IsString()
  payerName?: string;

  @ApiPropertyOptional({ description: 'ชื่อผู้รับเงิน' })
  @IsOptional()
  @IsString()
  collectorName?: string;

  @ApiPropertyOptional({ description: 'เลขที่ใบเสร็จ' })
  @IsOptional()
  @IsString()
  receiptNo?: string;

  @ApiPropertyOptional({
    description: 'สถานะใบเสร็จ',
    enum: ['all', 'issued', 'voided'],
  })
  @IsOptional()
  @IsIn(['all', 'issued', 'voided'])
  status?: 'all' | 'issued' | 'voided';
}
