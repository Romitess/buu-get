import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { UserProfile } from '../../user-profile/entities/user-profile.entity';
import { Role } from '../../roles/entities/role.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  USER_ID: number;

  @ApiProperty({ example: '69000001', nullable: true })
  USER_CODE: string | null;

  @ApiProperty({ example: '1234567890123', nullable: true })
  USER_NATIONAL_ID: string | null;

  @ApiProperty({ example: 'AB1234567', nullable: true })
  USER_PASSPORT_NO: string | null;

  @ApiProperty({ example: 'student@buu.ac.th' })
  USER_EMAIL: string;

  @ApiProperty({ example: 'active' })
  USER_STATUS: string;

  @ApiProperty()
  CREATED_AT: Date;

  @ApiProperty()
  UPDATED_AT: Date;

  @ApiProperty({ nullable: true })
  USER_IMAGE?: string | null;

  @ApiProperty({ required: false, type: () => UserProfile })
  PROFILE?: UserProfile;

  @ApiProperty({ required: false, type: () => [Role] })
  ROLES_ID?: Role[];

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.USER_ID = user.USER_ID;
    dto.USER_CODE = user.USER_CODE;
    dto.USER_NATIONAL_ID = user.USER_NATIONAL_ID;
    dto.USER_PASSPORT_NO = user.USER_PASSPORT_NO;
    dto.USER_EMAIL = user.USER_EMAIL;
    dto.USER_STATUS = user.USER_STATUS;
    dto.CREATED_AT = user.CREATED_AT;
    dto.UPDATED_AT = user.UPDATED_AT;

    if (user.PROFILE) {
      dto.PROFILE = user.PROFILE;
    }

    if (user.ROLES_ID) {
      dto.ROLES_ID = user.ROLES_ID;
    }

    if (user.IMAGE) {
      dto.USER_IMAGE = user.IMAGE.USER_IMAGE_URL;
    }

    return dto;
  }
}
