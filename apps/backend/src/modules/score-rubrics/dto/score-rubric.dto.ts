import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreRubricItemInputDto {
  @ApiProperty({ example: 'คำศัพท์และไวยากรณ์' })
  @IsString()
  @IsNotEmpty()
  nameTh: string;

  @ApiProperty({ example: 'Vocabulary & Grammar' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  sortOrder: number;

  @ApiProperty({ example: 'LANG_USE', required: false })
  @IsOptional()
  @IsString()
  code?: string;
}

export class CreateScoreRubricDto {
  @ApiProperty({ example: 'BUU-GET Standard' })
  @IsString()
  @IsNotEmpty()
  nameTh: string;

  @ApiProperty({ example: 'BUU-GET Standard' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({ type: [ScoreRubricItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScoreRubricItemInputDto)
  items: ScoreRubricItemInputDto[];
}

export class UpdateScoreRubricDto {
  @ApiProperty({ example: 'BUU-GET Standard', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameTh?: string;

  @ApiProperty({ example: 'BUU-GET Standard', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nameEn?: string;

  @ApiProperty({ type: [ScoreRubricItemInputDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScoreRubricItemInputDto)
  items?: ScoreRubricItemInputDto[];
}

export class ScoreRubricItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nameTh: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty({ nullable: true })
  code: string | null;

  @ApiProperty()
  maxScore: number;

  @ApiProperty()
  sortOrder: number;
}

export class ScoreRubricResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  nameTh: string;

  @ApiProperty()
  nameEn: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ type: [ScoreRubricItemResponseDto] })
  items: ScoreRubricItemResponseDto[];
}
