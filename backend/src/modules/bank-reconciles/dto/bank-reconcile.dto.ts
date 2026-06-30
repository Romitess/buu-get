import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBankReconcileDto {
  @ApiPropertyOptional({ description: 'รหัสธุรกรรม', example: 1 })
  @IsInt()
  @IsOptional()
  TRANX_ID?: number;

  @ApiProperty({ description: 'รหัสผู้สร้าง', example: 1 })
  @IsInt()
  @IsNotEmpty()
  CREATED_BY: number;

  @ApiProperty({ description: 'Ref 1', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  BR_REF1: string;

  @ApiPropertyOptional({ description: 'Ref 2', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  BR_REF2?: string;

  @ApiPropertyOptional({ description: 'Ref 3', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  BR_REF3?: string;

  @ApiPropertyOptional({ description: 'Ref 4', maxLength: 20 })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  BR_REF4?: string;

  @ApiProperty({ description: 'จำนวนเงิน', example: 1500.0 })
  @IsNumber()
  @IsNotEmpty()
  BR_AMOUNT: number;

  @ApiProperty({ description: 'จ่ายโดย', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  BR_PAID_BY: string;
}

export class UpdateBankReconcileDto extends PartialType(
  CreateBankReconcileDto,
) {}

export class UpdateBankReconcileRefsDto {
  @ApiProperty({ description: 'Ref 1', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  BR_REF1: string;

  @ApiPropertyOptional({
    description: 'Ref 2',
    maxLength: 20,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  BR_REF2?: string | null;
}

export class VerifyBankReconcilesDto {
  @ApiPropertyOptional({
    description: 'รายการ BR_ID ที่ต้องการตรวจ หากไม่ส่งจะตรวจทั้งหมด',
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @IsOptional()
  brIds?: number[];
}
