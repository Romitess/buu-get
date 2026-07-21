import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ValidatePasscodeDto {
  @ApiProperty({ example: 1, description: 'รหัส session ที่ต้องการสมัคร' })
  @IsNumber()
  SESSION_ID: number;

  @ApiProperty({ example: '123456', description: 'รหัส Passcode' })
  @IsString()
  @IsNotEmpty()
  PASSCODE: string;
}
