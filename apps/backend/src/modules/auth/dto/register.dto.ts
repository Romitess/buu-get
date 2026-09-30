import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'student@buu.ac.th' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'thai', enum: ['thai', 'foreigner'] })
  @IsString()
  @IsNotEmpty()
  userType: 'thai' | 'foreigner';

  @ApiProperty({ example: '1234567890123', required: false })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiProperty({ example: 'Thailand', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'นาย', required: false })
  @IsOptional()
  @IsString()
  titleTH?: string;

  @ApiProperty({ example: 'Mr.', required: false })
  @IsOptional()
  @IsString()
  titleEN?: string;

  @ApiProperty({ example: 'สมชาย ใจดี', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ example: 'Somchai Jaidee', required: false })
  @IsOptional()
  @IsString()
  englishName?: string;

  @ApiProperty({ example: '0812345678', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '1990-01-15', required: false })
  @IsOptional()
  @IsString()
  birthdate?: string;

  @ApiProperty({ example: 'ปริญญาตรี', required: false })
  @IsOptional()
  @IsString()
  educationLevel?: string;

  @ApiProperty({ example: 'คณะวิทยาการสารสนเทศ', required: false })
  @IsOptional()
  @IsString()
  faculty?: string;

  @ApiProperty({ example: 'มหาวิทยาลัยบูรพา', required: false })
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiProperty({ example: '104/13 ถ.มาบมะยม', required: false })
  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @ApiProperty({
    required: false,
    description:
      'ตั๋วจาก ThaID ที่ยังไม่หมดอายุ ใช้ตั้ง userThaidSynced เมื่อเลขบัตรตรงกับที่ตรวจแล้ว',
  })
  @IsOptional()
  @IsString()
  thaidRegistrationToken?: string;

  @ApiProperty({
    example: 'data:image/jpeg;base64,/9j/4AAQ...',
    required: false,
    description:
      'รูปโปรไฟล์: รับได้ทั้ง data URL (base64 — backend จะ upload ไป /user_images/{userId}/ ให้) หรือ path ที่ upload มาแล้ว',
  })
  @IsOptional()
  @IsString()
  profileImage?: string;
}
