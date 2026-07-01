import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BandRuleDto {
  @ApiProperty({ description: 'ID ของ Band Rule', example: '1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'เลข Band', example: '1' })
  @IsString()
  band: string;

  @ApiProperty({ description: 'คะแนนต่ำสุด', example: 40 })
  @IsNumber()
  minScore: number;

  @ApiProperty({ description: 'คะแนนสูงสุด', example: 49 })
  @IsNumber()
  maxScore: number;

  @ApiProperty({ description: 'ระดับ CEFR', example: 'A2' })
  @IsString()
  cefr: string;

  @ApiProperty({
    description: 'คำอธิบาย Performance Descriptor',
    example: 'Can understand short, simple texts...',
  })
  @IsString()
  descriptor: string;
}

export class SaveBandRulesDto {
  @ApiProperty({
    description: 'รายการ Band Rules ทั้งหมด',
    type: [BandRuleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BandRuleDto)
  bandRules: BandRuleDto[];
}
