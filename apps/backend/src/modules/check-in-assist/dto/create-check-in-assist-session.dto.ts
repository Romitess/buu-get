import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class CreateCheckInAssistSessionDto {
  @ApiProperty({ example: 12, description: 'รหัสการสอบ' })
  @IsInt()
  @Min(1)
  examId: number;

  @ApiProperty({
    example: [101, 102],
    description: 'รายการ SS_ID ของรอบเวลาที่ active',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  sessionIds: number[];
}
