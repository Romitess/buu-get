import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkIssueVouchersDto {
  @ApiProperty({
    description: 'รหัสใบสมัครสอบที่ต้องการออกบัตรประจำตัวสอบ',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  ermIds: number[];

  @ApiProperty({ description: 'รอบสอบ' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ description: 'ลิงก์ประวัติการสอบ' })
  @IsString()
  @IsNotEmpty()
  historyUrl: string;

  @ApiPropertyOptional({
    description: 'รหัสรอบสอบที่ต้องการอัปเดตสถานะเป็น VOUCHER_SENT',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  sessionIds?: number[];
}
