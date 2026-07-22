import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class UsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'กรองตามชื่อ role' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'ค้นหาด้วยเลขบัตรประชาชน, passport, อีเมล หรือชื่อ-นามสกุล',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
