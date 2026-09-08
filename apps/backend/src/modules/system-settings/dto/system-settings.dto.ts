import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SYSTEM_SETTINGS_CATALOG } from '../constants/system-settings.catalog';

const ALLOWED_KEYS = SYSTEM_SETTINGS_CATALOG.map((d) => d.key);

export class UpdateSystemSettingItemDto {
  @ApiProperty({ example: 'exam.defaultFeeThb', enum: ALLOWED_KEYS })
  @IsString()
  @IsIn(ALLOWED_KEYS)
  key: string;

  @ApiProperty({ example: '500', description: 'ค่าใหม่ (ส่งเป็น string เสมอ)' })
  @IsString()
  @MaxLength(2000)
  value: string;
}

export class UpdateSystemSettingsDto {
  @ApiProperty({ type: [UpdateSystemSettingItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateSystemSettingItemDto)
  settings: UpdateSystemSettingItemDto[];
}

export class SystemSettingItemDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  group: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  defaultValue: string;

  @ApiProperty()
  descriptionTh: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  updatedBy?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  updatedAt?: string | null;
}

export class SystemSettingsGroupedResponseDto {
  @ApiProperty({ type: [SystemSettingItemDto] })
  settings: SystemSettingItemDto[];
}
