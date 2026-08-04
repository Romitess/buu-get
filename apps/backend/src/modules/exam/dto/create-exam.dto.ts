import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** ปีงบประมาณต้องเป็นปี ค.ศ. 4 หลัก (ช่วง 1900–2199) — ตรงกับ frontend */
const EXAM_FISCAL_YEAR_AD_REGEX = /^(19|20|21)\d{2}$/;

export class CreateExamDto {
  @ApiProperty({ example: 'สอบกลางภาค' })
  @IsString()
  EXAM_NAME: string;

  @ApiProperty({ example: 'กลางภาค', required: false })
  @IsOptional()
  @IsString()
  EXAM_TYPE?: string;

  @ApiProperty({ example: 'ปรนัย', required: false })
  @IsOptional()
  @IsString()
  EXAM_FORMAT?: string;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  EXAM_FEE?: number;

  @ApiProperty({ example: '2024-05-20', required: false })
  @IsOptional()
  @IsDateString()
  EXAM_DATE?: string;

  @ApiProperty({ example: '2024-05-01T09:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  EXAM_REG_START_DATE?: string;

  @ApiProperty({ example: '2024-05-15T16:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  EXAM_REG_END_DATE?: string;

  @ApiProperty({ example: '2024-05-01T09:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  EXAM_PAY_START_DATE?: string;

  @ApiProperty({ example: '2024-05-15T16:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  EXAM_PAY_END_DATE?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  EXAM_PUBLISHED?: boolean;

  @ApiProperty({ example: 'COURSE123', required: false })
  @IsOptional()
  @IsString()
  EXAM_MOODLE_COURSE_ID?: string;

  @ApiProperty({ example: '1', required: false, description: 'ครั้งที่จัดสอบ' })
  @IsOptional()
  @IsString()
  EXAM_ROUND?: string;

  @ApiProperty({
    example: '2026',
    required: false,
    description: 'ปีงบประมาณ (ค.ศ. 4 หลัก เช่น 2026)',
  })
  @IsOptional()
  @IsString()
  @Matches(EXAM_FISCAL_YEAR_AD_REGEX, {
    message: 'EXAM_FISCAL_YEAR must be a 4-digit AD year (e.g. 2026)',
  })
  EXAM_FISCAL_YEAR?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  FUND_SOURCE_ID?: number;

  @ApiProperty({ example: 1, description: 'รหัสชุดเกณฑ์คะแนน' })
  @IsNumber()
  SRB_ID: number;
}
