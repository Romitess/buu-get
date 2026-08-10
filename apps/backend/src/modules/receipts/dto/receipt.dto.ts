import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ReceiptStatus } from '../entities/receipt.entity';

export class CreateReceiptDto {
  @ApiProperty({ description: 'รหัสธุรกรรม', example: 1 })
  @IsInt()
  @IsNotEmpty()
  TRANX_ID: number;

  @ApiProperty({ description: 'รหัสลายเซ็น', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  RC_SIGNATURE_ID: string;

  @ApiPropertyOptional({ enum: ReceiptStatus, default: ReceiptStatus.UNISSUED })
  @IsEnum(ReceiptStatus)
  @IsOptional()
  RC_STATUS?: ReceiptStatus;

  @ApiPropertyOptional({ description: 'วันที่ออกใบเสร็จ' })
  @IsDateString()
  @IsOptional()
  RC_ISSUED_AT?: Date;

  @ApiPropertyOptional({ description: 'เลขที่ใบเสร็จรับเงิน' })
  @IsString()
  @IsOptional()
  RC_NO?: string;
}

export class UpdateReceiptDto extends PartialType(CreateReceiptDto) {}
