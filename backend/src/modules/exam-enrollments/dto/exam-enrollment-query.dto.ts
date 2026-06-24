import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExamEnrollmentQueryDto {
  @ApiPropertyOptional({ description: 'หมายเลขหน้าเริ่มต้นจาก 1' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'จำนวนรายการต่อหน้า' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

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
