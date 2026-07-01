import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class CreateTransactionProfileDto {
  @ApiProperty({ description: 'รหัสธุรกรรม' })
  @IsNotEmpty()
  @IsNumber()
  TRANX_ID: number;

  @ApiProperty({ description: 'ชื่อผู้เสียภาษี/ชื่อในใบเสร็จ' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  TP_NAME: string;

  @ApiProperty({ description: 'ที่อยู่ออกใบเสร็จ' })
  @IsNotEmpty()
  @IsString()
  TP_ADDRESS: string;

  @ApiProperty({ description: 'เลขประจำตัวผู้เสียภาษี' })
  @IsNotEmpty()
  @IsNumber()
  TP_TAX_ID: number;

  @ApiProperty({ description: 'เบอร์โทรศัพท์' })
  @IsNotEmpty()
  @IsString()
  @Length(1, 15)
  TP_PHONE: string;
}
