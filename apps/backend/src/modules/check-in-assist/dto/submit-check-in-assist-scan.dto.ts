import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { normalizeAssistScanCode } from '../utils/normalize-assist-scan-code.util';

export class SubmitCheckInAssistScanDto {
  @ApiProperty({
    example: 'ENG123456',
    description: 'Test Taker ID / เลขบัตร / Passport จากบาร์โค้ด',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizeAssistScanCode(value) : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  code: string;
}
