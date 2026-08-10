import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitCheckInAssistScanDto {
  @ApiProperty({
    example: 'ENG123456',
    description: 'Test Taker ID / เลขบัตร / Passport จากบาร์โค้ด',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;
}
