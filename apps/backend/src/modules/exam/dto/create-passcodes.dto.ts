import {
  IsString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PASSCODE_LENGTH, PASSCODE_PATTERN } from '../constants/exam.constants';

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

  @ApiProperty({ example: 'ABC123' })
  @IsString()
  @IsNotEmpty()
  @Length(PASSCODE_LENGTH, PASSCODE_LENGTH)
  @Matches(PASSCODE_PATTERN, {
    message: 'passcode must be exactly 6 alphanumeric characters',
  })
  passcode: string;
}

export class CreatePasscodesDto {
  @ApiProperty({ type: [PasscodeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PasscodeItemDto)
  passcodes: PasscodeItemDto[];
}
