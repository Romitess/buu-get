import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProfileEditHistoryDto {
  @IsInt()
  @IsNotEmpty()
  userProfileId: number;

  @IsInt()
  @IsNotEmpty()
  modifierId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  modifierName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modifierRole: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  modifiedFields: string;

  @IsString()
  @IsOptional()
  oldValues?: string;

  @IsString()
  @IsOptional()
  newValues?: string;
}
