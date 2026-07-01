import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDate,
} from 'class-validator';

export class CreateUserProfileInlineDto {
  @ApiProperty({ example: 'นาย', required: false })
  @IsOptional()
  @IsString()
  userTitleTh?: string;

  @ApiProperty({ example: 'สมชาย ใจดี', required: false })
  @IsOptional()
  @IsString()
  userFullnameTh?: string;

  @ApiProperty({ example: 'Mr.', required: false })
  @IsOptional()
  @IsString()
  userTitleEn?: string;

  @ApiProperty({ example: 'Somchai Jaidee', required: false })
  @IsOptional()
  @IsString()
  userFullnameEn?: string;

  @ApiProperty({ example: '1990-01-15', required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  userDateOfBirth?: Date;

  @ApiProperty({ example: '0812345678', required: false })
  @IsOptional()
  @IsString()
  userPhone?: string;

  @ApiProperty({ example: 'ปริญญาตรี', required: false })
  @IsOptional()
  @IsString()
  userEducation?: string;

  @ApiProperty({ example: 'คณะวิทยาการสารสนเทศ', required: false })
  @IsOptional()
  @IsString()
  userFaculty?: string;

  @ApiProperty({ example: 'มหาวิทยาลัยบูรพา', required: false })
  @IsOptional()
  @IsString()
  userInstitution?: string;

  @ApiProperty({ example: 'Thailand', required: false })
  @IsOptional()
  @IsString()
  userCountry?: string;

  @ApiProperty({ example: '123 ถ.ลงหาดบางแสน', required: false })
  @IsOptional()
  @IsString()
  userAddress?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: '1234567890123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(13)
  @MaxLength(13)
  USER_NATIONAL_ID?: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  USER_PASSPORT_NO?: string;

  @ApiProperty({ example: 'student@example.com' })
  @IsEmail()
  USER_EMAIL: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  USER_PASSWORD: string;

  @ApiProperty({ example: 'active', required: false })
  @IsOptional()
  @IsString()
  USER_STATUS?: string;

  @ApiProperty({ type: [Number], description: 'รหัสบทบาท' })
  @IsArray()
  USER_ROLES: number[];

  @ApiProperty({
    type: CreateUserProfileInlineDto,
    required: false,
    description: 'ข้อมูลโปรไฟล์ผู้ใช้',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUserProfileInlineDto)
  profile?: CreateUserProfileInlineDto;
}
