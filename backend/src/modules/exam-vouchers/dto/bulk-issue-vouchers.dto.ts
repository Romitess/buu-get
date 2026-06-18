import { IsNotEmpty, IsString, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
