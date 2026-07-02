import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ExamEnrollmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'คำค้นหา (ชื่อ-นามสกุล, เลขประจำตัวประชาชน/พาสปอร์ต, อีเมล, รหัสผู้สมัคร)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'รหัสรอบเวลาสอบ' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sessionId?: number;

  @ApiPropertyOptional({ description: 'รหัสสถานที่สอบ/ห้องสอบ' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sessionLocationId?: number;

  @ApiPropertyOptional({ description: 'คอลัมน์ที่ต้องการจัดเรียง' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'จัดเรียงจากมากไปน้อย' })
  @IsOptional()
  descending?: boolean | string;
}
