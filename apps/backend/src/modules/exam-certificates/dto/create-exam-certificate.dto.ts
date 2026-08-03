import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateExamCertificateDto {
  @ApiProperty({ example: 1, description: 'รหัสคะแนนสอบ' })
  @IsNumber()
  SCORES_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสผู้ใช้' })
  @IsNumber()
  USER_ID: number;

  @ApiProperty({
    example: '2024-05-01T00:00:00Z',
    description: 'วันที่ออกใบรับรอง',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  CERT_ISSUED_AT?: string;

  @ApiProperty({
    example: '2026-05-01T00:00:00Z',
    description: 'วันที่ใบรับรองหมดอายุ',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  CERT_EXPIRES_AT?: string;

  @ApiProperty({
    example: 'A1B2C3D4E5F6G7H8',
    description: 'รหัสตรวจสอบใบรับรอง (16 ตัว A-Z0-9)',
    required: false,
  })
  @IsOptional()
  @IsString()
  CERT_CODE?: string;
}
