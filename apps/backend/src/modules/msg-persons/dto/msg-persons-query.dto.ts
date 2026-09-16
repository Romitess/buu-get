import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
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

  @ApiPropertyOptional({
    description:
      'เมื่อ true จะไม่รวมบุคลากรที่เกษียณ (PSN_RETIRE = Y) — default ไม่กรอง',
  })
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsOptional()
  @IsBoolean()
  excludeRetired?: boolean;
}
