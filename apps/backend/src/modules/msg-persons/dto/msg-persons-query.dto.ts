import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class MsgPersonsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'กรองตามชื่อ role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'ค้นหาด้วยรหัสบุคลากร, username, อีเมล หรือชื่อ-นามสกุล',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
