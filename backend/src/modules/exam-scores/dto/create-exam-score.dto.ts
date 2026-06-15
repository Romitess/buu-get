import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateExamScoreDto {
  @ApiProperty({ example: 1, description: 'รหัสผู้สมัคร' })
  @IsNumber()
  ERM_ID: number;

  @ApiProperty({
    example: 45.5,
    description: 'คะแนน Language Use',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  SC_LANG_USE_SCORE?: number;

  @ApiProperty({ example: 30.0, description: 'คะแนน Reading', required: false })
  @IsNumber()
  @IsOptional()
  SC_READING_SCORE?: number;

  @ApiProperty({ example: 75.5, description: 'คะแนนรวม', required: false })
  @IsNumber()
  @IsOptional()
  SC_TOTAL_SCORE?: number;

  @ApiProperty({ example: 4, description: 'ระดับ Band', required: false })
  @IsNumber()
  @IsOptional()
  SC_BAND_LEVEL?: number;
}
