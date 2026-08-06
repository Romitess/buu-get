import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ExamScoreQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'กรองคะแนนตามรหัสรอบสอบ (EXAM_ID)' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  examId?: number;

  @ApiPropertyOptional({
    description: 'กรองคะแนนตามรหัสรอบเวลาสอบ (SESSION_ID)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sessionId?: number;
}
