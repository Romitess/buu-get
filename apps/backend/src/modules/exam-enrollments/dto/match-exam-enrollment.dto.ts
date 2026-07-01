import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class MatchExamEnrollmentDto {
  @ApiProperty({
    description: 'List of reference numbers (applicantId or referenceNo)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  refs: string[];
}
