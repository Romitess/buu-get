import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserProfileDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: 'นาย', required: false })
  @IsString()
  @IsOptional()
  userTitleTh?: string;

  @ApiProperty({ example: 'สมชาย ใจดี', required: false })
  @IsString()
  @IsOptional()
  userFullnameTh?: string;

  @ApiProperty({ example: 'Mr.', required: false })
  @IsString()
  @IsOptional()
  userTitleEn?: string;

  @ApiProperty({ example: 'Somchai Jaidee', required: false })
  @IsString()
  @IsOptional()
  userFullnameEn?: string;

  @ApiProperty({ example: '1990-01-15', required: false })
  @IsOptional()
  userDateOfBirth?: Date;

  @ApiProperty({ example: '0812345678', required: false })
  @IsString()
  @IsOptional()
  userPhone?: string;

  @ApiProperty({ example: 'ปริญญาตรี', required: false })
  @IsString()
  @IsOptional()
  userEducation?: string;

  @ApiProperty({ example: 'คณะวิทยาการสารสนเทศ', required: false })
  @IsString()
  @IsOptional()
  userFaculty?: string;

  @ApiProperty({ example: 'มหาวิทยาลัยบูรพา', required: false })
  @IsString()
  @IsOptional()
  userInstitution?: string;

  @ApiProperty({ example: 'Thailand', required: false })
  @IsString()
  @IsOptional()
  userCountry?: string;

  @ApiProperty({ example: '123 ถ.ลงหาดบางแสน', required: false })
  @IsString()
  @IsOptional()
  userAddress?: string | null;

  @ApiProperty({ example: 'กรุณาแก้ไขรูปถ่าย', required: false })
  @IsOptional()
  @IsString()
  userRemark?: string;

  @ApiProperty({ example: '1234567890123', required: false })
  @IsOptional()
  @IsString()
  userNationalId?: string;

  @ApiProperty({ example: 'uploaded_files/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  userImagePath?: string;
}
