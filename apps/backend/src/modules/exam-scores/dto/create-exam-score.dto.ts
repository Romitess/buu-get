import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExamScoreLineInputDto {
  @ApiProperty({ example: 1, description: 'รหัสรายการในชุดเกณฑ์' })
  @IsNumber()
  SRBI_ID: number;

  @ApiProperty({ example: 45.5, description: 'คะแนนที่ได้' })
  @IsNumber()
  score: number;
}

export class CreateExamScoreDto {
  @ApiProperty({ example: 1, description: 'รหัสผู้สมัคร' })
  @IsNumber()
  ERM_ID: number;

  @ApiProperty({
    type: [ExamScoreLineInputDto],
    description: 'คะแนนรายหมวดตามชุดเกณฑ์ของรอบสอบ',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExamScoreLineInputDto)
  lines: ExamScoreLineInputDto[];

  /** @deprecated ระบบจะคำนวณจากคะแนนรวมตาม BUU_GET_T_SCORE_CRITERIA และจะไม่ใช้ค่าจาก client */
  @ApiProperty({
    example: 'B1',
    description: 'ระดับ CEFR (deprecated, ignored)',
    required: false,
  })
  @IsOptional()
  SC_BAND_LEVEL?: string | number | null;

  /** @deprecated ใช้ lines แทน — รองรับ backward compat ช่วงเปลี่ยนผ่าน */
  @ApiProperty({ required: false, deprecated: true })
  @IsNumber()
  @IsOptional()
  SC_LANG_USE_SCORE?: number;

  /** @deprecated ใช้ lines แทน */
  @ApiProperty({ required: false, deprecated: true })
  @IsNumber()
  @IsOptional()
  SC_READING_SCORE?: number;

  /** @deprecated คำนวณจาก lines */
  @ApiProperty({ required: false, deprecated: true })
  @IsNumber()
  @IsOptional()
  SC_TOTAL_SCORE?: number;
}
