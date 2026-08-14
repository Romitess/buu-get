import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ExamLocationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'ค้นหาชื่อสถานที่หรือเลขห้อง',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'เมื่อ true จะรวมที่นั่งของทุกห้องใน response',
  })
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsOptional()
  includeSeats?: boolean;
}
