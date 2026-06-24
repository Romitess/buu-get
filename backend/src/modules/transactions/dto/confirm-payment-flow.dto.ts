import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmPaymentFlowDto {
  @ApiProperty({ description: 'User Code (TSC_REF1)', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  userCode: string;

  @ApiPropertyOptional({
    description:
      'วันที่+รหัสการสอบ (TSC_REF2) เช่น 20240101-001, 20240101-002 เป็นต้น',
    maxLength: 20,
    deprecated: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  ermTestTaker?: string;

  @ApiProperty({ description: 'Receipt Tax ID', required: false })
  @IsString()
  @IsOptional()
  receiptTaxId?: string;

  @ApiProperty({ description: 'Receipt Name', required: false })
  @IsString()
  @IsOptional()
  receiptName?: string;

  @ApiProperty({ description: 'Receipt Phone', required: false })
  @IsString()
  @IsOptional()
  receiptPhone?: string;

  @ApiProperty({ description: 'Receipt Address', required: false })
  @IsString()
  @IsOptional()
  receiptAddress?: string;
}
