import { ApiProperty } from '@nestjs/swagger';

export class PasscodeLogResponseDto {
  @ApiProperty({ description: 'รหัส log' })
  logId: number;

  @ApiProperty({ description: 'ชื่อ-นามสกุล' })
  fullName: string;

  @ApiProperty({ description: 'passcode ที่ใช้' })
  passcode: string;

  @ApiProperty({ description: 'วันที่ใช้งาน (YYYY-MM-DD)' })
  usedDate: string;

  @ApiProperty({ description: 'เวลาที่ใช้งาน (HH:mm:ss)' })
  usedTime: string;
}
