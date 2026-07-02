import {
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PasscodeItemDto {
  @ApiProperty({ example: '1100000000000', required: false })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiProperty({ example: 'X12345678', required: false })
  @IsString()
  @IsOptional()
  passportNo?: string;

  @ApiProperty({ example: 'สมชาย ใจดี', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'Somchai Jaidee', required: false })
  @IsString()
  @IsOptional()
  fullNameEn?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  passcode: string;
}

export class CreatePasscodesDto {
  @ApiProperty({ type: [PasscodeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasscodeItemDto)
  passcodes: PasscodeItemDto[];
}
