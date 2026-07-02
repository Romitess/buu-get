import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class LatestImagesDto {
  @ApiProperty({
    description: 'รายการ userProfileId ที่ต้องการรูปโปรไฟล์ล่าสุดจากประวัติ',
    example: [101, 102, 103],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @IsInt({ each: true })
  profileIds: number[];
}
