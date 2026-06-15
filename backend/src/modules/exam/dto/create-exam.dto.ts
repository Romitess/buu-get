import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: '1/2026', required: false })
  @IsOptional()
  @IsString()
  EXAM_ROUND?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  FUND_SOURCE_ID?: number;
}
