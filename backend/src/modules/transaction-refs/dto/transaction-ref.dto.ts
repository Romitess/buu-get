import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTransactionRefDto {
  @ApiProperty({ description: 'รหัสธุรกรรม (TRANX_ID)', example: 1 })
  @IsInt()
  @IsNotEmpty()
  TRANX_ID: number;

  @ApiPropertyOptional({
    description: 'รหัส Bank Reconcile (BR_ID)',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  BR_ID?: number;

  @ApiProperty({ description: 'เลขอ้างอิง 1', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  TSC_REF1: string;

  @ApiPropertyOptional({ description: 'เลขอ้างอิง 2', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  TSC_REF2?: string;

  @ApiPropertyOptional({ description: 'เลขอ้างอิง 3', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  TSC_REF3?: string;

  @ApiPropertyOptional({ description: 'เลขอ้างอิง 4', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  TSC_REF4?: string;

  @ApiProperty({ description: 'เลขอ้างอิงธนาคาร', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  TSC_BANK_REF: string;

  @ApiProperty({ description: 'เลขอ้างอิงพาร์ทเนอร์', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  TSC_PARTNER_REF: string;
}

export class UpdateTransactionRefDto extends PartialType(
  CreateTransactionRefDto,
) {}
