import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TransactionApiType } from '../entities/transaction-status-history.entity';

export class CreateTransactionStatusHistoryDto {
  @ApiProperty({ description: 'รหัสธุรกรรม' })
  @IsInt()
  @IsNotEmpty()
  TRANX_ID: number;

  @ApiPropertyOptional({ description: 'สถานะก่อนเปลี่ยน' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  TSH_FROM?: string;

  @ApiProperty({ description: 'สถานะหลังเปลี่ยน' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  TSH_TO: string;

  @ApiProperty({
    description: 'ประเภท API',
    enum: TransactionApiType,
  })
  @IsEnum(TransactionApiType)
  @IsNotEmpty()
  TSH_API_TYPE: TransactionApiType;

  @ApiProperty({ description: 'รหัสผลลัพธ์ที่ได้จากธนาคาร' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  TSH_RESP_CODE: string;

  @ApiProperty({ description: 'ข้อความอธิบายผลลัพธ์' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  TSH_RESP_MESSAGE: string;
}
