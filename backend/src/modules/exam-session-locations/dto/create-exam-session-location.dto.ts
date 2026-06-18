import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamSessionLocationDto {
  @ApiProperty({ example: 1, description: 'รหัสสถานที่จัดสอบ (FK)' })
  @IsInt()
  LOCATION_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสรอบสอบ (FK)' })
  @IsInt()
  SS_ID: number;

  @ApiProperty({
    example: 'อ.สมชาย',
    required: false,
    description: 'ชื่อกรรมการคุมสอบประจำห้องสอบ',
  })
  @IsOptional()
  @IsString()
  SS_NAME?: string | null;
}
