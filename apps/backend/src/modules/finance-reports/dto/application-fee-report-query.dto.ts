import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class ApplicationFeeReportQueryDto {
  @ApiPropertyOptional({ description: 'วันที่ใบเสร็จ (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @ApiPropertyOptional({ description: 'วันที่ชำระเงิน (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  paidDate?: string;

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
