import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateVoidedReceiptDto {
  @ApiProperty({ description: 'รหัสใบเสร็จ' })
  @IsNotEmpty()
  @IsNumber()
  RC_ID: number;

  @ApiProperty({ description: 'รหัสผู้ยกเลิก' })
  @IsNotEmpty()
  @IsNumber()
  VR_BY: number;

  @ApiProperty({ description: 'เหตุผลการยกเลิก' })
  @IsNotEmpty()
  @IsString()
  VR_REASON: string;
}
