import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class EnrollmentAuditListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ค้นหาชื่อ / เลขประจำตัว / test taker' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ description: 'กรองตาม exam' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  examId?: number;

  @ApiPropertyOptional({ description: 'กรองตาม session' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sessionId?: number;

  @ApiPropertyOptional({ description: 'กรองตาม ERM_STATUS' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: number;
}

export class EnrollmentAuditEventsQueryDto {
  @ApiPropertyOptional({ description: 'กรองหมวด: enrollment|payment|profile|passcode|system' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string;
}
