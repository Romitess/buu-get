import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
} from 'class-validator';

export class CheckUserIdentifiersDto {
  @ApiProperty({
    description: 'รหัสประชาชนหรือเลข passport ที่ต้องการตรวจสอบ',
    type: [String],
    example: ['1234567890123'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @IsString({ each: true })
  identifiers: string[];
}

export class UserIdentifierCheckResultDto {
  @ApiProperty({ description: 'รหัสที่ส่งมาตรวจสอบ' })
  identifier: string;

  @ApiProperty({ description: 'true หากพบผู้ใช้ในระบบ' })
  exists: boolean;
}

export class CheckUserIdentifiersResponseDto {
  @ApiProperty({ type: [UserIdentifierCheckResultDto] })
  results: UserIdentifierCheckResultDto[];
}
