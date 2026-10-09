import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MoodleAction } from '../entities/moodle-sync-log.entity';

export class CreateMoodleSyncLogDto {
  @ApiPropertyOptional({
    description: 'รหัสผู้ใช้ ว่างได้เมื่อผู้กระทำเป็นบุคลากร',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  USER_ID?: number | null;

  @ApiProperty({
    description: 'การทำงานที่ซิงก์',
    enum: MoodleAction,
    example: MoodleAction.CORE_COURSE_CREATE_COURSES,
  })
  @IsEnum(MoodleAction)
  @IsNotEmpty()
  ML_ACTION: MoodleAction;

  @ApiProperty({
    description: 'ฟังก์ชันเว็บบอร์ด / เว็บเซอร์วิส Moodle',
    maxLength: 100,
    example: 'core_course_create_courses',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ML_WS_FUNCTION: string;

  @ApiProperty({
    description: 'URL ที่ส่งคำขอ',
    maxLength: 255,
    example: 'https://moodle.example.com/webservice/rest/server.php',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ML_REQUEST_URL: string;

  @ApiPropertyOptional({
    description: 'Payload คำขอ',
    example: { name: 'Course A' },
  })
  @IsOptional()
  ML_REQUEST_PAYLOAD?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Body คำตอบกลับ', example: { id: 10 } })
  @IsOptional()
  ML_RESPONSE_BODY?: Record<string, unknown>;

  @ApiProperty({ description: 'HTTP Method', maxLength: 20, example: 'POST' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  ML_HTTP_METHOD: string;

  @ApiPropertyOptional({
    description: 'HTTP Response Status Code',
    example: 200,
  })
  @IsInt()
  @IsOptional()
  ML_HTTP_STATUS?: number;

  @ApiPropertyOptional({
    description: 'รายละเอียดข้อผิดพลาด (ถ้ามี)',
    example: null,
  })
  @IsString()
  @IsOptional()
  ML_ERROR_MASSAGE?: string;

  @ApiProperty({
    description: 'ประเภทอ้างอิง',
    maxLength: 50,
    example: 'course',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ML_REF_TYPE: string;

  @ApiProperty({ description: 'ID อ้างอิงระบบภายใน', example: 1 })
  @IsInt()
  @IsNotEmpty()
  ML_REF_ID: number;

  @ApiProperty({ description: 'ID อ้างอิงระบบ Moodle', example: 10 })
  @IsInt()
  @IsNotEmpty()
  ML_MOODLE_REF_ID: number;
}
