import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePendingPaymentDto {
  @ApiProperty({ description: 'Enrollment ID', example: 1 })
  @IsInt()
  ERM_ID: number;

  @ApiProperty({ description: 'Payment amount', example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  TRANX_AMOUNT: number;

  @ApiProperty({
    description: 'Tax ID, national ID, or passport number',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  RC_TAX_ID: string;

  @ApiProperty({ description: 'Receipt name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  RC_NAME: string;

  @ApiProperty({ description: 'Receipt phone number' })
  @IsString()
  @Matches(/^\d{10}$/)
  RC_PHONE: string;

  @ApiProperty({ description: 'Receipt address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  RC_ADDRESS: string;
}
