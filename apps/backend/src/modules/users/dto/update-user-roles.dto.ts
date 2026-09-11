import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description:
      'รายการ ROLE_ID สำหรับ USER_ROLES (legacy auth/JWT). บทบาทเจ้าหน้าที่แหล่งจริงอยู่ที่ PATCH /msg-persons/:psnId/roles',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  roleIds!: number[];
}
