import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ExamReportYearQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ค้นหาชื่อ/รหัส/รอบสอบ' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'รอบสอบ เช่น 1/2026 (ใช้กับรายชื่อผู้เข้าสอบ)',
    example: '1/2026',
  })
  @IsString()
  @IsOptional()
  round?: string;
}
