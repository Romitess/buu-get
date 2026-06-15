import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'ชื่อบทบาท', example: 'candidate' })
  @IsString()
  @IsNotEmpty()
  ROLE_NAME: string;

  @ApiProperty({ description: 'รายละเอียดบทบาท', example: 'ผู้เข้าสอบ' })
  @IsString()
  @IsNotEmpty()
  ROLE_DESCRIPTION: string;
}
