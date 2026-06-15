import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PageContentDto } from './page-content.dto';

export class CreatePageConfigDto {
  @ApiProperty({ description: 'ชื่อชุดหน้า', example: 'Set A', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  PCF_NAME: string;

  @ApiPropertyOptional({ description: 'เปิดใช้งานชุดนี้', default: false })
  @IsBoolean()
  @IsOptional()
  PCF_ACTIVE?: boolean;

  @ApiPropertyOptional({
    description: 'โครงสร้าง sections + boxes ทั้งหมดของหน้า',
    type: PageContentDto,
  })
  @ValidateNested()
  @Type(() => PageContentDto)
  @IsOptional()
  PCF_CONTENT?: PageContentDto;
}

export class UpdatePageConfigDto extends PartialType(CreatePageConfigDto) {}
