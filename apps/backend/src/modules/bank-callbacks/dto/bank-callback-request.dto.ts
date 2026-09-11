import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BankCallbackRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prodCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  command?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cusName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref3?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref4?: string;

  @ApiPropertyOptional({ description: 'Required for payment callback' })
  @IsOptional()
  @IsString()
  tranxId?: string;
}
