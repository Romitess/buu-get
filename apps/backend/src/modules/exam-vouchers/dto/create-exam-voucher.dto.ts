import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExamVoucherDto {
  @ApiProperty({ example: 1, description: 'รหัสผู้สมัคร' })
  @IsInt()
  @IsNotEmpty()
  ERM_ID: number;

  @ApiProperty({ example: 'VC-2024-001', description: 'รหัสบัตรสอบ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  VC_CODE: string;
}
