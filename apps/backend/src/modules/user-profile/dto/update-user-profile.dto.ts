import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserProfileDto } from './create-user-profile.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {
  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFromEmail?: boolean;
}
