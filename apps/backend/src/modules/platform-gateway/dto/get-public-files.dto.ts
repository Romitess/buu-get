import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PublicFileItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  downloadName?: string;
}

/**
 * body ของ POST /api/getPublicFiles
 * รองรับทั้ง `files` (หลายไฟล์) หรือ `fileName` เดี่ยว (fallback)
 */
export class GetPublicFilesDto {
  @ApiPropertyOptional({ type: [PublicFileItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicFileItemDto)
  @IsOptional()
  files?: PublicFileItemDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fileName?: string;
}
