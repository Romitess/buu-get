import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PageSectionType } from '../entities/page-config.entity';

/** ข้อความสองภาษา { th, en } */
export class LocalizedTextDto {
  @ApiPropertyOptional({ description: 'ข้อความภาษาไทย' })
  @IsString()
  @IsOptional()
  th?: string | null;

  @ApiPropertyOptional({ description: 'ข้อความภาษาอังกฤษ' })
  @IsString()
  @IsOptional()
  en?: string | null;
}

// ---------- Box DTOs (แยกตามชนิด section) ----------

export class BannerBoxDto {
  @ApiProperty({ description: 'ลำดับสไลด์', example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiProperty({
    description: 'path รูปภาพใน object storage',
    maxLength: 250,
    example: 'uploads/banners/banner1.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  imagePath: string;

  @ApiPropertyOptional({ description: 'แสดง/ซ่อน', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class CardBoxDto {
  @ApiProperty({ description: 'ลำดับการ์ด', example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({ description: 'หัวข้อการ์ด (ไทย/อังกฤษ)' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsOptional()
  title?: LocalizedTextDto;

  @ApiPropertyOptional({ description: 'รายละเอียดการ์ด (ไทย/อังกฤษ)' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsOptional()
  subtitle?: LocalizedTextDto;

  @ApiPropertyOptional({
    description: 'ไอคอนการ์ด (Material icon name)',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string | null;

  @ApiPropertyOptional({ description: 'แสดง/ซ่อน', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class StepBoxDto {
  @ApiProperty({ description: 'ลำดับขั้นตอน', example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({ description: 'หัวข้อขั้นตอน (ไทย/อังกฤษ)' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsOptional()
  title?: LocalizedTextDto;

  @ApiPropertyOptional({ description: 'รายละเอียดขั้นตอน (ไทย/อังกฤษ)' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsOptional()
  description?: LocalizedTextDto;

  @ApiPropertyOptional({ description: 'แสดง/ซ่อน', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class ExamRuleBoxDto {
  @ApiProperty({ description: 'ลำดับข้อปฏิบัติ', example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'ไอคอนข้อปฏิบัติ (Material icon name)',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string | null;

  @ApiPropertyOptional({ description: 'ข้อความข้อปฏิบัติ (ไทย/อังกฤษ)' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsOptional()
  text?: LocalizedTextDto;

  @ApiPropertyOptional({ description: 'แสดง/ซ่อน', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

// ---------- Section DTOs (discriminated by `type`) ----------

class BaseSectionDto {
  @ApiPropertyOptional({
    description: 'ไอคอนหัวข้อ section (Material icon name)',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string | null;

  @ApiProperty({ description: 'ลำดับการแสดงผลของ section', example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({ description: 'หัวข้อ section (ไทย/อังกฤษ)' })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  @IsOptional()
  title?: LocalizedTextDto;

  @ApiPropertyOptional({ description: 'แสดง/ซ่อน section', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class BannerSectionDto extends BaseSectionDto {
  @ApiProperty({ enum: [PageSectionType.BANNER] })
  @IsEnum(PageSectionType)
  type: PageSectionType.BANNER;

  @ApiProperty({ type: [BannerBoxDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerBoxDto)
  boxes: BannerBoxDto[];
}

export class CardSectionDto extends BaseSectionDto {
  @ApiProperty({ enum: [PageSectionType.CARD] })
  @IsEnum(PageSectionType)
  type: PageSectionType.CARD;

  @ApiProperty({ type: [CardBoxDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardBoxDto)
  boxes: CardBoxDto[];
}

export class StepSectionDto extends BaseSectionDto {
  @ApiProperty({ enum: [PageSectionType.STEP] })
  @IsEnum(PageSectionType)
  type: PageSectionType.STEP;

  @ApiProperty({ type: [StepBoxDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepBoxDto)
  boxes: StepBoxDto[];
}

export class ExamRuleSectionDto extends BaseSectionDto {
  @ApiProperty({ enum: [PageSectionType.EXAM_RULE] })
  @IsEnum(PageSectionType)
  type: PageSectionType.EXAM_RULE;

  @ApiProperty({ type: [ExamRuleBoxDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamRuleBoxDto)
  boxes: ExamRuleBoxDto[];
}

export type SectionDto =
  | BannerSectionDto
  | CardSectionDto
  | StepSectionDto
  | ExamRuleSectionDto;

export class PageContentDto {
  @ApiProperty({
    description: 'รายการ section (banner/card/step/exam_rule) พร้อม boxes',
    type: 'array',
    items: {
      oneOf: [
        { $ref: '#/components/schemas/BannerSectionDto' },
        { $ref: '#/components/schemas/CardSectionDto' },
        { $ref: '#/components/schemas/StepSectionDto' },
        { $ref: '#/components/schemas/ExamRuleSectionDto' },
      ],
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BaseSectionDto, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: BannerSectionDto, name: PageSectionType.BANNER },
        { value: CardSectionDto, name: PageSectionType.CARD },
        { value: StepSectionDto, name: PageSectionType.STEP },
        { value: ExamRuleSectionDto, name: PageSectionType.EXAM_RULE },
      ],
    },
  })
  sections: SectionDto[];
}
