import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ExecutiveTestTakerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by test taker ID, title, or full name',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
