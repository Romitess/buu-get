import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BulkIssueCertificateCandidateDto {
  @ApiProperty({ example: 1, description: 'รหัสคะแนนสอบ' })
  @IsNumber()
  SCORES_ID: number;

  @ApiProperty({ example: 1, description: 'รหัสผู้ใช้' })
  @IsNumber()
  USER_ID: number;
}

export class BulkIssueCertificatesDto {
  @ApiProperty({
    description: 'รายการผู้เข้าสอบที่จะออกใบรับรอง',
    type: [BulkIssueCertificateCandidateDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkIssueCertificateCandidateDto)
  candidates: BulkIssueCertificateCandidateDto[];

  @ApiProperty({
    example: '2026-07-27T00:00:00+07:00',
    description: 'วันที่ออกใบรับรอง (Report Issue Date)',
  })
  @IsDateString()
  @IsNotEmpty()
  certIssuedAt: string;

  @ApiProperty({
    example: '2028-07-27T00:00:00+07:00',
    description: 'วันที่ใบรับรองหมดอายุ (Score Valid Until)',
  })
  @IsDateString()
  @IsNotEmpty()
  certExpiresAt: string;

  @ApiProperty({ description: 'ชื่อรอบสอบ' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ description: 'ลิงก์ประวัติการสอบ' })
  @IsString()
  @IsNotEmpty()
  historyUrl: string;
}
