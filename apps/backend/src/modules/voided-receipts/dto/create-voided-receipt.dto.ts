import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVoidedReceiptDto {
  @ApiProperty({ description: 'รหัสใบเสร็จ' })
  @IsNotEmpty()
  @IsNumber()
  RC_ID: number;

  @ApiProperty({ description: 'เหตุผลการยกเลิก' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  VR_REASON: string;
}
