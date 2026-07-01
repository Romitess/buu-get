import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateFundSourceDto {
  @ApiProperty({ description: 'คณะ', maxLength: 50, example: 'คณะวิทยาศาสตร์' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  FS_FACULTY: string;

  @ApiProperty({ description: 'รหัสบัญชี', maxLength: 50, example: 'ACC-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  FS_ACCOUNT_CODE: string;

  @ApiProperty({
    description: 'ชื่อแหล่งทุน',
    maxLength: 255,
    example: 'ทุนสนับสนุนการศึกษา',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  FS_NAME: string;

  @ApiPropertyOptional({ description: 'สถานะการเปิดใช้', default: true })
  @IsBoolean()
  @IsOptional()
  FS_OPEN_STATUS?: boolean;
}
