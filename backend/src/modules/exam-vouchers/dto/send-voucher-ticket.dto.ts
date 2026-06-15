import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVoucherTicketDto {
  @ApiProperty({ description: 'อีเมลผู้เข้าสอบ' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'ชื่อ-นามสกุลผู้เข้าสอบ' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'รอบสอบ' })
  @IsString()
  @IsNotEmpty()
  examName: string;

  @ApiProperty({ description: 'ลิงก์ประวัติการสอบ' })
  @IsString()
  @IsNotEmpty()
  historyUrl: string;
}
