import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestFixDto {
  @ApiProperty({ description: 'กำหนดวันแก้ไขเสร็จสิ้น', example: '2026-05-30' })
  @IsString()
  @IsNotEmpty()
  fixDeadline: string;

  @ApiProperty({
    description: 'เหตุผลในการให้แก้ไข',
    example: ['photo', 'info'],
  })
  @IsArray()
  @IsNotEmpty()
  reasons: string[];

  @ApiProperty({
    description: 'หมายเหตุเพิ่มเติม',
    required: false,
    example: 'รูปถ่ายไม่ชัดเจน',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'ลิงก์หน้าแก้ไขโปรไฟล์',
    example: `${process.env.FRONTEND_URL}/user/profile`,
  })
  @IsString()
  @IsNotEmpty()
  profileUrl: string;
}
