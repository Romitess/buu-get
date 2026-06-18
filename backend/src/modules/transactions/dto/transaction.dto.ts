import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TransactionChannel,
  TransactionMatchStatus,
  TransactionPaymentMethod,
  TransactionPaymentStatus,
} from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Enrollment ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  ERM_ID: number;

  @ApiProperty({ description: 'Payment config ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  PC_ID: number;

  @ApiPropertyOptional({ description: 'Generated QR payment reference' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  TRANX_QR_CODE?: string;

  @ApiProperty({ description: 'Payment amount', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  TRANX_AMOUNT: number;

  @ApiPropertyOptional({ enum: TransactionPaymentMethod })
  @IsEnum(TransactionPaymentMethod)
  @IsOptional()
  TRANX_PAYMENT_METHOD?: TransactionPaymentMethod;

  @ApiPropertyOptional({ enum: TransactionPaymentStatus })
  @IsEnum(TransactionPaymentStatus)
  @IsOptional()
  TRANX_PAYMENT_STATUS?: TransactionPaymentStatus;

  @ApiProperty({ description: 'Bank code', example: 'KTB' })
  @IsString()
  @MaxLength(3)
  TRANX_BANK_CODE: string;

  @ApiProperty({ enum: TransactionChannel })
  @IsEnum(TransactionChannel)
  TRANX_CHANNEL: TransactionChannel;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  TRANX_EXPIRES_AT?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  TRANX_BANK_DATETIME?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  TRANX_EFFECTIVE_DATE?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  TRANX_PAID_AT?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  TRANX_REJECTED_AT?: Date;

  @ApiPropertyOptional({ enum: TransactionMatchStatus })
  @IsEnum(TransactionMatchStatus)
  @IsOptional()
  TRANX_MATCH_STATUS?: TransactionMatchStatus;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
