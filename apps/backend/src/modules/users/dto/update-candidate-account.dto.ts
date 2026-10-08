import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCandidateAccountDto {
  @ApiProperty({ example: 'student@buu.ac.th', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(13)
  userNationalId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userTitleTh?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userFullnameTh?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userTitleEn?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userFullnameEn?: string;

  @ApiProperty({ example: '2004-04-11', required: false })
  @IsOptional()
  @IsString()
  userDateOfBirth?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userEducation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userFaculty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userInstitution?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userCountry?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userRemark?: string;
}
