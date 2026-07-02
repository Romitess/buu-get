import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SaveRegulationsDto {
  @ApiProperty({
    description: 'ข้อปฏิบัติสำหรับผู้เข้าสอบ (English)',
    example: '1. Bring your ID card...',
  })
  @IsString()
  regulationsEn: string;

  @ApiProperty({
    description: 'ข้อปฏิบัติสำหรับผู้เข้าสอบ (ไทย)',
    example: '1. นำบัตรประชาชนมาด้วย...',
  })
  @IsString()
  regulationsTh: string;
}
