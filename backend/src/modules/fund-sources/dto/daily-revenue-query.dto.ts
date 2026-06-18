import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DailyRevenueQueryDto {
  @ApiPropertyOptional({ description: 'วันที่เริ่มต้น (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ถึงวันที่ (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ส่วนงาน' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'ชื่อการสอบ' })
  @IsString()
  @IsOptional()
  examName?: string;

  @ApiPropertyOptional({ description: 'เลขที่ใบเสร็จ' })
  @IsString()
  @IsOptional()
  receiptNo?: string;

  @ApiPropertyOptional({ description: 'ชื่อผู้ชำระเงิน' })
  @IsString()
  @IsOptional()
  payerName?: string;

  @ApiPropertyOptional({ description: 'ชื่อผู้รับเงิน' })
  @IsString()
  @IsOptional()
  payeeName?: string;
}
