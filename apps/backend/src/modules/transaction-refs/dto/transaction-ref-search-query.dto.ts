import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TransactionRefSearchQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'เลขประจำตัวผู้สมัคร / Ref 1' })
  @IsString()
  @IsOptional()
  ref1?: string;

  @ApiPropertyOptional({ description: 'เลขสมัครสอบ / Ref 2' })
  @IsString()
  @IsOptional()
  ref2?: string;

  @ApiPropertyOptional({ description: 'ชื่อผู้สมัคร ภาษาไทยหรืออังกฤษ' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'ชื่อการสอบ' })
  @IsString()
  @IsOptional()
  examName?: string;
}
