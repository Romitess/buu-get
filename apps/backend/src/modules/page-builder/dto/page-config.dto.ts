import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { PageContentDto } from './page-content.dto';

/** อัปเดตเนื้อหาหน้าทั้งก้อน (sections + boxes) */
export class UpdatePageContentDto {
  @ApiPropertyOptional({
    description: 'โครงสร้าง sections + boxes ทั้งหมดของหน้า',
    type: PageContentDto,
  })
  @ValidateNested()
  @Type(() => PageContentDto)
  @IsOptional()
  PCF_CONTENT?: PageContentDto;
}
