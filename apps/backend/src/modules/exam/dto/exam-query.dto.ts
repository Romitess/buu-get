import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ExamQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'ค้นหาชื่อการสอบ, รอบสอบ หรือปีงบประมาณ',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
